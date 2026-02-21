import prisma from '../prisma.js'

function parseRange(range) {
  const now = new Date()
  const start = new Date(now)
  switch (range) {
    case '1m':
      start.setMonth(now.getMonth() - 1)
      break
    case '3m':
      start.setMonth(now.getMonth() - 3)
      break
    case '6m':
      start.setMonth(now.getMonth() - 6)
      break
    case '12m':
      start.setMonth(now.getMonth() - 12)
      break
    default:
      start.setMonth(now.getMonth() - 6)
  }
  return start
}

function monthKey(d) {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [y, m] = key.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function fillMonths(keys, fn) {
  const sorted = [...keys].sort()
  if (sorted.length === 0) return []
  return sorted.map((k) => ({ month: monthLabel(k), monthKey: k, ...fn(k) }))
}

/** Return array of YYYY-MM for the last N months so charts always have a full range */
function getMonthKeysForRange(range) {
  const start = parseRange(range)
  const now = new Date()
  const keys = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur <= now) {
    keys.push(monthKey(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return keys
}

function ensureNumber(v) {
  if (v == null || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function getAdminAnalytics(chamaId, range = '6m') {
  const startDate = parseRange(range)
  const now = new Date()

  const [contributions, transactions, loans, mpesaPayments, memberships] = await Promise.all([
    prisma.contribution.findMany({
      where: { chamaId, paidAt: { gte: startDate } },
      select: { amount: true, paidAt: true, userId: true },
    }),
    prisma.transaction.findMany({
      where: { chamaId, createdAt: { gte: startDate } },
      select: { type: true, direction: true, amount: true, createdAt: true },
    }),
    prisma.loan.findMany({
      where: { chamaId },
      include: { repayments: { select: { amount: true } } },
    }),
    prisma.mpesaPayment.findMany({
      where: { chamaId, createdAt: { gte: startDate } },
      select: { status: true, createdAt: true },
    }),
    prisma.membership.findMany({
      where: { chamaId, isActive: true },
      select: { joinedAt: true },
    }),
  ])

  const disburseTx = await prisma.transaction.findMany({
    where: { chamaId, type: 'LOAN_DISBURSE', createdAt: { gte: startDate } },
    select: { amount: true, createdAt: true },
  })
  const repayments = await prisma.repayment.findMany({
    where: { chamaId, paidAt: { gte: startDate } },
    select: { amount: true, paidAt: true },
  })

  const defaultMonthKeys = getMonthKeysForRange(range)

  const totalIn = transactions.filter((t) => t.direction === 'IN').reduce((s, t) => s + ensureNumber(t.amount), 0)
  const totalOut = transactions.filter((t) => t.direction === 'OUT').reduce((s, t) => s + ensureNumber(t.amount), 0)
  const totalBalance = ensureNumber(totalIn - totalOut)

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const contributionsThisMonth = contributions
    .filter((c) => new Date(c.paidAt) >= thisMonthStart)
    .reduce((s, c) => s + ensureNumber(c.amount), 0)

  const outstandingLoans = loans
    .filter((l) => l.status === 'ACTIVE' || l.status === 'LATE')
    .reduce((s, l) => {
      const repaid = l.repayments.reduce((a, r) => a + ensureNumber(r.amount), 0)
      return s + (ensureNumber(l.totalDue) - repaid)
    }, 0)
  const lateLoansCount = loans.filter((l) => l.status === 'LATE').length

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const mpesaLast30 = mpesaPayments.filter((p) => new Date(p.createdAt) >= thirtyDaysAgo)
  const mpesaSuccess30 = mpesaLast30.filter((p) => p.status === 'SUCCESS').length
  const mpesaSuccessRate30d = mpesaLast30.length ? Math.round((mpesaSuccess30 / mpesaLast30.length) * 100) : 0

  const activeMembers = await prisma.membership.count({
    where: { chamaId, isActive: true },
  })

  const contribByMonth = {}
  contributions.forEach((c) => {
    const k = monthKey(c.paidAt)
    if (!contribByMonth[k]) contribByMonth[k] = 0
    contribByMonth[k] += ensureNumber(c.amount)
  })
  const contributionsMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(contribByMonth), (k) => ({
    totalAmount: ensureNumber(contribByMonth[k]),
  }))

  const byUser = {}
  contributions.forEach((c) => {
    byUser[c.userId] = (byUser[c.userId] || 0) + c.amount
  })
  const userIds = Object.keys(byUser)
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true },
      })
    : []
  const contributionsByMemberTop = users
    .map((u) => ({ name: u.fullName || 'Unknown', totalAmount: ensureNumber(byUser[u.id]) }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)

  const loanStatusCounts = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    ACTIVE: 0,
    LATE: 0,
    PAID: 0,
  }
  loans.forEach((l) => {
    loanStatusCounts[l.status] = (loanStatusCounts[l.status] || 0) + 1
  })

  const disburseByMonth = {}
  disburseTx.forEach((t) => {
    const k = monthKey(t.createdAt)
    if (!disburseByMonth[k]) disburseByMonth[k] = 0
    disburseByMonth[k] += t.amount
  })
  const loanDisburseMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(disburseByMonth), (k) => ({
    totalAmount: ensureNumber(disburseByMonth[k]),
  }))

  const repayByMonth = {}
  repayments.forEach((r) => {
    const k = monthKey(r.paidAt)
    if (!repayByMonth[k]) repayByMonth[k] = 0
    repayByMonth[k] += ensureNumber(r.amount)
  })
  const repaymentsMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(repayByMonth), (k) => ({
    totalAmount: ensureNumber(repayByMonth[k]),
  }))

  const cashflowByMonth = {}
  transactions.forEach((t) => {
    const k = monthKey(t.createdAt)
    if (!cashflowByMonth[k]) cashflowByMonth[k] = { inflow: 0, outflow: 0 }
    if (t.direction === 'IN') cashflowByMonth[k].inflow += ensureNumber(t.amount)
    else cashflowByMonth[k].outflow += ensureNumber(t.amount)
  })
  const cashflowMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(cashflowByMonth), (k) => ({
    inflow: ensureNumber(cashflowByMonth[k]?.inflow),
    outflow: ensureNumber(cashflowByMonth[k]?.outflow),
  }))

  const mpesaByMonth = {}
  mpesaPayments.forEach((p) => {
    const k = monthKey(p.createdAt)
    if (!mpesaByMonth[k]) mpesaByMonth[k] = { success: 0, failed: 0, pending: 0 }
    if (p.status === 'SUCCESS') mpesaByMonth[k].success++
    else if (p.status === 'FAILED' || p.status === 'TIMEOUT') mpesaByMonth[k].failed++
    else mpesaByMonth[k].pending++
  })
  const mpesaOutcomesMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(mpesaByMonth), (k) => ({
    success: ensureNumber(mpesaByMonth[k]?.success),
    failed: ensureNumber(mpesaByMonth[k]?.failed),
    pending: ensureNumber(mpesaByMonth[k]?.pending),
  }))

  const joinsByMonth = {}
  memberships.forEach((m) => {
    const k = monthKey(m.joinedAt)
    if (new Date(m.joinedAt) >= startDate) {
      joinsByMonth[k] = (joinsByMonth[k] || 0) + 1
    }
  })
  const newMembersMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(joinsByMonth), (k) => ({
    count: ensureNumber(joinsByMonth[k]),
  }))

  const totalLoanedInPeriod = disburseTx.reduce((s, t) => s + ensureNumber(t.amount), 0)
  const totalRepaidInPeriod = repayments.reduce((s, r) => s + ensureNumber(r.amount), 0)

  return {
    kpis: {
      totalBalance: ensureNumber(totalBalance),
      contributionsThisMonth: ensureNumber(contributionsThisMonth),
      outstandingLoans: ensureNumber(outstandingLoans),
      lateLoansCount: ensureNumber(lateLoansCount),
      mpesaSuccessRate30d: ensureNumber(mpesaSuccessRate30d),
      activeMembers: ensureNumber(activeMembers),
      totalLoanedInPeriod: ensureNumber(totalLoanedInPeriod),
      totalRepaidInPeriod: ensureNumber(totalRepaidInPeriod),
    },
    series: {
      contributionsMonthly: Array.isArray(contributionsMonthly) ? contributionsMonthly : [],
      contributionsByMemberTop: Array.isArray(contributionsByMemberTop) ? contributionsByMemberTop : [],
      loanStatusCounts: loanStatusCounts && typeof loanStatusCounts === 'object' ? loanStatusCounts : { PENDING: 0, APPROVED: 0, REJECTED: 0, ACTIVE: 0, LATE: 0, PAID: 0 },
      loanDisburseMonthly: Array.isArray(loanDisburseMonthly) ? loanDisburseMonthly : [],
      repaymentsMonthly: Array.isArray(repaymentsMonthly) ? repaymentsMonthly : [],
      cashflowMonthly: Array.isArray(cashflowMonthly) ? cashflowMonthly : [],
      mpesaOutcomesMonthly: Array.isArray(mpesaOutcomesMonthly) ? mpesaOutcomesMonthly : [],
      newMembersMonthly: Array.isArray(newMembersMonthly) ? newMembersMonthly : [],
    },
  }
}

export async function getMemberAnalytics(chamaId, userId, range = '6m') {
  const startDate = parseRange(range)
  const now = new Date()
  const defaultMonthKeys = getMonthKeysForRange(range)

  const [contributions, repayments, loans, mpesaPayments, memberships] = await Promise.all([
    prisma.contribution.findMany({
      where: { chamaId, userId, paidAt: { gte: startDate } },
      select: { amount: true, paidAt: true },
    }),
    prisma.repayment.findMany({
      where: { chamaId, userId, paidAt: { gte: startDate } },
      select: { amount: true, paidAt: true },
    }),
    prisma.loan.findMany({
      where: { chamaId, userId },
      include: { repayments: { select: { amount: true } } },
    }),
    prisma.mpesaPayment.findMany({
      where: { chamaId, userId, createdAt: { gte: startDate } },
      select: { status: true, createdAt: true },
    }),
    prisma.membership.findMany({
      where: { chamaId, isActive: true },
      select: { joinedAt: true },
    }),
  ])

  const myTotalContributions = contributions.reduce((s, c) => s + ensureNumber(c.amount), 0)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const myContributionThisMonth = contributions
    .filter((c) => new Date(c.paidAt) >= thisMonthStart)
    .reduce((s, c) => s + ensureNumber(c.amount), 0)

  const activeLoans = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'LATE')
  let myLoanRemaining = 0
  let nextDueDate = null
  for (const loan of activeLoans) {
    const repaid = loan.repayments.reduce((s, r) => s + ensureNumber(r.amount), 0)
    myLoanRemaining += ensureNumber(loan.totalDue) - repaid
    if (loan.dueDate && (!nextDueDate || new Date(loan.dueDate) < nextDueDate)) {
      nextDueDate = loan.dueDate
    }
  }

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const mpesaLast30 = mpesaPayments.filter((p) => new Date(p.createdAt) >= thirtyDaysAgo)
  const mpesaSuccessRate30d = mpesaLast30.length
    ? Math.round((mpesaLast30.filter((p) => p.status === 'SUCCESS').length / mpesaLast30.length) * 100)
    : 0

  const contribMonths = new Set(contributions.map((c) => monthKey(c.paidAt)))
  const sortedMonths = [...contribMonths].sort()
  let contributionStreakMonths = 0
  for (let i = sortedMonths.length - 1; i >= 0; i--) {
    const expected = new Date(now)
    expected.setMonth(expected.getMonth() - (sortedMonths.length - 1 - i))
    if (monthKey(expected) === sortedMonths[i]) contributionStreakMonths++
    else break
  }

  const contribByMonth = {}
  contributions.forEach((c) => {
    const k = monthKey(c.paidAt)
    if (!contribByMonth[k]) contribByMonth[k] = 0
    contribByMonth[k] += ensureNumber(c.amount)
  })
  const myContributionsMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(contribByMonth), (k) => ({
    totalAmount: ensureNumber(contribByMonth[k]),
  }))

  const repayByMonth = {}
  repayments.forEach((r) => {
    const k = monthKey(r.paidAt)
    if (!repayByMonth[k]) repayByMonth[k] = 0
    repayByMonth[k] += ensureNumber(r.amount)
  })
  const myRepaymentsMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(repayByMonth), (k) => ({
    totalAmount: ensureNumber(repayByMonth[k]),
  }))

  const mpesaByMonth = {}
  mpesaPayments.forEach((p) => {
    const k = monthKey(p.createdAt)
    if (!mpesaByMonth[k]) mpesaByMonth[k] = { success: 0, failed: 0, pending: 0 }
    if (p.status === 'SUCCESS') mpesaByMonth[k].success++
    else if (p.status === 'FAILED' || p.status === 'TIMEOUT') mpesaByMonth[k].failed++
    else mpesaByMonth[k].pending++
  })
  const myMpesaOutcomesMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(mpesaByMonth), (k) => ({
    success: ensureNumber(mpesaByMonth[k]?.success),
    failed: ensureNumber(mpesaByMonth[k]?.failed),
    pending: ensureNumber(mpesaByMonth[k]?.pending),
  }))

  const joinsByMonth = {}
  memberships.forEach((m) => {
    const k = monthKey(m.joinedAt)
    if (new Date(m.joinedAt) >= startDate) joinsByMonth[k] = (joinsByMonth[k] || 0) + 1
  })
  const chamaMembersJoiningMonthly = fillMonths(defaultMonthKeys.length ? defaultMonthKeys : Object.keys(joinsByMonth), (k) => ({
    count: ensureNumber(joinsByMonth[k]),
  }))

  const loanProgress = {
    totalDue: ensureNumber(loans.reduce((s, l) => s + ensureNumber(l.totalDue), 0)),
    paidSoFar: ensureNumber(loans.reduce((s, l) => s + l.repayments.reduce((a, r) => a + ensureNumber(r.amount), 0), 0)),
    remaining: ensureNumber(myLoanRemaining),
  }

  return {
    kpis: {
      myContributionThisMonth: ensureNumber(myContributionThisMonth),
      myTotalContributions: ensureNumber(myTotalContributions),
      myLoanRemaining: ensureNumber(myLoanRemaining),
      nextDueDate: nextDueDate ? nextDueDate.toISOString().split('T')[0] : null,
      mpesaSuccessRate30d: ensureNumber(mpesaSuccessRate30d),
      contributionStreakMonths: ensureNumber(contributionStreakMonths),
    },
    series: {
      myContributionsMonthly: Array.isArray(myContributionsMonthly) ? myContributionsMonthly : [],
      myRepaymentsMonthly: Array.isArray(myRepaymentsMonthly) ? myRepaymentsMonthly : [],
      myMpesaOutcomesMonthly: Array.isArray(myMpesaOutcomesMonthly) ? myMpesaOutcomesMonthly : [],
      chamaMembersJoiningMonthly: Array.isArray(chamaMembersJoiningMonthly) ? chamaMembersJoiningMonthly : [],
    },
    loanProgress,
  }
}
