import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent } from './Card'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

type ToastProps = {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="text-emerald-600" size={20} />,
    error: <AlertCircle className="text-red-600" size={20} />,
    warning: <AlertCircle className="text-amber-600" size={20} />,
    info: <Info className="text-brown" size={20} />,
  }

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-brown-light border-ink-300',
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
      <Card className={`${bgColors[type]} shadow-lg`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {icons[type]}
            <p className="flex-1 text-sm font-medium text-ink-900">{message}</p>
            <button
              onClick={onClose}
              className="rounded p-1 text-ink-400 hover:text-ink-700"
            >
              <X size={16} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
