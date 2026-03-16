import { useEffect } from 'react'

type DrawerProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  side?: 'left' | 'right'
  className?: string
}

export function Drawer({ open, onClose, children, side = 'left', className = '' }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`fixed top-0 z-50 h-full w-[280px] max-w-[85vw] transform bg-gradient-to-b from-blue-700 to-brown-dark text-white shadow-xl transition-transform duration-300 ease-out md:hidden ${className} ${
          side === 'left' ? 'left-0' : 'right-0'
        } ${open ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full'}`}
        aria-modal="true"
        role="dialog"
        aria-label="Navigation menu"
      >
        {children}
      </aside>
    </>
  )
}
