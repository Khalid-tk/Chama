export const mockMembers = [
  { id: '1', name: 'Jane Wanjiku', phone: '+254 712 345 678', joined: '2024-01-15', status: 'Active' },
  { id: '2', name: 'Peter Ochieng', phone: '+254 723 456 789', joined: '2024-02-20', status: 'Active' },
  { id: '3', name: 'Mary Akinyi', phone: '+254 734 567 890', joined: '2024-03-10', status: 'Active' },
  { id: '4', name: 'James Odhiambo', phone: '+254 745 678 901', joined: '2024-04-05', status: 'Active' },
  { id: '5', name: 'Grace Muthoni', phone: '+254 756 789 012', joined: '2024-05-12', status: 'Active' },
  { id: '6', name: 'Daniel Kamau', phone: '+254 767 890 123', joined: '2024-06-18', status: 'Active' },
  { id: '7', name: 'Lucy Njeri', phone: '+254 778 901 234', joined: '2024-07-22', status: 'Active' },
  { id: '8', name: 'Samuel Kipchoge', phone: '+254 789 012 345', joined: '2024-08-30', status: 'Active' },
  { id: '9', name: 'Esther Wambui', phone: '+254 790 123 456', joined: '2024-09-14', status: 'Active' },
  { id: '10', name: 'David Mwangi', phone: '+254 701 234 567', joined: '2024-10-01', status: 'Active' },
]

export const mockContributions = [
  { id: '1', date: '2025-02-05', member: 'Jane Wanjiku', amount: 5000, status: 'Paid' },
  { id: '2', date: '2025-02-05', member: 'Peter Ochieng', amount: 5000, status: 'Paid' },
  { id: '3', date: '2025-02-04', member: 'Mary Akinyi', amount: 5000, status: 'Paid' },
  { id: '4', date: '2025-02-04', member: 'James Odhiambo', amount: 5000, status: 'Paid' },
  { id: '5', date: '2025-02-03', member: 'Grace Muthoni', amount: 5000, status: 'Paid' },
  { id: '6', date: '2025-02-03', member: 'Daniel Kamau', amount: 5000, status: 'Paid' },
  { id: '7', date: '2025-02-02', member: 'Lucy Njeri', amount: 5000, status: 'Paid' },
  { id: '8', date: '2025-02-02', member: 'Samuel Kipchoge', amount: 5000, status: 'Paid' },
  { id: '9', date: '2025-02-01', member: 'Esther Wambui', amount: 5000, status: 'Paid' },
  { id: '10', date: '2025-02-01', member: 'David Mwangi', amount: 5000, status: 'Paid' },
]

export const mockLoans = [
  { id: 'L001', member: 'Jane Wanjiku', amount: 50000, date: '2025-02-05', status: 'Pending' },
  { id: 'L002', member: 'Peter Ochieng', amount: 75000, date: '2025-02-06', status: 'Pending' },
  { id: 'L003', member: 'Mary Akinyi', amount: 100000, date: '2025-01-15', status: 'Active' },
  { id: 'L004', member: 'James Odhiambo', amount: 50000, date: '2025-01-20', status: 'Active' },
  { id: 'L005', member: 'Grace Muthoni', amount: 80000, date: '2024-12-10', status: 'Repaid' },
  { id: 'L006', member: 'Daniel Kamau', amount: 60000, date: '2024-11-22', status: 'Repaid' },
  { id: 'L007', member: 'Lucy Njeri', amount: 45000, date: '2025-02-01', status: 'Pending' },
  { id: 'L008', member: 'Samuel Kipchoge', amount: 90000, date: '2025-01-08', status: 'Active' },
  { id: 'L009', member: 'Esther Wambui', amount: 55000, date: '2024-10-15', status: 'Repaid' },
  { id: 'L010', member: 'David Mwangi', amount: 70000, date: '2025-02-04', status: 'Pending' },
]

export const unpaidMembers = [
  { name: 'Mary Akinyi', dueDate: '2025-02-01' },
  { name: 'James Odhiambo', dueDate: '2025-02-03' },
]

export const memberRecentActivity = [
  { id: '1', date: '2025-02-01', desc: 'Monthly contribution', amount: 5000, type: 'credit' as const },
  { id: '2', date: '2025-01-28', desc: 'Loan disbursement', amount: 100000, type: 'debit' as const },
  { id: '3', date: '2025-01-15', desc: 'Monthly contribution', amount: 5000, type: 'credit' as const },
  { id: '4', date: '2025-01-10', desc: 'Loan repayment', amount: 25000, type: 'debit' as const },
  { id: '5', date: '2025-01-01', desc: 'Monthly contribution', amount: 5000, type: 'credit' as const },
]
