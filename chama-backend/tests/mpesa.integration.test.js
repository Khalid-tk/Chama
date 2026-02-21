import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/prisma.js'

const API = '/api'

describe('Mpesa', () => {
  let memberToken
  let chamaId
  let loanId
  let paymentId
  let checkoutRequestId

  beforeAll(async () => {
    const adminEmail = `mpesa-admin-${Date.now()}@example.com`
    const memberEmail = `mpesa-member-${Date.now()}@example.com`
    const r1 = await request(app).post(`${API}/auth/register`).send({ fullName: 'Admin', email: adminEmail, password: 'pass123' })
    const adminToken = r1.body.data.token
    const r2 = await request(app).post(`${API}/auth/register`).send({ fullName: 'Member', email: memberEmail, password: 'pass123' })
    memberToken = r2.body.data.token

    const createRes = await request(app)
      .post(`${API}/chamas`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mpesa Chama', joinMode: 'OPEN', isPublic: false })
    chamaId = createRes.body.data.id

    await request(app)
      .post(`${API}/chamas/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ chamaCode: createRes.body.data.chamaCode, joinCode: createRes.body.data.joinCode })

    const loanRes = await request(app)
      .post(`${API}/chamas/${chamaId}/loans/request`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ principal: 5000 })
    loanId = loanRes.body.data.id
    await request(app)
      .patch(`${API}/chamas/${chamaId}/loans/${loanId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    await request(app)
      .post(`${API}/chamas/${chamaId}/loans/${loanId}/disburse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
  })

  afterAll(async () => {
    if (chamaId) {
      await prisma.mpesaPayment.deleteMany({ where: { chamaId } }).catch(() => {})
      await prisma.repayment.deleteMany({ where: { loanId } }).catch(() => {})
      await prisma.transaction.deleteMany({ where: { chamaId } }).catch(() => {})
      await prisma.loan.deleteMany({ where: { chamaId } }).catch(() => {})
      await prisma.membership.deleteMany({ where: { chamaId } }).catch(() => {})
      await prisma.chama.delete({ where: { id: chamaId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('10) Member initiates mpesa repayment -> MpesaPayment PENDING', async () => {
    const res = await request(app)
      .post(`${API}/mpesa/${chamaId}/stkpush`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ purpose: 'REPAYMENT', amount: 1000, phone: '254700000000', loanId })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.payment).toBeDefined()
    paymentId = res.body.data.payment.id
    checkoutRequestId = res.body.data.payment.checkoutRequestId
    expect(res.body.data.payment.status).toBe('PENDING')
  })

  it('11) Simulate callback SUCCESS -> repayment created', async () => {
    if (!checkoutRequestId) return
    await request(app)
      .post(`${API}/mpesa/dev/simulate-callback`)
      .send({
        checkoutRequestId,
        resultCode: 0,
        mpesaReceiptNo: 'SIM' + Date.now(),
        amount: 1000,
      })
      .expect(200)

    const payment = await prisma.mpesaPayment.findUnique({ where: { id: paymentId } })
    expect(payment.status).toBe('SUCCESS')

    const repayment = await prisma.repayment.findFirst({ where: { loanId } })
    expect(repayment).toBeDefined()
    expect(repayment.amount).toBe(1000)
  })
})
