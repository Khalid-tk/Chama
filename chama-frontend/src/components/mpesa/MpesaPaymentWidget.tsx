import { useState } from 'react'
import { Smartphone, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatKES } from '../../lib/format'

type PaymentStatus = 'idle' | 'pending' | 'success' | 'failed'

type MpesaPaymentWidgetProps = {
  amount?: number
  phoneNumber?: string
  onPaymentInitiated?: (phone: string, amount: number) => void
}

export function MpesaPaymentWidget({
  amount: initialAmount,
  phoneNumber: initialPhone,
  onPaymentInitiated,
}: MpesaPaymentWidgetProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '')
  const [amount, setAmount] = useState(initialAmount || 0)
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [error, setError] = useState<string>('')

  const handleInitiatePayment = async () => {
    if (!phoneNumber || !amount) {
      setError('Please enter phone number and amount')
      return
    }

    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setStatus('pending')
    setError('')

    // Simulate STK push (replace with actual API call)
    try {
      // In real app: await initiateSTKPush(phoneNumber, amount)
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Simulate success/failure (in real app, check API response)
      const success = Math.random() > 0.2 // 80% success rate
      setStatus(success ? 'success' : 'failed')
      if (!success) {
        setError('Payment failed. Please try again.')
      }

      if (onPaymentInitiated) {
        onPaymentInitiated(phoneNumber, amount)
      }
    } catch (err) {
      setStatus('failed')
      setError('An error occurred. Please try again.')
    }
  }

  const handleRetry = () => {
    setStatus('idle')
    setError('')
  }

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-purple-200/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="text-purple-600" size={20} />
          <h3 className="font-semibold text-slate-800">Mpesa Payment</h3>
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
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleInitiatePayment} className="w-full">
              Initiate Payment
            </Button>
          </>
        )}

        {status === 'pending' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="animate-spin text-purple-600" size={48} />
            <div className="text-center">
              <p className="font-medium text-slate-800">Processing payment...</p>
              <p className="text-sm text-slate-500">Please check your phone and enter your M-Pesa PIN</p>
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
                {formatKES(amount)} has been processed
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
            <div className="flex gap-2 w-full">
              <Button variant="secondary" onClick={handleRetry} className="flex-1">
                <RefreshCw size={16} />
                Retry
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
