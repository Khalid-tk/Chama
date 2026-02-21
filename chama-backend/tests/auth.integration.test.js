import { describe, it, expect, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import prisma from '../src/prisma.js'

const API = '/api'

describe('Auth', () => {
  const testUser = { email: `test-${Date.now()}@example.com`, password: 'password123', fullName: 'Test User' }

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } }).catch(() => {})
    await prisma.$disconnect()
  })

  it('1) Register -> login -> /auth/me returns user and memberships', async () => {
    const registerRes = await request(app)
      .post(`${API}/auth/register`)
      .send({ fullName: testUser.fullName, email: testUser.email, password: testUser.password })
      .expect(201)

    expect(registerRes.body.success).toBe(true)
    expect(registerRes.body.data.token).toBeDefined()
    expect(registerRes.body.data.user.email).toBe(testUser.email)
    expect(Array.isArray(registerRes.body.data.memberships)).toBe(true)

    const token = registerRes.body.data.token

    await request(app)
      .post(`${API}/auth/login`)
      .send({ email: testUser.email, password: testUser.password })
      .expect(200)

    const meRes = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(meRes.body.success).toBe(true)
    expect(meRes.body.data.email).toBe(testUser.email)
    expect(meRes.body.data.globalRole).toBeDefined()
    expect(Array.isArray(meRes.body.data.memberships)).toBe(true)
  })

  it('2) Google login route validates input', async () => {
    const res = await request(app).post(`${API}/auth/google`).send({}).expect(400)
    expect(res.body.success).toBe(false)
  })
})
