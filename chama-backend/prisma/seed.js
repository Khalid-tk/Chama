import 'dotenv/config'
import prisma from '../src/prisma.js'
import bcrypt from 'bcrypt'

async function runWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const msg = String(err?.message || err)
      const isTransient =
        msg.includes('terminating connection') ||
        msg.includes('Connection terminated unexpectedly') ||
        msg.includes('ECONNRESET') ||
        msg.includes('server closed the connection')
      if (!isTransient || i === retries - 1) {
        throw err
      }
      console.log(`Retrying seed after transient DB error... attempt ${i + 1}`)
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)))
    }
  }
}

const PASS = 'Member123!'
const ADMIN_PASS = 'Admin123!'
const SEED = 4242

// Deterministic RNG (mulberry32) for reproducible seed
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
let rng = mulberry32(SEED)
function rand() {
  return rng()
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}
function phone254() {
  return '2547' + String(Math.floor(10000000 + rand() * 90000000))
}

// Realistic Kenyan first and last names
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Elizabeth', 'Peter', 'Margaret', 'Joseph', 'Grace',
  'David', 'Anne', 'Michael', 'Jane', 'Daniel', 'Lucy', 'Paul', 'Sarah',
  'Stephen', 'Ruth', 'Charles', 'Joyce', 'Nancy', 'Thomas', 'Susan',
  'Robert', 'Catherine', 'William', 'Mercy', 'Richard', 'Faith', 'Kennedy', 'Ivy',
]
const LAST_NAMES = [
  'Ochieng', 'Akinyi', 'Odhiambo', 'Achieng', 'Otieno', 'Adhiambo', 'Omondi', 'Atieno',
  'Owiti', 'Anyango', 'Okello', 'Awuor', 'Ouma', 'Akello', 'Opiyo', 'Adongo',
  'Kipchoge', 'Chebet', 'Korir', 'Jepchumba', 'Kiprotich', 'Chepngetich',
  'Kamau', 'Wambui', 'Mwangi', 'Wanjiku', 'Kariuki', 'Nyambura', 'Njoroge', 'Wanjiru',
]

function avatarUrl(filename) {
  const base = (process.env.PUBLIC_BASE_URL || process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '')
  return `${base}/uploads/avatars/${filename}`
}

async function main() {
  console.log('🌱 Starting realistic database seed...\n')

  // Optional safety: log existing counts before wipe
  const existingUsers = await prisma.user.count()
  const existingChamas = await prisma.chama.count()
  console.log('Existing users:', existingUsers)
  console.log('Existing chamas:', existingChamas)

  // Idempotent wipe: child tables first, then parents
  await prisma.repayment.deleteMany()
  await prisma.loan.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.contribution.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.mpesaPayment.deleteMany()
  await prisma.joinRequest.deleteMany()
  await prisma.invite.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.emailJob.deleteMany()
  await prisma.user.deleteMany()
  await prisma.chama.deleteMany()
  console.log('✅ Tables wiped (idempotent)\n')

  const passwordHash = await bcrypt.hash(PASS, 10)
  const adminHash = await bcrypt.hash(ADMIN_PASS, 10)

  // ---------- 0 + 1. CHAMAS (Platform + 10) — createMany then resolve IDs ----------
  const chamaSpecs = [
    { chamaCode: 'PLATFORM', name: 'Platform', description: 'System platform for audit', joinMode: 'OPEN', contributionAmount: null, cycleDay: null, loanInterestRate: null, penaltyRate: null, joinCode: null },
    { chamaCode: 'KRU001', name: 'Kisumu United Sacco', joinMode: 'OPEN', contributionAmount: 5000, cycleDay: 1, loanInterestRate: 10, penaltyRate: 5, joinCode: 'JOIN-KRU001' },
    { chamaCode: 'NBO002', name: 'Nairobi Boda Sacco', joinMode: 'APPROVAL', contributionAmount: 3000, cycleDay: 15, loanInterestRate: 12, penaltyRate: 3, joinCode: 'JOIN-NBO002' },
    { chamaCode: 'MBS003', name: 'Mombasa Beach Sacco', joinMode: 'OPEN', contributionAmount: 7000, cycleDay: 5, loanInterestRate: 8, penaltyRate: 4, joinCode: 'JOIN-MBS003' },
    { chamaCode: 'NKR004', name: 'Nakuru Farmers Chama', joinMode: 'APPROVAL', contributionAmount: 4000, cycleDay: 20, loanInterestRate: 15, penaltyRate: 6, joinCode: 'JOIN-NKR004' },
    { chamaCode: 'ELD005', name: 'Eldoret Traders Sacco', joinMode: 'OPEN', contributionAmount: 6000, cycleDay: 10, loanInterestRate: 11, penaltyRate: 4, joinCode: 'JOIN-ELD005' },
    { chamaCode: 'KSM006', name: 'Kisii Women Sacco', joinMode: 'APPROVAL', contributionAmount: 3500, cycleDay: 5, loanInterestRate: 12, penaltyRate: 4, joinCode: 'JOIN-KSM006' },
    { chamaCode: 'THK007', name: 'Thika Traders Chama', joinMode: 'OPEN', contributionAmount: 5500, cycleDay: 12, loanInterestRate: 9, penaltyRate: 3, joinCode: 'JOIN-THK007' },
    { chamaCode: 'MAL008', name: 'Malindi Coast Sacco', joinMode: 'APPROVAL', contributionAmount: 4500, cycleDay: 25, loanInterestRate: 11, penaltyRate: 5, joinCode: 'JOIN-MAL008' },
    { chamaCode: 'GAR009', name: 'Garissa Unity Chama', joinMode: 'OPEN', contributionAmount: 4000, cycleDay: 1, loanInterestRate: 14, penaltyRate: 6, joinCode: 'JOIN-GAR009' },
    { chamaCode: 'KAK010', name: 'Kakamega Savings Sacco', joinMode: 'APPROVAL', contributionAmount: 5000, cycleDay: 15, loanInterestRate: 10, penaltyRate: 4, joinCode: 'JOIN-KAK010' },
  ]
  await prisma.chama.createMany({
    data: chamaSpecs.map((s) => ({
      chamaCode: s.chamaCode,
      name: s.name,
      description: s.chamaCode === 'PLATFORM' ? s.description : `${s.name} - Savings and loans`,
      joinCode: s.joinCode,
      joinMode: s.joinMode,
      isPublic: s.joinMode === 'OPEN',
      contributionAmount: s.contributionAmount,
      cycleDay: s.cycleDay,
      loanInterestRate: s.loanInterestRate,
      penaltyRate: s.penaltyRate,
    })),
    skipDuplicates: true,
  })
  const chamasById = await prisma.chama.findMany({ orderBy: { createdAt: 'asc' } })
  // chamas = 10 sacco chamas only (exclude PLATFORM) for contributions/loans/etc.
  const chamas = chamaSpecs.slice(1).map((spec, idx) => ({ ...chamasById[idx + 1], spec }))
  console.log('✅ Platform + 10 chamas created\n')

  // ---------- 2. USERS: 120 total — createMany then resolve IDs ----------
  const treasurerHash = await bcrypt.hash('Treasurer123!', 10)
  const usedEmails = new Set()
  const userData = []

  // Legacy 5
  userData.push(
    { email: 'admin@chama.com', fullName: 'System Admin', phone: '254712345678', passwordHash: adminHash, authProvider: 'LOCAL', globalRole: 'SUPER_ADMIN', avatarUrl: avatarUrl('admin.jpg') },
    { email: 'treasurer@chama.com', fullName: 'Treasurer User', phone: '254712345681', passwordHash: treasurerHash, authProvider: 'LOCAL', avatarUrl: avatarUrl('treasurer.jpg') },
    { email: 'member1@chama.com', fullName: 'John Member', phone: '254712345679', passwordHash, authProvider: 'LOCAL', avatarUrl: avatarUrl('member1.jpg') },
    { email: 'member2@chama.com', fullName: 'Jane Member', phone: '254712345680', passwordHash, authProvider: 'LOCAL', avatarUrl: avatarUrl('member2.jpg') },
    { email: 'member3@chama.com', fullName: 'Peter Ochieng', phone: '254712345682', passwordHash, authProvider: 'LOCAL', avatarUrl: avatarUrl('member1.jpg') },
  )
  usedEmails.add('admin@chama.com')
  usedEmails.add('treasurer@chama.com')
  usedEmails.add('member1@chama.com')
  usedEmails.add('member2@chama.com')
  usedEmails.add('member3@chama.com')

  for (let i = 0; i < 8; i++) {
    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    const email = `admin${i + 1}.${last.toLowerCase()}@chama.co.ke`
    if (usedEmails.has(email)) continue
    usedEmails.add(email)
    userData.push({
      email,
      fullName: `${first} ${last}`,
      phone: phone254(),
      passwordHash: adminHash,
      authProvider: 'LOCAL',
      globalRole: 'USER',
    })
  }
  for (let i = 0; i < 107; i++) {
    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    let email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@chama.co.ke`
    while (usedEmails.has(email)) {
      email = `${first.toLowerCase()}.${last.toLowerCase()}${i}.${Math.floor(rand() * 100)}@chama.co.ke`
    }
    usedEmails.add(email)
    userData.push({
      email,
      fullName: `${first} ${last}`,
      phone: phone254(),
      passwordHash,
      authProvider: 'LOCAL',
    })
  }

  await prisma.user.createMany({ data: userData, skipDuplicates: true })
  const allUsers = await prisma.user.findMany({ where: { email: { in: userData.map((u) => u.email) } } })
  const userByEmail = Object.fromEntries(allUsers.map((u) => [u.email, u]))
  const users = userData.map((u) => userByEmail[u.email])
  const legacyAdmin = userByEmail['admin@chama.com']
  const legacyTreasurer = userByEmail['treasurer@chama.com']
  const legacyMember1 = userByEmail['member1@chama.com']
  const legacyMember2 = userByEmail['member2@chama.com']
  const legacyMember3 = userByEmail['member3@chama.com']
  const chamaAdmins = [legacyAdmin, legacyTreasurer, ...users.slice(5, 13)]
  console.log(`✅ ${users.length} users (1 SUPER_ADMIN, 10 chama admins, ${users.length - 11} members)\n`)

  // ---------- 3. MEMBERSHIPS — createMany ----------
  const adminRoles = ['ADMIN', 'TREASURER', 'CHAIR']
  const memberPool = users.filter((u) => !chamaAdmins.includes(u))
  const membershipData = []
  for (let c = 0; c < chamas.length; c++) {
    const chamaId = chamas[c].id
    const chamaCode = chamas[c].chamaCode
    const nAdmins = 2 + (c % 3)
    const nMembers = 8 + Math.floor(rand() * 8)
    for (let a = 0; a < nAdmins; a++) {
      const admin = chamaAdmins[(c * 2 + a) % chamaAdmins.length]
      membershipData.push({ userId: admin.id, chamaId, role: pick(adminRoles), isActive: true })
    }
    const shuffled = [...memberPool].sort(() => rand() - 0.5)
    for (let i = 0; i < nMembers; i++) {
      const u = shuffled[i % shuffled.length]
      const role = i < 2 ? pick(['AUDITOR', 'MEMBER']) : 'MEMBER'
      membershipData.push({ userId: u.id, chamaId, role, isActive: true })
    }
  }
  for (const ch of chamas) {
    membershipData.push({ userId: legacyAdmin.id, chamaId: ch.id, role: 'ADMIN', isActive: true })
  }
  for (const ch of chamas) {
    if (ch.chamaCode === 'KRU001' || ch.chamaCode === 'NBO002') {
      membershipData.push({ userId: legacyTreasurer.id, chamaId: ch.id, role: 'TREASURER', isActive: true })
      membershipData.push({ userId: legacyMember1.id, chamaId: ch.id, role: 'MEMBER', isActive: true })
      membershipData.push({ userId: legacyMember2.id, chamaId: ch.id, role: 'MEMBER', isActive: true })
      membershipData.push({ userId: legacyMember3.id, chamaId: ch.id, role: 'MEMBER', isActive: true })
    }
  }
  await prisma.membership.createMany({ data: membershipData, skipDuplicates: true })
  console.log('✅ Memberships with varied roles (incl. legacy demo users)\n')

  // ---------- 3b. JOIN REQUESTS — createMany; then notifications + email jobs + extra memberships ----------
  const approvalChamas = chamas.filter((c) => c.spec.joinMode === 'APPROVAL')
  const baseYearAgo = new Date()
  baseYearAgo.setFullYear(baseYearAgo.getFullYear() - 1)
  const joinRequestData = []
  const joinRequestNotifications = []
  const joinRequestEmailJobs = []
  const approvedMemberships = []
  for (const ch of approvalChamas) {
    const existingMemberIds = new Set(
      (await prisma.membership.findMany({ where: { chamaId: ch.id }, select: { userId: true } })).map((m) => m.userId)
    )
    const nonMembers = users.filter((u) => !existingMemberIds.has(u.id))
    const toRequest = nonMembers.slice(0, 8 + Math.floor(rand() * 12))
    for (let i = 0; i < toRequest.length; i++) {
      const u = toRequest[i]
      const createdAt = new Date(baseYearAgo.getTime() + rand() * 360 * 24 * 60 * 60 * 1000)
      const status = rand() < 0.5 ? 'PENDING' : rand() < 0.6 ? 'APPROVED' : 'REJECTED'
      joinRequestData.push({ chamaId: ch.id, userId: u.id, status, createdAt, updatedAt: createdAt })
      if (status === 'APPROVED') {
        approvedMemberships.push({ userId: u.id, chamaId: ch.id, role: 'MEMBER', isActive: true })
        joinRequestNotifications.push({
          userId: u.id,
          chamaId: ch.id,
          type: 'JOIN_APPROVED',
          title: 'Join request approved',
          message: `You have been approved to join ${ch.name}.`,
          actionUrl: `/member/${ch.id}/dashboard`,
          isRead: rand() < 0.4,
          createdAt,
        })
        joinRequestEmailJobs.push({
          to: u.email,
          subject: `Approved: ${ch.name}`,
          html: `<p>You have been approved to join ${ch.name}.</p>`,
          status: 'SENT',
          attempts: 1,
          sendAfter: createdAt,
          sentAt: createdAt,
          createdAt,
          updatedAt: createdAt,
        })
      } else if (status === 'REJECTED') {
        joinRequestNotifications.push({
          userId: u.id,
          chamaId: ch.id,
          type: 'JOIN_REJECTED',
          title: 'Join request declined',
          message: `Your request to join ${ch.name} was declined.`,
          actionUrl: `/chamas/search`,
          isRead: rand() < 0.5,
          createdAt,
        })
      }
    }
  }
  await prisma.joinRequest.createMany({ data: joinRequestData, skipDuplicates: true })
  if (approvedMemberships.length) {
    await prisma.membership.createMany({ data: approvedMemberships, skipDuplicates: true })
  }
  if (joinRequestNotifications.length) {
    for (let i = 0; i < joinRequestNotifications.length; i += 200) {
      await prisma.notification.createMany({ data: joinRequestNotifications.slice(i, i + 200) })
    }
  }
  if (joinRequestEmailJobs.length) {
    for (let i = 0; i < joinRequestEmailJobs.length; i += 100) {
      await prisma.emailJob.createMany({ data: joinRequestEmailJobs.slice(i, i + 100) })
    }
  }
  console.log('✅ Join requests (PENDING + APPROVED/REJECTED) with notifications and emails\n')

  // ---------- 4. CONTRIBUTIONS (12 months) — batched createMany ----------
  console.log('Seeding contributions (12 months)...')
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  for (let chIdx = 0; chIdx < chamas.length; chIdx++) {
    const ch = chamas[chIdx]
    const chamaId = ch.id
    const amountBase = ch.spec.contributionAmount || 5000
    const mems = await prisma.membership.findMany({
      where: { chamaId, isActive: true },
      include: { user: true },
    })

    const contribBatch = []
    const txBatch = []
    const mpesaBatch = []

    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(twelveMonthsAgo)
      monthDate.setMonth(twelveMonthsAgo.getMonth() + m)
      monthDate.setDate(5 + Math.floor(rand() * 20))

      for (const mem of mems) {
        if (rand() < 0.18) continue
        const amount = amountBase + Math.floor((rand() - 0.3) * amountBase * 0.4)
        const amt = Math.max(Math.floor(amountBase * 0.5), amount)
        const method = rand() < 0.82 ? 'MPESA' : 'CASH'
        const ref = method === 'MPESA' ? `MP${ch.chamaCode}${m}${mem.userId.slice(0, 8)}${rand().toString(36).slice(2, 8)}` : null

        contribBatch.push({ chamaId, userId: mem.userId, amount: amt, method, reference: ref, paidAt: monthDate })
        txBatch.push({
          chamaId,
          userId: mem.userId,
          type: 'CONTRIBUTION',
          direction: 'IN',
          amount: amt,
          description: `Contribution - ${mem.user.fullName}`,
          ref,
          createdAt: monthDate,
        })
        if (method === 'MPESA') {
          mpesaBatch.push({
            chamaId,
            userId: mem.userId,
            purpose: 'CONTRIBUTION',
            amount: amt,
            phone: mem.user.phone || '254700000000',
            status: 'SUCCESS',
            mpesaReceiptNo: ref,
            resultCode: '0',
            resultDesc: 'Success',
            createdAt: monthDate,
            updatedAt: monthDate,
          })
        }
      }
    }

    for (let i = 0; i < contribBatch.length; i += 200) {
      await prisma.contribution.createMany({ data: contribBatch.slice(i, i + 200) })
      await prisma.transaction.createMany({ data: txBatch.slice(i, i + 200) })
    }
    for (let i = 0; i < mpesaBatch.length; i += 200) {
      await prisma.mpesaPayment.createMany({ data: mpesaBatch.slice(i, i + 200) })
    }
    console.log(`  Chama ${chIdx + 1}/${chamas.length} (${ch.chamaCode}) contributions done`)
  }
  console.log('✅ Contributions (12 months) + Transactions + Mpesa SUCCESS\n')

  // ---------- 4b. THIS CYCLE (current month) contributions — batched ----------
  const now = new Date()
  const thisCycleDate = new Date(now.getFullYear(), now.getMonth(), 15)
  const thisCycleContrib = []
  const thisCycleTx = []
  const thisCycleMpesa = []
  for (const ch of chamas) {
    const chamaId = ch.id
    const amountBase = ch.spec.contributionAmount || 5000
    const mems = await prisma.membership.findMany({
      where: { chamaId, isActive: true },
      include: { user: true },
    })
    for (const mem of mems) {
      const amt = amountBase + Math.floor((rand() - 0.2) * amountBase * 0.3)
      const amount = Math.max(Math.floor(amountBase * 0.8), amt)
      const method = rand() < 0.8 ? 'MPESA' : 'CASH'
      const ref = method === 'MPESA' ? `MPCYCLE${ch.chamaCode}${mem.userId.slice(0, 8)}` : null
      thisCycleContrib.push({ chamaId, userId: mem.userId, amount, method, reference: ref, paidAt: thisCycleDate })
      thisCycleTx.push({
        chamaId,
        userId: mem.userId,
        type: 'CONTRIBUTION',
        direction: 'IN',
        amount,
        description: `Contribution (this cycle) - ${mem.user.fullName}`,
        ref,
        createdAt: thisCycleDate,
      })
      if (method === 'MPESA') {
        thisCycleMpesa.push({
          chamaId,
          userId: mem.userId,
          purpose: 'CONTRIBUTION',
          amount,
          phone: mem.user.phone || '254700000000',
          status: 'SUCCESS',
          mpesaReceiptNo: ref,
          resultCode: '0',
          resultDesc: 'Success',
          createdAt: thisCycleDate,
          updatedAt: thisCycleDate,
        })
      }
    }
  }
  if (thisCycleContrib.length) {
    await prisma.contribution.createMany({ data: thisCycleContrib })
    await prisma.transaction.createMany({ data: thisCycleTx })
  }
  if (thisCycleMpesa.length) {
    await prisma.mpesaPayment.createMany({ data: thisCycleMpesa })
  }
  console.log('✅ This cycle (current month) contributions\n')

  // ---------- 5. LOANS (35–50% of members) + REPAYMENTS + DISBURSEMENT ----------
  console.log('Seeding loans and repayments...')
  const loanStatuses = ['PENDING', 'ACTIVE', 'ACTIVE', 'PAID', 'PAID', 'LATE', 'REJECTED']
  for (let chIdx = 0; chIdx < chamas.length; chIdx++) {
    const ch = chamas[chIdx]
    const chamaId = ch.id
    const rate = (ch.spec.loanInterestRate || 10) / 100
    const mems = await prisma.membership.findMany({
      where: { chamaId, isActive: true },
      include: { user: true },
    })
    const loanTakers = mems.filter(() => rand() < 0.42)
    if (loanTakers.length === 0) {
      const one = mems[0]
      if (one) loanTakers.push(one)
    }

    for (const mem of loanTakers) {
      const principal = (ch.spec.contributionAmount || 5000) * (5 + Math.floor(rand() * 15))
      const interest = Math.round(principal * rate)
      const totalDue = principal + interest
      const requestedAt = new Date(now)
      requestedAt.setMonth(requestedAt.getMonth() - (6 + Math.floor(rand() * 6)))
      const status = pick(loanStatuses)
      const approvedAt = status !== 'PENDING' && status !== 'REJECTED' ? new Date(requestedAt.getTime() + 2 * 86400000) : null
      const dueDate = new Date(requestedAt)
      dueDate.setMonth(dueDate.getMonth() + 6)
      const isLate = status === 'LATE'
      const pastDue = new Date(now)
      pastDue.setMonth(pastDue.getMonth() - 2)
      const finalDueDate = isLate ? pastDue : dueDate

      const loan = await prisma.loan.create({
        data: {
          chamaId,
          userId: mem.userId,
          principal,
          interest,
          totalDue,
          status,
          requestedAt,
          approvedAt,
          dueDate: finalDueDate,
        },
      })

      if (status !== 'PENDING' && status !== 'REJECTED') {
        const disburseDate = approvedAt || requestedAt
        const receiptNo = `B2C${ch.chamaCode}${loan.id.slice(0, 8)}`
        await prisma.mpesaPayment.create({
          data: {
            chamaId,
            userId: mem.userId,
            purpose: 'LOAN_DISBURSE',
            amount: principal,
            phone: mem.user.phone || '254700000000',
            loanId: loan.id,
            status: 'SUCCESS',
            mpesaReceiptNo: receiptNo,
            resultCode: '0',
            resultDesc: 'Disbursed',
            createdAt: disburseDate,
            updatedAt: disburseDate,
          },
        })
        await prisma.transaction.create({
          data: {
            chamaId,
            userId: mem.userId,
            type: 'LOAN_DISBURSE',
            direction: 'OUT',
            amount: principal,
            description: `Loan disbursement - ${mem.user.fullName}`,
            ref: receiptNo,
            createdAt: disburseDate,
          },
        })
      }

      let totalRepaid = 0
      const numRepayments =
        status === 'PAID' ? 4 + Math.floor(rand() * 4) : status === 'LATE' ? 1 + Math.floor(rand() * 2) : status === 'ACTIVE' ? 1 + Math.floor(rand() * 3) : 0
      for (let r = 0; r < numRepayments; r++) {
        const repayAmount =
          status === 'PAID' && r === numRepayments - 1
            ? totalDue - totalRepaid
            : Math.min(totalDue - totalRepaid, Math.floor(totalDue / numRepayments) + Math.floor(rand() * 2000))
        if (repayAmount <= 0) break
        totalRepaid += repayAmount
        const paidAt = new Date(approvedAt || requestedAt)
        paidAt.setDate(paidAt.getDate() + 30 * (r + 1) + Math.floor(rand() * 10))
        const ref = `MPREPAY${loan.id.slice(0, 8)}${r}`
        await prisma.repayment.create({
          data: { chamaId, loanId: loan.id, userId: mem.userId, amount: repayAmount, method: 'MPESA', reference: ref, paidAt },
        })
        await prisma.transaction.create({
          data: {
            chamaId,
            userId: mem.userId,
            type: 'REPAYMENT',
            direction: 'IN',
            amount: repayAmount,
            description: `Repayment - ${mem.user.fullName}`,
            ref,
            createdAt: paidAt,
          },
        })
        await prisma.mpesaPayment.create({
          data: {
            chamaId,
            userId: mem.userId,
            purpose: 'REPAYMENT',
            amount: repayAmount,
            phone: mem.user.phone || '254700000000',
            loanId: loan.id,
            status: 'SUCCESS',
            mpesaReceiptNo: ref,
            resultCode: '0',
            resultDesc: 'Success',
            createdAt: paidAt,
            updatedAt: paidAt,
          },
        })
      }
      if (totalRepaid >= totalDue && status === 'PAID') {
        await prisma.loan.update({ where: { id: loan.id }, data: { status: 'PAID' } })
      } else if (status === 'LATE') {
        await prisma.loan.update({ where: { id: loan.id }, data: { status: 'LATE' } })
      }
    }
    console.log(`  Chama ${chIdx + 1}/${chamas.length} loans done`)
  }
  console.log('✅ Loans + repayments + LOAN_DISBURSE (Mpesa + Transaction)\n')

  // ---------- 5b. THIS CYCLE loans + repayments ----------
  console.log('Seeding this cycle loans...')
  for (const ch of chamas) {
    const chamaId = ch.id
    const rate = (ch.spec.loanInterestRate || 10) / 100
    const mems = await prisma.membership.findMany({
      where: { chamaId, isActive: true },
      include: { user: true },
    })
    const nThisCycle = Math.min(3, Math.max(1, Math.floor(mems.length / 3)))
    const pool = [...mems].sort(() => rand() - 0.5).slice(0, nThisCycle)
    const requestedAt = new Date(now.getFullYear(), now.getMonth(), 5)
    const approvedAt = new Date(now.getFullYear(), now.getMonth(), 7)
    for (const mem of pool) {
      const principal = (ch.spec.contributionAmount || 5000) * (4 + Math.floor(rand() * 8))
      const interest = Math.round(principal * rate)
      const totalDue = principal + interest
      const dueDate = new Date(now)
      dueDate.setMonth(dueDate.getMonth() + 6)
      const loan = await prisma.loan.create({
        data: { chamaId, userId: mem.userId, principal, interest, totalDue, status: 'ACTIVE', requestedAt, approvedAt, dueDate },
      })
      const receiptNo = `B2CCYCLE${ch.chamaCode}${loan.id.slice(0, 8)}`
      await prisma.mpesaPayment.create({
        data: {
          chamaId,
          userId: mem.userId,
          purpose: 'LOAN_DISBURSE',
          amount: principal,
          phone: mem.user.phone || '254700000000',
          loanId: loan.id,
          status: 'SUCCESS',
          mpesaReceiptNo: receiptNo,
          resultCode: '0',
          resultDesc: 'Disbursed',
          createdAt: approvedAt,
          updatedAt: approvedAt,
        },
      })
      await prisma.transaction.create({
        data: {
          chamaId,
          userId: mem.userId,
          type: 'LOAN_DISBURSE',
          direction: 'OUT',
          amount: principal,
          description: `Loan disbursement (this cycle) - ${mem.user.fullName}`,
          ref: receiptNo,
          createdAt: approvedAt,
        },
      })
      const repayAmount = Math.floor(totalDue / 4) + Math.floor(rand() * 2000)
      const repayDate = new Date(now.getFullYear(), now.getMonth(), 12)
      const refRep = `MPREPCYCLE${loan.id.slice(0, 8)}`
      await prisma.repayment.create({
        data: { chamaId, loanId: loan.id, userId: mem.userId, amount: repayAmount, method: 'MPESA', reference: refRep, paidAt: repayDate },
      })
      await prisma.transaction.create({
        data: {
          chamaId,
          userId: mem.userId,
          type: 'REPAYMENT',
          direction: 'IN',
          amount: repayAmount,
          description: `Repayment (this cycle) - ${mem.user.fullName}`,
          ref: refRep,
          createdAt: repayDate,
        },
      })
      await prisma.mpesaPayment.create({
        data: {
          chamaId,
          userId: mem.userId,
          purpose: 'REPAYMENT',
          amount: repayAmount,
          phone: mem.user.phone || '254700000000',
          loanId: loan.id,
          status: 'SUCCESS',
          mpesaReceiptNo: refRep,
          resultCode: '0',
          resultDesc: 'Success',
          createdAt: repayDate,
          updatedAt: repayDate,
        },
      })
    }
  }
  console.log('✅ This cycle loans + repayments\n')

  // ---------- 6. MPESA FAILED / TIMEOUT / PENDING (no Contribution/Repayment) ----------
  console.log('Seeding Mpesa failed/pending records...')
  const mpesaFailStatuses = ['FAILED', 'FAILED', 'TIMEOUT', 'PENDING']
  for (const ch of chamas) {
    const mems = await prisma.membership.findMany({ where: { chamaId: ch.id, isActive: true }, include: { user: true }, take: 5 })
    for (const mem of mems) {
      const amt = ch.spec.contributionAmount || 5000
      const phone = mem.user.phone || '254700000000'
      const st = pick(mpesaFailStatuses)
      await prisma.mpesaPayment.create({
        data: {
          chamaId: ch.id,
          userId: mem.userId,
          purpose: 'CONTRIBUTION',
          amount: amt,
          phone,
          status: st,
          resultCode: st === 'FAILED' ? '1032' : st === 'TIMEOUT' ? '1037' : null,
          resultDesc: st === 'FAILED' ? 'Request cancelled by user' : st === 'TIMEOUT' ? 'Timeout' : null,
          checkoutRequestId: st === 'PENDING' ? `PEND-${ch.chamaCode}-${mem.userId.slice(0, 8)}` : null,
        },
      })
    }
  }
  console.log('✅ Mpesa FAILED/TIMEOUT/PENDING records (no contributions)\n')

  // ---------- 6b. NOTIFICATIONS (2000+) — all types, spread over 12 months ----------
  console.log('Seeding notifications (2000+)...')
  await prisma.notification.deleteMany({})
  const yearMs = 365 * 24 * 60 * 60 * 1000
  const notifBase = new Date()
  notifBase.setFullYear(notifBase.getFullYear() - 1)
  const notifTypes = [
    { type: 'INVITE', title: 'Chama invite', message: 'You have been invited to join a chama.', action: (ch) => `/invites` },
    { type: 'JOIN_REQUEST_CREATED', title: 'New join request', message: 'A new member requested to join.', action: (ch) => `/admin/${ch?.id}/join-requests` },
    { type: 'JOIN_APPROVED', title: 'Join request approved', message: 'You have been approved to join.', action: (ch) => `/member/${ch?.id}/dashboard` },
    { type: 'JOIN_REJECTED', title: 'Join request declined', message: 'Your join request was declined.', action: () => `/chamas/search` },
    { type: 'LOAN_REQUESTED', title: 'New loan request', message: 'A member requested a loan.', action: (ch) => `/admin/${ch?.id}/approvals` },
    { type: 'LOAN_APPROVED', title: 'Loan approved', message: 'Your loan request was approved.', action: (ch) => `/member/${ch?.id}/loans` },
    { type: 'LOAN_REJECTED', title: 'Loan declined', message: 'Your loan request was declined.', action: (ch) => `/member/${ch?.id}/loans` },
    { type: 'LOAN_DISBURSED', title: 'Loan disbursed', message: 'Your loan has been disbursed.', action: (ch) => `/member/${ch?.id}/loans` },
    { type: 'CONTRIBUTION_RECEIVED', title: 'Contribution received', message: 'Your contribution was received.', action: (ch) => `/member/${ch?.id}/contributions` },
    { type: 'REPAYMENT_RECEIVED', title: 'Repayment received', message: 'Your repayment was recorded.', action: (ch) => `/member/${ch?.id}/loans` },
    { type: 'ROLE_CHANGED', title: 'Role updated', message: 'Your role in the chama was updated.', action: (ch) => `/member/${ch?.id}/dashboard` },
  ]
  const notifBatch = []
  for (let i = 0; i < 2100; i++) {
    const u = users[Math.floor(rand() * users.length)]
    const ch = rand() < 0.85 ? chamas[Math.floor(rand() * chamas.length)] : null
    const t = notifTypes[Math.floor(rand() * notifTypes.length)]
    const createdAt = new Date(notifBase.getTime() + rand() * yearMs)
    notifBatch.push({
      userId: u.id,
      chamaId: ch?.id ?? null,
      type: t.type,
      title: t.title,
      message: t.message,
      actionUrl: t.action(ch),
      isRead: rand() < 0.35,
      createdAt,
    })
  }
  for (let i = 0; i < notifBatch.length; i += 500) {
    await prisma.notification.createMany({ data: notifBatch.slice(i, i + 500) })
  }
  console.log(`✅ ${notifBatch.length} notifications (all types, 12 months)\n`)

  // ---------- 6c. EMAIL JOBS (200+) — SENT / FAILED / PENDING ----------
  await prisma.emailJob.deleteMany({})
  const emailSubjects = [
    'Welcome to the chama',
    'Join request approved',
    'Join request declined',
    'Loan approved',
    'Loan disbursed',
    'Contribution received',
    'Repayment reminder',
    'Role updated',
    'Meeting reminder',
  ]
  const emailBatch = []
  for (let i = 0; i < 220; i++) {
    const u = users[Math.floor(rand() * users.length)]
    const status = rand() < 0.7 ? 'SENT' : rand() < 0.85 ? 'FAILED' : 'PENDING'
    const sendAfter = new Date(notifBase.getTime() + rand() * yearMs)
    const sentAt = status === 'SENT' ? sendAfter : status === 'FAILED' ? sendAfter : null
    emailBatch.push({
      to: u.email,
      subject: pick(emailSubjects),
      html: '<p>Demo email body.</p>',
      status,
      attempts: status === 'FAILED' ? 1 + Math.floor(rand() * 3) : status === 'SENT' ? 1 : 0,
      lastError: status === 'FAILED' ? 'Connection timeout' : null,
      sendAfter,
      sentAt,
      createdAt: sendAfter,
      updatedAt: sendAfter,
    })
  }
  for (let i = 0; i < emailBatch.length; i += 100) {
    await prisma.emailJob.createMany({ data: emailBatch.slice(i, i + 100) })
  }
  console.log(`✅ ${emailBatch.length} email jobs (SENT/FAILED/PENDING)\n`)

  // ---------- 7. AUDIT LOGS (rich seed data) ----------
  console.log('Seeding audit logs...')
  for (const ch of chamas) {
    const chamaId = ch.id
    await prisma.auditLog.deleteMany({ where: { chamaId } })

    const chamaAdmins = await prisma.membership.findMany({
      where: { chamaId, role: { in: ['ADMIN', 'CHAIR', 'TREASURER'] } },
      select: { userId: true },
      take: 3,
    })
    const actorId = chamaAdmins[0]?.userId ?? legacyAdmin.id

    // CHAMA_CREATED (backdated)
    const createdDate = new Date(now)
    createdDate.setMonth(createdDate.getMonth() - 24)
    await prisma.auditLog.create({
      data: {
        chamaId,
        actorId,
        action: 'CREATE',
        entity: 'CHAMA',
        entityId: chamaId,
        meta: { name: ch.name, chamaCode: ch.chamaCode },
        createdAt: createdDate,
      },
    })

    // CONTRIBUTION - CREATE for recent contributions
    const contributions = await prisma.contribution.findMany({
      where: { chamaId },
      orderBy: { paidAt: 'desc' },
      take: 40,
      select: { id: true, userId: true, amount: true, method: true, paidAt: true },
    })
    for (const c of contributions) {
      await prisma.auditLog.create({
        data: {
          chamaId,
          actorId: c.userId,
          action: 'CREATE',
          entity: 'CONTRIBUTION',
          entityId: c.id,
          meta: { amount: c.amount, method: c.method },
          createdAt: c.paidAt,
        },
      })
    }

    // LOAN - REQUEST, APPROVE, LOAN_DISBURSE per loan
    const loans = await prisma.loan.findMany({
      where: { chamaId },
      orderBy: { requestedAt: 'desc' },
      take: 25,
      select: { id: true, userId: true, principal: true, totalDue: true, status: true, requestedAt: true, approvedAt: true },
    })
    for (const loan of loans) {
      const approvedAt = loan.approvedAt || loan.requestedAt
      await prisma.auditLog.create({
        data: {
          chamaId,
          actorId: loan.userId,
          action: 'REQUEST',
          entity: 'LOAN',
          entityId: loan.id,
          meta: { principal: loan.principal, totalDue: loan.totalDue },
          createdAt: loan.requestedAt,
        },
      })
      if (loan.status !== 'PENDING' && loan.status !== 'REJECTED') {
        await prisma.auditLog.create({
          data: {
            chamaId,
            actorId,
            action: 'APPROVE',
            entity: 'LOAN',
            entityId: loan.id,
            meta: { principal: loan.principal },
            createdAt: approvedAt,
          },
        })
        await prisma.auditLog.create({
          data: {
            chamaId,
            actorId,
            action: 'LOAN_DISBURSE',
            entity: 'LOAN',
            entityId: loan.id,
            meta: { amount: loan.principal },
            createdAt: approvedAt,
          },
        })
      }
    }

    // REPAYMENT - CREATE for recent repayments
    const repayments = await prisma.repayment.findMany({
      where: { chamaId },
      orderBy: { paidAt: 'desc' },
      take: 30,
      select: { id: true, userId: true, loanId: true, amount: true, paidAt: true },
    })
    for (const r of repayments) {
      await prisma.auditLog.create({
        data: {
          chamaId,
          actorId: r.userId,
          action: 'CREATE',
          entity: 'REPAYMENT',
          entityId: r.id,
          meta: { amount: r.amount, loanId: r.loanId },
          createdAt: r.paidAt,
        },
      })
    }

    // JOIN_REQUEST - JOIN_REQUEST_CREATED (and some APPROVED/REJECTED)
    const joinReqs = await prisma.joinRequest.findMany({
      where: { chamaId },
      take: 15,
      select: { id: true, userId: true, status: true, createdAt: true },
    })
    for (const jr of joinReqs) {
      await prisma.auditLog.create({
        data: {
          chamaId,
          actorId: jr.userId,
          action: 'JOIN_REQUEST_CREATED',
          entity: 'JOIN_REQUEST',
          entityId: jr.id,
          meta: { status: jr.status },
          createdAt: jr.createdAt,
        },
      })
      if (jr.status === 'APPROVED' || jr.status === 'REJECTED') {
        await prisma.auditLog.create({
          data: {
            chamaId,
            actorId,
            action: jr.status === 'APPROVED' ? 'JOIN_REQUEST_APPROVED' : 'JOIN_REQUEST_REJECTED',
            entity: 'JOIN_REQUEST',
            entityId: jr.id,
            meta: {},
            createdAt: new Date(jr.createdAt.getTime() + 86400000),
          },
        })
      }
    }

    // UPDATE_SETTINGS (once per chama)
    const settingsDate = new Date(now)
    settingsDate.setDate(settingsDate.getDate() - 7)
    await prisma.auditLog.create({
      data: {
        chamaId,
        actorId,
        action: 'UPDATE_SETTINGS',
        entity: 'CHAMA',
        entityId: chamaId,
        meta: {
          contributionAmount: ch.spec.contributionAmount,
          cycleDay: ch.spec.cycleDay,
          loanInterestRate: ch.spec.loanInterestRate,
          penaltyRate: ch.spec.penaltyRate,
        },
        createdAt: settingsDate,
      },
    })

    // UPDATE_ROLE (a few memberships)
    const memberships = await prisma.membership.findMany({
      where: { chamaId },
      take: 5,
      select: { id: true, userId: true, role: true },
    })
    for (let i = 0; i < Math.min(3, memberships.length); i++) {
      const m = memberships[i]
      const roleDate = new Date(now)
      roleDate.setMonth(roleDate.getMonth() - (i + 2))
      await prisma.auditLog.create({
        data: {
          chamaId,
          actorId,
          action: 'UPDATE_ROLE',
          entity: 'MEMBERSHIP',
          entityId: m.id,
          meta: { role: m.role },
          createdAt: roleDate,
        },
      })
    }
  }
  console.log('✅ Audit logs (contributions, loans, repayments, join requests, settings, roles)\n')

  // ---------- 8. OUTPUT: Seed complete + demo logins ----------
  console.log('')
  console.log('Seed complete.')
  console.log('')
  console.log('='.repeat(70))
  console.log('📋 DEMO LOGINS (avatars set for these users)')
  console.log('='.repeat(70))
  console.log('')
  console.log('1) SUPER ADMIN')
  console.log('   admin@chama.com  /  Admin123!')
  console.log('')
  console.log('2) ADMINS (with chama codes)')
  console.log('   admin@chama.com     / Admin123!     → All chamas (ADMIN)')
  console.log('   treasurer@chama.com / Treasurer123! → KRU001, NBO002 (TREASURER)')
  console.log('')
  console.log('3) MEMBERS')
  console.log('   member1@chama.com / Member123!  → KRU001, NBO002')
  console.log('   member2@chama.com / Member123!  → KRU001, NBO002')
  console.log('   member3@chama.com / Member123!  → KRU001, NBO002')
  console.log('')
  console.log('📦 CHAMA CODES: ' + chamas.map((c) => c.chamaCode).join(', '))
  console.log('   Avatars are set for: super admin, 2 admins, 3 members, treasurer.')
  console.log('='.repeat(70))
  console.log('')
}

runWithRetry(main)
  .then(async () => {
    console.log('Seed completed')
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
