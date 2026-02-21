import { config } from '../config/env.js'
import prisma from '../prisma.js'

/**
 * Mpesa STK Push service
 * If credentials are missing, returns mock response
 */

let accessToken = null
let tokenExpiry = null

async function getAccessToken() {
  // If token exists and not expired, return it
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken
  }

  // If credentials missing, return null (will use mock)
  if (!config.mpesa.consumerKey || !config.mpesa.consumerSecret) {
    return null
  }

  try {
    const auth = Buffer.from(
      `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`
    ).toString('base64')

    const url =
      config.mpesa.env === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    accessToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000 // Refresh 1 min before expiry

    return accessToken
  } catch (error) {
    console.error('Error getting Mpesa access token:', error.message)
    return null
  }
}

export async function initiateStkPush({ phone, amount, accountReference, transactionDesc, callbackUrl }) {
  const token = await getAccessToken()

  // If no token (credentials missing), return mock response
  if (!token) {
    console.log('Mpesa credentials not configured. Returning mock response.')
    return {
      MerchantRequestID: `MOCK-${Date.now()}`,
      CheckoutRequestID: `MOCK-CHECKOUT-${Date.now()}`,
      ResponseCode: '0',
      ResponseDescription: 'Mock STK push initiated',
      CustomerMessage: 'Mock: Please enter your PIN',
    }
  }

  // Format phone number (remove + and ensure 254 prefix)
  let formattedPhone = phone.replace(/\+/g, '').replace(/\s/g, '')
  if (!formattedPhone.startsWith('254')) {
    formattedPhone = `254${formattedPhone.substring(formattedPhone.length - 9)}`
  }

  // Generate timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, -3)

  // Generate password
  const password = Buffer.from(
    `${config.mpesa.shortcode}${config.mpesa.passkey}${timestamp}`
  ).toString('base64')

  try {
    const url =
      config.mpesa.env === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: config.mpesa.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: config.mpesa.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl || config.mpesa.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('STK Push error:', error.message)
    throw error
  }
}

export async function handleCallback(payment, updatedPayment) {
  // Only CONTRIBUTION and REPAYMENT create records. LOAN_DISBURSE is created by disburse endpoint.
  try {
    await prisma.$transaction(async (tx) => {
      if (payment.purpose === 'CONTRIBUTION') {
        // Create contribution
        await tx.contribution.create({
          data: {
            chamaId: payment.chamaId,
            userId: payment.userId,
            amount: payment.amount,
            method: 'MPESA',
            reference: updatedPayment.mpesaReceiptNo,
            paidAt: new Date(),
          },
        })

        // Create transaction
        await tx.transaction.create({
          data: {
            chamaId: payment.chamaId,
            userId: payment.userId,
            type: 'CONTRIBUTION',
            direction: 'IN',
            amount: payment.amount,
            description: `Mpesa contribution - ${updatedPayment.mpesaReceiptNo}`,
            ref: updatedPayment.mpesaReceiptNo,
          },
        })
      } else if (payment.purpose === 'REPAYMENT') {
        if (!payment.loanId) {
          throw new Error('loanId is required for REPAYMENT purpose')
        }

        // Verify loan exists and belongs to user/chama
        const loan = await tx.loan.findUnique({
          where: { id: payment.loanId },
          include: {
            repayments: true,
          },
        })

        if (!loan || loan.chamaId !== payment.chamaId || loan.userId !== payment.userId) {
          throw new Error('Loan not found or access denied')
        }

        // Create repayment
        await tx.repayment.create({
          data: {
            chamaId: payment.chamaId,
            loanId: payment.loanId,
            userId: payment.userId,
            amount: payment.amount,
            method: 'MPESA',
            reference: updatedPayment.mpesaReceiptNo,
            paidAt: new Date(),
          },
        })

        // Create transaction
        await tx.transaction.create({
          data: {
            chamaId: payment.chamaId,
            userId: payment.userId,
            type: 'REPAYMENT',
            direction: 'IN',
            amount: payment.amount,
            description: `Mpesa repayment - ${updatedPayment.mpesaReceiptNo}`,
            ref: updatedPayment.mpesaReceiptNo,
          },
        })

        // Calculate total repaid
        const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0) + payment.amount

        // Update loan status if fully paid
        if (totalRepaid >= loan.totalDue) {
          await tx.loan.update({
            where: { id: loan.id },
            data: { status: 'PAID' },
          })
        } else if (loan.status === 'PENDING' || loan.status === 'APPROVED') {
          // Mark as ACTIVE if not already
          await tx.loan.update({
            where: { id: loan.id },
            data: { status: 'ACTIVE' },
          })
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          chamaId: payment.chamaId,
          actorId: payment.userId,
          action: 'MPESA_CALLBACK',
          entity: 'MPESA_PAYMENT',
          entityId: payment.id,
          meta: {
            purpose: payment.purpose,
            amount: payment.amount,
            receiptNo: updatedPayment.mpesaReceiptNo,
          },
        },
      })
    })
  } catch (error) {
    console.error('Error processing Mpesa callback:', error)
    throw error
  }
}
