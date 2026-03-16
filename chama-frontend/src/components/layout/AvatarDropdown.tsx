import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { User, Settings, Bell, LogOut, HelpCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useChamaStore } from '../../store/chamaStore'

function initials(name: string) {
  return (name ?? '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

const ITEMS = [
  { to: '/profile',       icon: User,       label: 'Profile' },
  { to: '/settings',      icon: Settings,   label: 'Settings' },
  { to: '/notifications', icon: Bell,       label: 'Notifications' },
  { to: '/help',          icon: HelpCircle, label: 'Help' },
] as const

type Props = {
  onLogout?: () => void
  chamaSettingsTo?: string | null
  chamaSettingsLabel?: string
  className?: string
}

export function AvatarDropdown({ onLogout, chamaSettingsTo, chamaSettingsLabel = 'Chama settings', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState<{ top: number; right: number } | null>(null)
  const ref    = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { clearActiveChama } = useChamaStore()

  /* Close on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      if ((e.target as Element).closest?.('[data-avatar-dd]')) return
      setOpen(false)
    }
    if (open) {
      document.addEventListener('click', fn)
      if (!window.matchMedia('(min-width:768px)').matches) document.body.style.overflow = 'hidden'
    }
    return () => { document.removeEventListener('click', fn); document.body.style.overflow = '' }
  }, [open])

  /* Desktop position */
  useEffect(() => {
    if (open && ref.current && window.matchMedia('(min-width:768px)').matches) {
      const update = () => {
        const r = ref.current!.getBoundingClientRect()
        setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
      }
      update()
      window.addEventListener('scroll', update, true)
      window.addEventListener('resize', update)
      return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
    }
    setPos(null)
  }, [open])

  const doLogout = () => { setOpen(false); logout(); clearActiveChama(); onLogout ? onLogout() : navigate('/login') }
  const go       = (to: string) => { setOpen(false); navigate(to) }

  const ini     = initials(user?.fullName ?? '')
  const avatar  = user?.avatarUrl

  const btnCls  = 'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-ink-700 hover:bg-warm-deep transition-colors'

  const Items = () => (
    <>
      {ITEMS.map(({ to, icon: Icon, label }) => (
        <button key={to} type="button" onClick={() => go(to)} className={btnCls}>
          <Icon size={14} className="shrink-0 text-ink-400" /> {label}
        </button>
      ))}
      {chamaSettingsTo && (
        <button type="button" onClick={() => go(chamaSettingsTo)} className={`${btnCls} border-t border-ink-200 mt-1 pt-2`}>
          <Settings size={14} className="shrink-0 text-ink-400" /> {chamaSettingsLabel}
        </button>
      )}
      <button type="button" onClick={doLogout} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-ink-200 mt-1 pt-2">
        <LogOut size={14} className="shrink-0" /> Sign out
      </button>
    </>
  )

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brown rounded-full"
        aria-expanded={open} aria-haspopup="true">
        {avatar
          ? <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-ink-300" />
          : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-warm-sidebar text-[11px] font-semibold text-warm-card" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>{ini}</div>
        }
      </button>

      {/* Desktop portal */}
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div data-avatar-dd className="fixed z-[9999] w-52 rounded-lg border border-ink-300 bg-warm-card py-1.5 overflow-hidden"
          style={{ boxShadow: 'var(--shadow-md)', top: pos.top, right: pos.right }}>
          <div className="px-3.5 pb-2.5 pt-2 border-b border-ink-200 mb-1">
            <p className="text-sm font-semibold text-ink-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-ink-500 truncate">{user?.email}</p>
          </div>
          <div className="px-1.5 pb-1"><Items /></div>
        </div>,
        document.body
      )}

      {/* Mobile bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl bg-warm-card border-t border-ink-300 overflow-hidden">
            <div className="flex justify-center py-3"><div className="h-1 w-10 rounded-full bg-warm-deep" /></div>
            <div className="flex items-center gap-3 border-b border-ink-200 px-4 pb-3">
              {avatar
                ? <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-sidebar text-sm font-semibold text-warm-card" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>{ini}</div>
              }
              <div><p className="text-sm font-semibold text-ink-900">{user?.fullName}</p><p className="text-xs text-ink-500">{user?.email}</p></div>
            </div>
            <div className="px-2 pb-8 pt-1"><Items /></div>
          </div>
        </div>
      )}
    </div>
  )
}
