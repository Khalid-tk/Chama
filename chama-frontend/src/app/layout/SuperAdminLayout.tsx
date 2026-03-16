import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, FileText, Menu, Shield, PanelLeftClose, Home } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { AvatarDropdown } from '../../components/layout/AvatarDropdown'

const superNavItems = [
  { to: '/super/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super/chamas', icon: Building2, label: 'Chamas' },
  { to: '/super/users', icon: Users, label: 'Users' },
  { to: '/super/audit', icon: FileText, label: 'Audit Log' },
]

export function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const openNav = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
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
        className={`hidden md:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-ink-300 bg-warm-card transition-all duration-200 ${
          sidebarOpen ? 'w-56' : 'w-20'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-300 px-4">
          <NavLink to="/super/dashboard" className="flex items-center gap-2 min-w-0">
            <Shield className="h-8 w-8 shrink-0 text-blue-600" />
            {sidebarOpen && <span className="font-semibold text-ink-900 truncate">Platform Admin</span>}
          </NavLink>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded p-1.5 text-ink-500 hover:bg-warm-deep"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {superNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-ink-700 hover:bg-warm-deep hover:text-ink-900'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
          <div className="border-t border-ink-300 my-2" />
          <button
            type="button"
            onClick={() => navigate('/select-chama')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-warm-deep hover:text-ink-900 transition-colors"
          >
            <Home className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Chama dashboard</span>}
          </button>
        </nav>
      </aside>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer} side="left">
        <div className="flex flex-col h-full bg-warm-card">
          <div className="flex h-16 items-center justify-between border-b border-ink-300 px-4">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="font-semibold text-ink-900">Platform Admin</span>
            </div>
            <button type="button" onClick={closeDrawer} className="rounded p-2 text-ink-500 hover:bg-warm-deep" aria-label="Close menu">
              <PanelLeftClose size={24} />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {superNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeDrawer}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                    isActive ? 'bg-blue-600 text-white' : 'text-ink-700 hover:bg-warm-deep'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className="border-t border-ink-300 my-2" />
            <button
              type="button"
              onClick={() => { closeDrawer(); navigate('/select-chama'); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-700 hover:bg-warm-deep min-h-[44px]"
            >
              <Home className="h-5 w-5 shrink-0" />
              <span>Chama dashboard</span>
            </button>
          </nav>
        </div>
      </Drawer>

      <div className={`flex flex-1 flex-col min-w-0 transition-all duration-200 ${sidebarOpen ? 'md:pl-56' : 'md:pl-20'}`}>
        <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center justify-between gap-2 border-b border-ink-300 bg-warm-card px-3 shadow-sm sm:px-6 min-w-0 overflow-hidden">
          <Button variant="ghost" size="sm" onClick={openNav} className="md:hidden shrink-0 h-10 w-10 p-0" aria-label="Open menu">
            <Menu size={22} />
          </Button>
          <div className="hidden md:block md:min-w-0 md:flex-1" aria-hidden />
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0 overflow-hidden">
            <Button variant="secondary" size="sm" onClick={() => navigate('/select-chama')} className="gap-2 shrink-0 max-w-[180px] sm:max-w-none">
              <Home className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline truncate">Chama dashboard</span>
            </Button>
            <AvatarDropdown onLogout={() => navigate('/login')} />
          </div>
        </header>

        <main className="flex-1 overflow-auto overflow-x-hidden page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
