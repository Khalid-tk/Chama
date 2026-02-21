import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/prisma.js'

const API = '/api'

describe('Analytics', () => {
  let adminToken
  let memberToken
  let chamaId

  beforeAll(async () => {
    const adminEmail = `analytics-admin-${Date.now()}@example.com`
    const memberEmail = `analytics-member-${Date.now()}@example.com`
    const r1 = await request(app).post(`${API}/auth/register`).send({ fullName: 'Admin', email: adminEmail, password: 'pass123' })
    adminToken = r1.body.data.token
    const r2 = await request(app).post(`${API}/auth/register`).send({ fullName: 'Member', email: memberEmail, password: 'pass123' })
    memberToken = r2.body.data.token

    const createRes = await request(app)
      .post(`${API}/chamas`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Analytics Chama', joinMode: 'OPEN', isPublic: false })
    chamaId = createRes.body.data.id

    await request(app)
      .post(`${API}/chamas/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ chamaCode: createRes.body.data.chamaCode, joinCode: createRes.body.data.joinCode })
  })

  afterAll(async () => {
    if (chamaId) {
      await prisma.membership.deleteMany({ where: { chamaId } }).catch(() => {})
      await prisma.chama.delete({ where: { id: chamaId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('12) Admin analytics returns valid shape with series arrays', async () => {
    const res = await request(app)
      .get(`${API}/chamas/${chamaId}/analytics/admin?range=6m`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeDefined()
    const d = res.body.data
    expect(d.series).toBeDefined()
    expect(Array.isArray(d.series.contributionsMonthly)).toBe(true)
    expect(Array.isArray(d.series.cashflowMonthly)).toBe(true)
    expect(d.kpis).toBeDefined()
  })

  it('12b) Member analytics returns valid shape', async () => {
    const res = await request(app)
      .get(`${API}/chamas/${chamaId}/analytics/member?range=6m`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeDefined()
    expect(res.body.data.series).toBeDefined()
    expect(Array.isArray(res.body.data.series.myContributionsMonthly)).toBe(true)
  })
})
