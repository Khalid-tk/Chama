import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  TrendingUp,
  Smartphone,
  PieChart,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Building2,
  ChevronDown,
} from 'lucide-react'
import { BrandLogo } from '../../components/BrandLogo'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { NotificationBell } from '../../components/notifications/NotificationBell'
import { QuickActionsFAB } from '../../components/layout/QuickActionsFAB'
import { AvatarDropdown } from '../../components/layout/AvatarDropdown'
import { useAuthStore } from '../../store/authStore'
import { useChamaStore } from '../../store/chamaStore'
import api from '../../lib/api'
import type { ChamaMembership } from '../../store/authStore'

const getMemberNavItems = (chamaId: string) => [
  { to: `/member/${chamaId}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
  { to: `/member/${chamaId}/contributions`, icon: Wallet, label: 'Contributions' },
  { to: `/member/${chamaId}/loans`, icon: CreditCard, label: 'Loans' },
  { to: `/member/${chamaId}/transactions`, icon: TrendingUp, label: 'Transactions' },
  { to: `/member/${chamaId}/mpesa`, icon: Smartphone, label: 'Mpesa' },
  { to: `/member/${chamaId}/analytics`, icon: PieChart, label: 'Analytics' },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function MemberLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showChamaSwitcher, setShowChamaSwitcher] = useState(false)
  const navigate = useNavigate()
  const { chamaId } = useParams<{ chamaId: string }>()
  const { user, logout, memberships, refreshMemberships } = useAuthStore()
  const { activeChama, setActiveChama, clearActiveChama } = useChamaStore()

  useEffect(() => {
    if (chamaId && activeChama?.chamaId !== chamaId) {
      // Find membership for this chama
      const membership = memberships.find((m) => m.chamaId === chamaId)
      if (membership) {
        setActiveChama({
          chamaId: membership.chamaId,
          chamaName: membership.chama.name,
          chamaCode: membership.chama.chamaCode,
          role: membership.role,
          joinMode: membership.chama.joinMode,
        })
      }
    }
  }, [chamaId, memberships, activeChama, setActiveChama])

  const handleLogout = () => {
    logout()
    clearActiveChama()
    navigate('/login')
  }

  const handleSwitchChama = (membership: ChamaMembership) => {
    setActiveChama({
      chamaId: membership.chamaId,
      chamaName: membership.chama.name,
      chamaCode: membership.chama.chamaCode,
      role: membership.role,
      joinMode: membership.chama.joinMode,
    })
    setShowChamaSwitcher(false)

    // Navigate to appropriate dashboard
    if (['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'].includes(membership.role)) {
      navigate(`/admin/${membership.chamaId}/dashboard`)
    } else {
      navigate(`/member/${membership.chamaId}/dashboard`)
    }
  }

  const navItems = chamaId ? getMemberNavItems(chamaId) : []

  const openNav = () => {
    if (window.innerWidth < 768) {
      setDrawerOpen(true)
    } else {
      setSidebarOpen((o) => !o)
    }
  }
  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div className="flex min-h-screen bg-[#F6F7FB] overflow-x-hidden">
      {/* Desktop sidebar - hidden on mobile */}
      <aside
        className={`hidden md:flex md:flex-col bg-gradient-to-b from-blue-700 to-blue-800 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="flex min-h-[72px] items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          {sidebarOpen && <BrandLogo size="nav" showWordmark variant="light" />}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : null}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer} side="left">
        <div className="flex flex-col h-full">
          <div className="flex min-h-[72px] items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <BrandLogo size="nav" showWordmark variant="light" />
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <PanelLeftClose size={24} />
            </button>
          </div>
          {activeChama && (
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-blue-200">Chama</p>
              <p className="font-medium text-white">{activeChama.chamaName}</p>
            </div>
          )}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeDrawer}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={20} strokeWidth={2} />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </Drawer>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Header - sticky */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shrink-0">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={openNav}
                className="shrink-0 h-10 w-10 p-0 md:h-9 md:w-9"
                aria-label="Open menu"
              >
                <Menu size={22} className="md:w-5 md:h-5" />
              </Button>
              {activeChama && (
                <div className="relative">
                  <button
                    onClick={() => setShowChamaSwitcher(!showChamaSwitcher)}
                    className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 sm:px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Building2 size={18} className="shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">{activeChama.chamaName}</span>
                    <ChevronDown size={16} className="shrink-0" />
                  </button>
                  {showChamaSwitcher && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="p-2">
                        <div className="mb-2 px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                          Switch Chama
                        </div>
                        {memberships.map((membership) => (
                          <button
                            key={membership.chamaId}
                            onClick={() => handleSwitchChama(membership)}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              membership.chamaId === activeChama.chamaId
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="font-medium">{membership.chama.name}</div>
                            <div className="text-xs text-slate-500">
                              {membership.role} • {membership.chama.chamaCode}
                            </div>
                          </button>
                        ))}
                        <div className="mt-2 border-t border-slate-200 pt-2">
                          <button
                            onClick={() => {
                              setShowChamaSwitcher(false)
                              navigate('/select-chama')
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                          >
                            + Create or Join Chama
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <AvatarDropdown onLogout={handleLogout} chamaSettingsTo={chamaId ? `/member/${chamaId}/settings` : null} chamaSettingsLabel="Chama settings" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto overflow-x-hidden page-container">
          <Outlet />
        </main>
      </div>

      <QuickActionsFAB />
    </div>
  )
}
