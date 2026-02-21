import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/prisma.js'

const API = '/api'

describe('Chama', () => {
  let adminToken
  let memberToken
  let chamaId
  let adminId
  let memberId

  beforeAll(async () => {
    const adminEmail = `admin-${Date.now()}@example.com`
    const memberEmail = `member-${Date.now()}@example.com`
    const reg1 = await request(app)
      .post(`${API}/auth/register`)
      .send({ fullName: 'Admin User', email: adminEmail, password: 'pass123' })
    adminToken = reg1.body.data.token
    adminId = reg1.body.data.user.id

    const reg2 = await request(app)
      .post(`${API}/auth/register`)
      .send({ fullName: 'Member User', email: memberEmail, password: 'pass123' })
    memberToken = reg2.body.data.token
    memberId = reg2.body.data.user.id
  })

  afterAll(async () => {
    if (chamaId) {
      await prisma.joinRequest.deleteMany({ where: { chamaId } }).catch(() => {})
      await prisma.membership.deleteMany({ where: { chamaId } }).catch(() => {})
      await prisma.chama.delete({ where: { id: chamaId } }).catch(() => {})
    }
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, memberId].filter(Boolean) } },
    }).catch(() => {})
    await prisma.$disconnect()
  })

  it('3) Create chama -> creator becomes ADMIN', async () => {
    const res = await request(app)
      .post(`${API}/chamas`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Chama', description: 'Desc', joinMode: 'APPROVAL', isPublic: true })
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.data.chamaCode).toBeDefined()
    chamaId = res.body.data.id

    const memberships = await prisma.membership.findMany({
      where: { chamaId },
      include: { user: { select: { id: true } } },
    })
    const creator = memberships.find((m) => m.user.id === adminId)
    expect(creator).toBeDefined()
    expect(creator.role).toBe('ADMIN')
  })

  it('4) Search chamas returns expected fields', async () => {
    const res = await request(app)
      .get(`${API}/chamas/search?q=Test`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.data).toBeDefined()
    expect(Array.isArray(res.body.data.data)).toBe(true)
    const first = res.body.data.data[0]
    if (first) {
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('name')
      expect(first).toHaveProperty('chamaCode')
      expect(first).toHaveProperty('joinMode')
      expect(first).toHaveProperty('memberCount')
      expect(first).not.toHaveProperty('joinCode')
    }
  })

  it('5) Request join -> status PENDING', async () => {
    const res = await request(app)
      .post(`${API}/chamas/${chamaId}/join-requests`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(201)

    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('PENDING')
  })

  it('6) Admin approves join -> membership created', async () => {
    const listRes = await request(app)
      .get(`${API}/chamas/${chamaId}/join-requests?status=PENDING`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const req = listRes.body.data.find((r) => r.userId === memberId)
    expect(req).toBeDefined()

    await request(app)
      .patch(`${API}/chamas/${chamaId}/join-requests/${req.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const membership = await prisma.membership.findFirst({
      where: { chamaId, userId: memberId },
    })
    expect(membership).toBeDefined()
    expect(membership.isActive).toBe(true)
  })
})
