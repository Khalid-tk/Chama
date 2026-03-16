import { Outlet, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../../components/BrandLogo'
import { AvatarDropdown } from '../../components/layout/AvatarDropdown'

export function AccountLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <header className="sticky top-0 z-20 border-b border-ink-300 bg-warm-card">
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/select-chama')}
            className="flex items-center gap-2 min-w-0"
          >
            <BrandLogo size="md" showWordmark variant="dark" />
          </button>
          <AvatarDropdown />
        </div>
      </header>
      <main className="p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
