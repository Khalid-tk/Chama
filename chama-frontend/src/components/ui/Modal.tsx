import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  hideClose?: boolean
}

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, description, children, size = 'sm', hideClose = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop — warm-tinted */}
      <div className="absolute inset-0 bg-ink-900/50" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className={`relative w-full ${sizeMap[size]} rounded-lg border border-ink-300 bg-warm-card overflow-hidden`}
        style={{ boxShadow: '0 24px 64px rgba(47,36,29,0.22)' }}
      >
        {/* Header — deeper parchment frame */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-ink-300 bg-warm-deep px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2
                  className="text-base font-bold text-ink-900 leading-snug"
                  style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-ink-500">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-warm-bg hover:text-ink-700 transition-colors mt-0.5"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-64px)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2.5 border-t border-ink-200 bg-warm-bg px-5 py-3.5">
      {children}
    </div>
  )
}
