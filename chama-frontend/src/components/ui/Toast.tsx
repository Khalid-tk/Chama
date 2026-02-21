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
    info: <Info className="text-blue-600" size={20} />,
  }

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
      <Card className={`${bgColors[type]} shadow-lg`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {icons[type]}
            <p className="flex-1 text-sm font-medium text-slate-800">{message}</p>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
