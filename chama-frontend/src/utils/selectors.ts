/**
 * Data selectors for filtering member-scoped data
 * In real app, these would filter by userId from API
 */

/**
 * Select member's own contributions
 */
export function selectMemberContributions<T extends { member: string }>(
  allContributions: T[],
  memberName: string
): T[] {
  // In real app: filter by userId
  // For demo: filter by member name (first name match)
  const firstName = memberName.split(' ')[0]
  return allContributions.filter(c => {
    const contribFirstName = c.member.split(' ')[0]
    return contribFirstName === firstName || c.member === memberName
  })
}

/**
 * Select member's own loans
 */
export function selectMemberLoans<T extends { member: string }>(
  allLoans: T[],
  memberName: string
): T[] {
  // In real app: filter by userId
  const firstName = memberName.split(' ')[0]
  return allLoans.filter(l => {
    const loanFirstName = l.member.split(' ')[0]
    return loanFirstName === firstName || l.member === memberName
  })
}

/**
 * Select member's own transactions
 */
export function selectMemberTransactions<T extends { member?: string; desc?: string }>(
  allTransactions: T[],
  memberName: string
): T[] {
  // In real app: filter by userId
  // For demo: if transaction has member field, filter by it; otherwise show all (as personal)
  return allTransactions.filter(t => {
    if (t.member) {
      const firstName = memberName.split(' ')[0]
      const transFirstName = t.member.split(' ')[0]
      return transFirstName === firstName || t.member === memberName
    }
    // If no member field, assume it's personal transaction
    return true
  })
}

/**
 * Select member's own Mpesa payments
 */
export function selectMemberPayments<T extends { phoneNumber?: string; description?: string }>(
  allPayments: T[],
  memberName: string
): T[] {
  // In real app: filter by userId
  // For demo: filter by description containing member name
  const firstName = memberName.split(' ')[0]
  return allPayments.filter(p => {
    if (p.description) {
      return p.description.includes(firstName) || p.description.includes(memberName)
    }
    return true
  })
}
