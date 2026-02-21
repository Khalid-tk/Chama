import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/prisma.js'

const API = '/api'

describe('Loans', () => {
  let adminToken
  let memberToken
  let chamaId
  let loanId

  beforeAll(async () => {
    const t = Date.now()
    const r1 = await request(app).post(`${API}/auth/register`).send({ fullName: 'Admin', email: `loan-admin-${t}@example.com`, password: 'pass123' })
    adminToken = r1.body.data.token
    const r2 = await request(app).post(`${API}/auth/register`).send({ fullName: 'Member', email: `loan-member-${t}@example.com`, password: 'pass123' })
    memberToken = r2.body.data.token

    const createRes = await request(app).post(`${API}/chamas`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Loan Chama', joinMode: 'OPEN', isPublic: false })
    chamaId = createRes.body.data.id

    await request(app).post(`${API}/chamas/join`).set('Authorization', `Bearer ${memberToken}`).send({ chamaCode: createRes.body.data.chamaCode, joinCode: createRes.body.data.joinCode })
  })

  afterAll(async () => {
    if (loanId) await prisma.repayment.deleteMany({ where: { loanId } }).catch(() => {})
    if (chamaId) {
      await prisma.loan.deleteMany({ where: { chamaId } })
      await prisma.transaction.deleteMany({ where: { chamaId } })
      await prisma.mpesaPayment.deleteMany({ where: { chamaId } })
      await prisma.membership.deleteMany({ where: { chamaId } })
      await prisma.chama.delete({ where: { id: chamaId } })
    }
    await prisma.$disconnect()
  })

  it('7) Member requests loan -> status PENDING', async () => {
    const res = await request(app).post(`${API}/chamas/${chamaId}/loans/request`).set('Authorization', `Bearer ${memberToken}`).send({ principal: 10000 }).expect(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('PENDING')
    loanId = res.body.data.id
  })

  it('8) Admin approves loan -> status APPROVED', async () => {
    const res = await request(app).patch(`${API}/chamas/${chamaId}/loans/${loanId}/approve`).set('Authorization', `Bearer ${adminToken}`).send({}).expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('APPROVED')
  })

  it('9) Admin disburses loan -> MpesaPayment + Transaction OUT', async () => {
    const res = await request(app).post(`${API}/chamas/${chamaId}/loans/${loanId}/disburse`).set('Authorization', `Bearer ${adminToken}`).send({}).expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.loan.status).toBe('ACTIVE')
    const mpesa = await prisma.mpesaPayment.findFirst({ where: { chamaId, loanId, purpose: 'LOAN_DISBURSE' } })
    expect(mpesa).toBeDefined()
    expect(mpesa.status).toBe('SUCCESS')
    const tx = await prisma.transaction.findFirst({ where: { chamaId, type: 'LOAN_DISBURSE' } })
    expect(tx).toBeDefined()
    expect(tx.direction).toBe('OUT')
  })
})
