import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard, Users, Wallet, CreditCard, TrendingUp, Smartphone,
  FileText, PieChart, Menu, X, Building2, ChevronDown, CheckCircle,
  FileCheck, Shield, ScrollText, ChevronLeft, Settings,
} from 'lucide-react'
import { BrandLogo } from '../../components/BrandLogo'
import { Drawer } from '../../components/ui/Drawer'
import { NotificationBell } from '../../components/notifications/NotificationBell'
import { QuickActionsFAB } from '../../components/layout/QuickActionsFAB'
import { AvatarDropdown } from '../../components/layout/AvatarDropdown'
import { useAuthStore } from '../../store/authStore'
import { useChamaStore } from '../../store/chamaStore'
import type { ChamaMembership } from '../../store/authStore'

const getNavItems = (chamaId: string) => [
  { to: `/admin/${chamaId}/dashboard`,     icon: LayoutDashboard, label: 'Dashboard' },
  { to: `/admin/${chamaId}/members`,       icon: Users,           label: 'Members' },
  { to: `/admin/${chamaId}/contributions`, icon: Wallet,          label: 'Contributions' },
  { to: `/admin/${chamaId}/loans`,         icon: CreditCard,      label: 'Loans' },
  { to: `/admin/${chamaId}/transactions`,  icon: TrendingUp,      label: 'Transactions' },
  { to: `/admin/${chamaId}/mpesa`,         icon: Smartphone,      label: 'M-Pesa' },
  { to: `/admin/${chamaId}/approvals`,     icon: CheckCircle,     label: 'Approvals' },
  { to: `/admin/${chamaId}/join-requests`, icon: FileCheck,       label: 'Join Requests' },
  { to: `/admin/${chamaId}/reports`,       icon: FileText,        label: 'Reports' },
  { to: `/admin/${chamaId}/analytics`,     icon: PieChart,        label: 'Analytics' },
  { to: `/admin/${chamaId}/audit-log`,     icon: ScrollText,      label: 'Audit Log' },
]

function NavItem({ to, icon: Icon, label, collapsed, onClick }: {
  to: string; icon: any; label: string; collapsed: boolean; onClick?: () => void
}) {
  return (
    <NavLink to={to} title={collapsed ? label : undefined} onClick={onClick}
      className={({ isActive }) => [
        'flex items-center gap-2.5 rounded-md text-sm transition-colors',
        collapsed ? 'justify-center px-2 py-2' : 'px-2.5 py-2',
        isActive
          ? 'bg-brown text-warm-card'
          : 'text-ink-300 hover:bg-white/[0.06] hover:text-warm-card',
      ].join(' ')}
    >
      <Icon size={16} strokeWidth={1.75} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [chamaSwitcher, setChamaSwitcher] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const navigate    = useNavigate()
  const { chamaId } = useParams<{ chamaId: string }>()
  const { user, logout, memberships } = useAuthStore()
  const { activeChama, setActiveChama, clearActiveChama } = useChamaStore()

  useEffect(() => {
    if (chamaId && activeChama?.chamaId !== chamaId) {
      const m = memberships.find((m) => m.chamaId === chamaId)
      if (m) setActiveChama({ chamaId: m.chamaId, chamaName: m.chama.name, chamaCode: m.chama.chamaCode, role: m.role, joinMode: m.chama.joinMode })
    }
  }, [chamaId, memberships, activeChama, setActiveChama])

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setChamaSwitcher(false) }
    if (chamaSwitcher) { document.addEventListener('click', fn); return () => document.removeEventListener('click', fn) }
  }, [chamaSwitcher])

  const handleLogout   = () => { logout(); clearActiveChama(); navigate('/login') }
  const switchChama    = (m: ChamaMembership) => {
    setActiveChama({ chamaId: m.chamaId, chamaName: m.chama.name, chamaCode: m.chama.chamaCode, role: m.role, joinMode: m.chama.joinMode })
    setChamaSwitcher(false)
    navigate(['ADMIN','TREASURER','CHAIR','AUDITOR'].includes(m.role) ? `/admin/${m.chamaId}/dashboard` : `/member/${m.chamaId}/dashboard`)
  }

  const navItems = chamaId ? getNavItems(chamaId) : []

  /* ── Sidebar content (shared between desktop + drawer) ─── */
  const SidebarContent = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const wide = sidebarOpen || inDrawer
    return (
      <div className="flex h-full flex-col bg-warm-sidebar">
        {/* Logo row */}
        <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
          {wide && <BrandLogo size="sm" showWordmark variant="light" />}
          <button
            onClick={inDrawer ? () => setDrawerOpen(false) : () => setSidebarOpen(o => !o)}
            className="ml-auto rounded-md p-1.5 text-ink-300 hover:bg-white/[0.07] hover:text-warm-card transition-colors">
            {inDrawer ? <X size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Chama tag */}
        {wide && activeChama && (
          <div className="mx-3 mt-3 mb-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-ink-300 mb-1">Active chama</p>
            <p className="text-sm font-medium text-warm-card truncate">{activeChama.chamaName}</p>
            <p className="text-xs text-ink-300 mt-0.5">{activeChama.role} · {activeChama.chamaCode}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} collapsed={!wide}
              onClick={inDrawer ? () => setDrawerOpen(false) : undefined} />
          ))}
        </nav>

        {/* Settings */}
        {wide && chamaId && (
          <div className="border-t border-white/[0.07] px-2 py-3">
            <NavLink to={`/admin/${chamaId}/settings`}
              onClick={inDrawer ? () => setDrawerOpen(false) : undefined}
              className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${isActive ? 'bg-brown text-warm-card' : 'text-ink-300 hover:bg-white/[0.06] hover:text-warm-card'}`}>
              <Settings size={15} strokeWidth={1.75} />
              <span>Settings</span>
            </NavLink>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-warm-bg">

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex md:flex-col shrink-0 sidebar-transition ${sidebarOpen ? 'w-[220px]' : 'w-[52px]'}`}
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {sidebarOpen ? <SidebarContent /> : (
          <div className="flex h-full flex-col bg-warm-sidebar">
            <div className="flex h-[56px] items-center justify-center border-b border-white/[0.07]">
              <button onClick={() => setSidebarOpen(true)} className="rounded-md p-2 text-ink-500 hover:bg-warm-card/[0.07] hover:text-ink-300 transition-colors">
                <Menu size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
              {navItems.map(({ to, icon, label }) => <NavItem key={to} to={to} icon={icon} label={label} collapsed />)}
            </nav>
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="left">
        <SidebarContent inDrawer />
      </Drawer>

      {/* Main column */}
      <div className="flex flex-1 min-w-0 flex-col">

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[56px] shrink-0 items-center justify-between gap-3 border-b border-ink-300 bg-warm-deep px-4 sm:px-5">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => window.innerWidth < 768 ? setDrawerOpen(true) : setSidebarOpen(o => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-warm-deep transition-colors md:hidden">
              <Menu size={17} />
            </button>

            {activeChama && (
              <div className="relative min-w-0" ref={switcherRef}>
                <button onClick={() => setChamaSwitcher(s => !s)}
                  className="flex max-w-[220px] items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-ink-700 hover:bg-warm-deep transition-colors">
                  <Building2 size={14} className="shrink-0 text-ink-400" />
                  <span className="truncate">{activeChama.chamaName}</span>
                  <ChevronDown size={13} className={`shrink-0 text-ink-400 transition-transform ${chamaSwitcher ? 'rotate-180' : ''}`} />
                </button>

                {chamaSwitcher && (
                  <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-ink-300 bg-warm-card py-1 z-50"
                    style={{ boxShadow: 'var(--shadow-md)' }}>
                    <p className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Switch chama</p>
                    {memberships.map((m) => (
                      <button key={m.chamaId} onClick={() => switchChama(m)}
                        className={`flex w-full flex-col px-3.5 py-2.5 text-left text-sm transition-colors ${m.chamaId === activeChama.chamaId ? 'bg-brown-light text-brown-dark' : 'text-ink-700 hover:bg-warm-bg'}`}>
                        <span className="font-medium">{m.chama.name}</span>
                        <span className="text-xs text-ink-400">{m.role} · {m.chama.chamaCode}</span>
                      </button>
                    ))}
                    <div className="border-t border-ink-200 pt-1 px-1.5 pb-1">
                      <button onClick={() => { setChamaSwitcher(false); navigate('/select-chama') }}
                        className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-brown hover:bg-brown-light transition-colors">
                        + Create or join chama
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-1">
            {user?.globalRole === 'SUPER_ADMIN' && (
              <button onClick={() => navigate('/super')}
                className="hidden sm:flex items-center gap-1.5 rounded-md border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-warm-bg transition-colors">
                <Shield size={13} />
                Admin
              </button>
            )}
            <NotificationBell />
            <AvatarDropdown onLogout={handleLogout} chamaSettingsTo={chamaId ? `/admin/${chamaId}/settings` : null} chamaSettingsLabel="Chama settings" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto overflow-x-hidden page-container page-enter">
          <Outlet />
        </main>
      </div>

      <QuickActionsFAB />
    </div>
  )
}
