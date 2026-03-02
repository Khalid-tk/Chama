import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { User, Settings, Bell, LogOut, HelpCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useChamaStore } from '../../store/chamaStore'

function getInitials(name: string): string {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

const menuItems = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/help', icon: HelpCircle, label: 'Help / About' },
] as const

type AvatarDropdownProps = {
  onLogout?: () => void
  chamaSettingsTo?: string | null
  chamaSettingsLabel?: string
  className?: string
}

export function AvatarDropdown({
  onLogout,
  chamaSettingsTo,
  chamaSettingsLabel = 'Chama settings',
  className = '',
}: AvatarDropdownProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { clearActiveChama } = useChamaStore()
  const ref = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if ((target as Element).closest?.('[data-avatar-dropdown]')) return
      setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      if (!window.matchMedia('(min-width: 768px)').matches) {
        document.body.style.overflow = 'hidden'
      }
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (open && ref.current && typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      const updatePosition = () => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect()
          setDropdownStyle({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
        }
      }
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    } else {
      setDropdownStyle(null)
    }
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    logout()
    clearActiveChama()
    if (onLogout) onLogout()
    else navigate('/login')
  }

  const handleNav = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  const avatarUrl = user?.avatarUrl
  const initials = getInitials(user?.fullName ?? '')

  const content = (
    <>
      {menuItems.map(({ to, icon: Icon, label }) => (
        <button
          key={to}
          type="button"
          onClick={() => handleNav(to)}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-700 hover:bg-slate-100 min-h-[48px] touch-manipulation"
        >
          <Icon size={20} className="shrink-0 text-slate-500" />
          <span className="font-medium">{label}</span>
        </button>
      ))}
      {chamaSettingsTo && (
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            navigate(chamaSettingsTo)
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-700 hover:bg-slate-100 min-h-[48px] touch-manipulation border-t border-slate-100"
        >
          <Settings size={20} className="shrink-0 text-slate-500" />
          <span className="font-medium">{chamaSettingsLabel}</span>
        </button>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-600 hover:bg-red-50 min-h-[48px] touch-manipulation border-t border-slate-100"
      >
        <LogOut size={20} className="shrink-0" />
        <span className="font-medium">Logout</span>
      </button>
    </>
  )

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-10 w-10 rounded-full object-cover border-2 border-white shadow"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white border-2 border-white shadow">
            {initials}
          </div>
        )}
      </button>

      {/* Desktop: dropdown (portal to avoid overflow clipping) */}
      {open && dropdownStyle && typeof document !== 'undefined' && createPortal(
        <div
          data-avatar-dropdown
          className="fixed z-[9999] w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
          style={{ top: dropdownStyle.top, right: dropdownStyle.right, left: 'auto' }}
        >
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          {content}
        </div>,
        document.body
      )}

      {/* Mobile: bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-center py-2 bg-white rounded-t-2xl">
              <span className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            <div className="px-2 pb-6 pt-2">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 mb-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{user?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
