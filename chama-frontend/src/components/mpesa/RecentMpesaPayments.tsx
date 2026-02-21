import { Badge } from '../ui/Badge'
import {
  TableShell,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '../ui/TableShell'
import { formatKES, formatDateShort } from '../../lib/format'

type Payment = {
  id: string
  phone: string
  amount: number
  createdAt: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'TIMEOUT'
  purpose?: string
  mpesaReceiptNo?: string
  user?: {
    fullName: string
    email: string
  }
}

type RecentMpesaPaymentsProps = {
  payments: Payment[]
  isAdmin?: boolean
}

export function RecentMpesaPayments({ payments, isAdmin = false }: RecentMpesaPaymentsProps) {
  const recentPayments = payments.slice(0, 10)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'success'
      case 'FAILED':
      case 'TIMEOUT':
        return 'danger'
      case 'PENDING':
        return 'warning'
      default:
        return 'warning'
    }
  }

  return (
    <div className="max-h-80 overflow-auto">
      <TableShell>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {isAdmin && <TableHead>Member</TableHead>}
            <TableHead>Phone</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead>Receipt</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentPayments.length === 0 ? (
            <TableEmpty colSpan={isAdmin ? 7 : 6} message="No payments found." />
          ) : (
            recentPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDateShort(payment.createdAt)}</TableCell>
                {isAdmin && (
                  <TableCell className="font-medium">
                    {payment.user?.fullName || 'N/A'}
                  </TableCell>
                )}
                <TableCell>{payment.phone}</TableCell>
                <TableCell>{payment.purpose || 'N/A'}</TableCell>
                <TableCell className="text-right font-semibold">{formatKES(payment.amount)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="font-mono text-xs">
                    {payment.mpesaReceiptNo || '-'}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </TableShell>
    </div>
  )
}
