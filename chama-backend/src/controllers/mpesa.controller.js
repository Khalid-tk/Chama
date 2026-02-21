import prisma from '../prisma.js'
import {
  initiateStkPush as initiateStkPushService,
  handleCallback as handleCallbackService,
} from '../services/mpesa.service.js'
import { paginateResponse } from '../utils/format.js'

/**
 * Internal: process a callback by checkoutRequestId (used by real Daraja callback and dev simulate).
 * Finds payment, updates status (SUCCESS if resultCode is 0, else FAILED), and on SUCCESS
 * runs handleCallbackService (Contribution/Repayment + Transaction + Loan update).
 * @returns {{ updatedPayment }}
 */
export async function processCallbackByCheckoutRequestId(checkoutRequestId, resultCode, mpesaReceiptNo = null) {
  if (!checkoutRequestId) {
    throw new Error('checkoutRequestId is required')
  }

  const payment = await prisma.mpesaPayment.findFirst({
    where: { checkoutRequestId },
  })

  if (!payment) {
    throw new Error(`Payment not found for CheckoutRequestID: ${checkoutRequestId}`)
  }

  const isSuccess = resultCode === 0 || resultCode === '0'
  const status = isSuccess ? 'SUCCESS' : 'FAILED'

  const updatedPayment = await prisma.mpesaPayment.update({
    where: { id: payment.id },
    data: {
      status,
      mpesaReceiptNo: mpesaReceiptNo || payment.mpesaReceiptNo,
      resultCode: String(resultCode),
      resultDesc: isSuccess ? 'Payment processed' : 'Payment failed or cancelled',
    },
  })

  if (updatedPayment.status === 'SUCCESS') {
    await handleCallbackService(payment, updatedPayment)
    const chama = await prisma.chama.findUnique({ where: { id: payment.chamaId }, select: { name: true } })
    const user = await prisma.user.findUnique({ where: { id: payment.userId }, select: { email: true } })
    const chamaName = chama?.name || 'Chama'
    try {
      const { enqueueEmail } = await import('../services/email/emailQueue.js')
      const { contributionReceived, repaymentReceived } = await import('../services/email/templates/index.js')
      const { createNotification } = await import('../services/notification.service.js')
      if (payment.purpose === 'CONTRIBUTION') {
        if (user?.email) {
          const html = contributionReceived({ chamaName, chamaId: payment.chamaId, amount: payment.amount, currency: 'KES' })
          await enqueueEmail({
            to: user.email,
            subject: `Contribution received – ${chamaName}`,
            html,
          })
        }
        await createNotification({
          userId: payment.userId,
          chamaId: payment.chamaId,
          type: 'CONTRIBUTION_RECEIVED',
          title: 'Contribution received',
          message: `Your contribution of KES ${payment.amount?.toLocaleString() || 0} to ${chamaName} has been received.`,
          actionUrl: `/chama/${payment.chamaId}/contributions`,
        })
      } else if (payment.purpose === 'REPAYMENT') {
        if (user?.email) {
          const html = repaymentReceived({ chamaName, chamaId: payment.chamaId, amount: payment.amount, currency: 'KES' })
          await enqueueEmail({
            to: user.email,
            subject: `Repayment received – ${chamaName}`,
            html,
          })
        }
        await createNotification({
          userId: payment.userId,
          chamaId: payment.chamaId,
          type: 'REPAYMENT_RECEIVED',
          title: 'Repayment received',
          message: `Your repayment of KES ${payment.amount?.toLocaleString() || 0} for ${chamaName} has been received.`,
          actionUrl: `/chama/${payment.chamaId}/repayments`,
        })
      }
    } catch (e) {
      console.error('Mpesa success email/notification error:', e)
    }
  }

  return { updatedPayment }
}

const MPESA_DEMO_MODE = process.env.MPESA_DEMO_MODE === 'true'

export async function initiateStkPush(req, res, next) {
  let payment = null
  try {
    const { chamaId } = req.params
    const { purpose, amount, phone, loanId } = req.body

    payment = await prisma.mpesaPayment.create({
      data: {
        chamaId,
        userId: req.user.id,
        purpose,
        amount,
        phone,
        loanId: loanId || null,
        status: 'PENDING',
      },
    })

    if (MPESA_DEMO_MODE) {
      const ts = Date.now()
      const merchantRequestId = `demo-${ts}`
      const checkoutRequestId = `demo-${ts}`

      const updatedPayment = await prisma.mpesaPayment.update({
        where: { id: payment.id },
        data: {
          checkoutRequestId,
          merchantRequestId,
        },
      })

      const stkResponse = {
        MerchantRequestID: merchantRequestId,
        CheckoutRequestID: checkoutRequestId,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. Request accepted',
      }

      res.json({
        success: true,
        message: 'STK push initiated. Please check your phone.',
        data: {
          id: updatedPayment.id,
          payment: updatedPayment,
          safaricom: stkResponse,
          demoMode: true,
        },
      })

      setTimeout(async () => {
        try {
          await processCallbackByCheckoutRequestId(checkoutRequestId, 0, 'DEMO123456')
          console.log('MPESA DEMO MODE — Payment simulated successfully')
        } catch (err) {
          console.error('MPESA DEMO MODE — Simulated callback failed:', err)
        }
      }, 2000)

      return
    }

    const { config } = await import('../config/env.js')
    const callbackUrl = config.mpesa.callbackUrl
      ? config.mpesa.callbackUrl.trim()
      : null

    if (config.mpesa.consumerKey && !callbackUrl) {
      return res.status(400).json({
        success: false,
        message:
          'MPESA_CALLBACK_URL must be set and must include full path (e.g. https://your-domain.com/api/mpesa/callback)',
      })
    }

    const stkResponse = await initiateStkPushService({
      phone,
      amount,
      accountReference: `CHAMA-${chamaId}`,
      transactionDesc: `${purpose} - Chama Payment`,
      callbackUrl: callbackUrl || 'http://localhost:5000/api/mpesa/callback',
    })

    const updatedPayment = await prisma.mpesaPayment.update({
      where: { id: payment.id },
      data: {
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
      },
    })

    return res.json({
      success: true,
      message: 'STK push initiated. Please check your phone.',
      data: {
        id: updatedPayment.id,
        payment: updatedPayment,
        safaricom: {
          MerchantRequestID: stkResponse.MerchantRequestID,
          CheckoutRequestID: stkResponse.CheckoutRequestID,
          ResponseCode: stkResponse.ResponseCode,
          ResponseDescription: stkResponse.ResponseDescription,
          CustomerMessage: stkResponse.CustomerMessage,
        },
      },
    })
  } catch (error) {
    if (payment) {
      await prisma.mpesaPayment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          resultDesc: error.message,
        },
      }).catch(() => {})
    }
    next(error)
  }
}

export async function handleCallback(req, res, next) {
  const callbackData = req.body
  console.log('Mpesa callback received:', JSON.stringify(callbackData, null, 2))

  const checkoutRequestId =
    callbackData.Body?.stkCallback?.CheckoutRequestID ||
    callbackData.CheckoutRequestID

  if (!checkoutRequestId) {
    console.error('No CheckoutRequestID in callback:', callbackData)
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }

  const stkCallback = callbackData.Body?.stkCallback || {}
  const resultCode = stkCallback.ResultCode?.toString() ?? callbackData.ResultCode?.toString() ?? '1'

  let mpesaReceiptNo = null
  if (stkCallback.CallbackMetadata?.Item) {
    const receiptItem = stkCallback.CallbackMetadata.Item.find(
      (item) => item.Name === 'MpesaReceiptNumber'
    )
    mpesaReceiptNo = receiptItem?.Value ?? null
  }

  try {
    await processCallbackByCheckoutRequestId(checkoutRequestId, resultCode, mpesaReceiptNo)
  } catch (err) {
    console.error('Callback processing error:', err)
  }

  return res.json({
    ResultCode: 0,
    ResultDesc: 'Accepted',
  })
}

/**
 * DEV-only: simulate a callback for testing without Safaricom.
 * Body: { checkoutRequestId, resultCode: 0|1, mpesaReceiptNo?, amount? }
 * Guard: only available when NODE_ENV !== "production".
 */
export async function simulateCallback(req, res) {
  const { checkoutRequestId, resultCode, mpesaReceiptNo } = req.body

  if (!checkoutRequestId) {
    return res.status(400).json({
      success: false,
      message: 'checkoutRequestId is required',
    })
  }

  const code = resultCode === 0 || resultCode === '0' ? '0' : '1'
  const receipt = mpesaReceiptNo || `DEV-${Date.now()}`

  try {
    const { updatedPayment } = await processCallbackByCheckoutRequestId(
      checkoutRequestId,
      code,
      receipt
    )
    return res.json({
      success: true,
      message: code === '0' ? 'Callback simulated (SUCCESS)' : 'Callback simulated (FAILED)',
      data: updatedPayment,
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Simulate callback failed',
    })
  }
}

export async function getMyMpesaPayments(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const status = req.query.status

    const where = {
      chamaId,
      userId: req.user.id,
      ...(status && { status }),
    }

    const [payments, total] = await Promise.all([
      prisma.mpesaPayment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mpesaPayment.count({ where }),
    ])

    return res.json({
      success: true,
      data: paginateResponse(payments, total, page, limit),
    })
  } catch (error) {
    next(error)
  }
}

export async function getMpesaPayments(req, res, next) {
  try {
    const { chamaId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const status = req.query.status
    const userId = req.query.userId

    const where = {
      chamaId,
      ...(status && { status }),
      ...(userId && { userId }),
    }

    const [payments, total] = await Promise.all([
      prisma.mpesaPayment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mpesaPayment.count({ where }),
    ])

    return res.json({
      success: true,
      data: paginateResponse(payments, total, page, limit),
    })
  } catch (error) {
    next(error)
  }
}
