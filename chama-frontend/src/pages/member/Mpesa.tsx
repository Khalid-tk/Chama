import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Smartphone, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { formatKES } from '../../lib/format'
import { useAuthStore } from '../../store/authStore'
import { RecentMpesaPayments } from '../../components/mpesa/RecentMpesaPayments'
import { useChamaId } from '../../hooks/useChamaId'
import api, { chamaRoute } from '../../lib/api'

type PaymentStatus = 'idle' | 'pending' | 'success' | 'failed'

export function MemberMpesa() {
  const chamaId = useChamaId()
  const location = useLocation()
  const state = (location.state as { purpose?: 'REPAYMENT'; loanId?: string }) || {}
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState<'CONTRIBUTION' | 'REPAYMENT'>(state.purpose || 'CONTRIBUTION')
  const [loanId, setLoanId] = useState(state.loanId || '')
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [error, setError] = useState<string>('')
  const [payments, setPayments] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [activeLoans, setActiveLoans] = useState<Array<{ id: string; principal: number; totalDue: number; dueDate: string | null }>>([])

  useEffect(() => {
    loadPayments()
  }, [chamaId])

  useEffect(() => {
    if (chamaId && purpose === 'REPAYMENT') {
      api
        .get(chamaRoute(chamaId, '/my/loans'))
        .then((res) => {
          const data = res.data?.data?.data ?? res.data?.data ?? []
          const active = Array.isArray(data) ? data.filter((l: any) => l.status === 'ACTIVE') : []
          setActiveLoans(active.map((l: any) => ({ id: l.id, principal: l.principal, totalDue: l.totalDue, dueDate: l.dueDate })))
        })
        .catch(() => setActiveLoans([]))
    } else {
      setActiveLoans([])
    }
  }, [chamaId, purpose])

  const loadPayments = async () => {
    if (!chamaId) {
      setLoadingPayments(false)
      return
    }
    try {
      const response = await api.get(chamaRoute(chamaId, '/my/mpesa'))
      const payload = response.data?.data
      const list = Array.isArray(payload?.data) ? payload.data : []
      setPayments(list)
    } catch (error) {
      console.error('Failed to load payments:', error)
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleInitiatePayment = async () => {
    if (!phoneNumber || !amount) {
      setError('Please enter phone number and amount')
      return
    }

    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (purpose === 'REPAYMENT' && !loanId?.trim()) {
      setError('Please select the loan to repay')
      return
    }

    setError('')
    setStatus('pending')

    try {
      const response = await api.post(chamaRoute(chamaId, '/stkpush'), {
        purpose,
        amount: amountNum,
        phone: phoneNumber,
        loanId: loanId || undefined,
      })

      const data = response.data?.data
      const paymentId = data?.id ?? data?.payment?.id
      const checkoutRequestId =
        data?.safaricom?.CheckoutRequestID ?? data?.payment?.checkoutRequestId

      // In dev: if we got a checkout ID (mock or real), simulate callback after short delay so payment completes
      const isDev = import.meta.env.DEV
      if (isDev && checkoutRequestId) {
        setTimeout(async () => {
          try {
            await api.post('/mpesa/dev/simulate-callback', {
              checkoutRequestId,
              resultCode: 0,
              mpesaReceiptNo: `SIM-${Date.now()}`,
            })
          } catch {
            // Endpoint may 404 in production; polling will still run
          }
        }, 2500)
      }

      setStatus('pending')

      // Poll for payment status updates
      let pollCount = 0
      const maxPolls = 40

      const pollInterval = setInterval(async () => {
        try {
          pollCount++
          const refreshResponse = await api.get(chamaRoute(chamaId, '/my/mpesa'))
          const payload = refreshResponse.data?.data
          const updatedPayments = Array.isArray(payload?.data) ? payload.data : []
          const updatedPayment = updatedPayments.find((p: any) => p.id === paymentId)
          
          if (updatedPayment) {
            if (updatedPayment.status === 'SUCCESS') {
              clearInterval(pollInterval)
              setStatus('success')
              setPayments(updatedPayments)
              setTimeout(() => {
                setStatus('idle')
                setPhoneNumber('')
                setAmount('')
                setLoanId('')
                loadPayments()
              }, 3000)
            } else if (updatedPayment.status === 'FAILED' || updatedPayment.status === 'TIMEOUT') {
              clearInterval(pollInterval)
              setStatus('failed')
              setError('Payment failed. Please try again.')
              setPayments(updatedPayments)
            }
          }
          
          // Stop polling after max attempts
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval)
            setStatus('idle')
            loadPayments()
          }
        } catch (err) {
          console.error('Polling error:', err)
          // Continue polling on error
        }
      }, 3000) // Poll every 3 seconds
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment')
      setStatus('failed')
    }
  }

  const handleRetry = () => {
    setStatus('idle')
    setError('')
  }

  const handleRefresh = async () => {
    if (!chamaId) return
    setLoadingPayments(true)
    try {
      const response = await api.get(chamaRoute(chamaId, '/my/mpesa'))
      const payload = response.data?.data
      const list = Array.isArray(payload?.data) ? payload.data : []
      setPayments(list)
    } catch (error) {
      console.error('Failed to load payments:', error)
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Mpesa Payments</h1>
        <p className="text-sm text-slate-500">Make payments and view your payment history</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Make Payment Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="text-blue-600" size={20} />
              <h2 className="font-semibold text-slate-800">Make Payment</h2>
            </div>
            <p className="text-sm text-slate-500">Initiate STK push payment</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'idle' && (
              <>
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  icon={<Smartphone size={18} />}
                />
                <Input
                  label="Amount (KES)"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Purpose
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as 'CONTRIBUTION' | 'REPAYMENT')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="CONTRIBUTION">Contribution</option>
                    <option value="REPAYMENT">Loan Repayment</option>
                  </select>
                </div>
                {purpose === 'REPAYMENT' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Loan to repay</label>
                    <select
                      value={loanId}
                      onChange={(e) => setLoanId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[44px]"
                    >
                      <option value="">Select active loan</option>
                      {activeLoans.map((loan) => (
                        <option key={loan.id} value={loan.id}>
                          KES {loan.totalDue?.toLocaleString()} (due: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'})
                        </option>
                      ))}
                    </select>
                    {activeLoans.length === 0 && purpose === 'REPAYMENT' && (
                      <p className="mt-1 text-xs text-slate-500">No active loans. Pay contributions or request a loan first.</p>
                    )}
                  </div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button onClick={handleInitiatePayment} className="w-full">
                  Initiate Payment
                </Button>
              </>
            )}

            {status === 'pending' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <div className="text-center">
                  <p className="font-medium text-slate-800">Processing payment...</p>
                  <p className="text-sm text-slate-500">Please check your phone and enter your M-Pesa PIN</p>
                  {import.meta.env.DEV && (
                    <p className="mt-2 text-xs text-slate-400">Dev: payment will complete automatically in a few seconds.</p>
                  )}
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <CheckCircle2 className="text-emerald-600" size={48} />
                <div className="text-center">
                  <p className="font-medium text-slate-800">Payment Successful!</p>
                  <p className="text-sm text-slate-500">
                    {formatKES(parseFloat(amount) || 0)} has been processed
                  </p>
                </div>
                <Badge variant="success">Success</Badge>
                <Button variant="secondary" onClick={handleRetry} className="w-full">
                  Make Another Payment
                </Button>
              </div>
            )}

            {status === 'failed' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <XCircle className="text-red-600" size={48} />
                <div className="text-center">
                  <p className="font-medium text-slate-800">Payment Failed</p>
                  <p className="text-sm text-slate-500">{error || 'Please try again'}</p>
                </div>
                <Badge variant="danger">Failed</Badge>
                <Button variant="secondary" onClick={handleRetry} className="w-full">
                  <RefreshCw size={16} />
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Summary */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Payment Summary</h2>
            <p className="text-sm text-slate-500">Your payment statistics</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Payments</span>
              <span className="font-semibold text-slate-800">{payments.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Successful</span>
              <span className="font-semibold text-emerald-600">
                {payments.filter((p) => p.status === 'SUCCESS').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Failed</span>
              <span className="font-semibold text-red-600">
                {payments.filter((p) => p.status === 'FAILED').length}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-slate-600">Total Amount</span>
              <span className="font-bold text-blue-600">
                {formatKES(
                  payments.reduce(
                    (sum, p) => sum + (p.status === 'SUCCESS' ? p.amount : 0),
                    0
                  )
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Recent Payments</h2>
              <p className="text-sm text-slate-500">Your payment history</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loadingPayments}>
              <RefreshCw size={16} className={loadingPayments ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="p-8 text-center text-slate-500">Loading payments...</div>
          ) : (
            <RecentMpesaPayments payments={payments} isAdmin={false} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
