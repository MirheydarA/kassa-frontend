import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Wallet, HandCoins, Landmark, ArrowLeftRight, Receipt, Users, LogOut, Menu, X, KeyRound } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import ChangePasswordModal from './ChangePasswordModal'

const NAV = [
  { to: '/', label: 'Kassa', icon: Wallet, end: true },
  { to: '/loans', label: 'Borc ver', icon: HandCoins },
  { to: '/mydebts', label: 'Mənim borclarım', icon: Landmark },
  { to: '/exchange', label: 'Exchange', icon: ArrowLeftRight },
  { to: '/expenses', label: 'Xərclər', icon: Receipt },
  { to: '/clients', label: 'Müştərilər', icon: Users }
]

function SidebarContent({ onNavigate, onChangePassword }) {
  const { username, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <>
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand text-white font-semibold">K</div>
          <span className="text-lg font-semibold text-ink">Kassa</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-light text-brand' : 'text-ink hover:bg-paper'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border px-3 py-4">
        <div className="mb-2 px-3 text-sm text-muted">{username}</div>
        <button
          className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
          onClick={() => {
            onChangePassword()
            onNavigate?.()
          }}
        >
          <KeyRound size={18} />
          Şifrəni dəyiş
        </button>
        <button
          className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-danger hover:bg-danger-light"
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          <LogOut size={18} />
          Çıxış
        </button>
      </div>
    </>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <SidebarContent onChangePassword={() => setChangePasswordOpen(true)} />
      </aside>

      {/* Mobile topbar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand text-white font-semibold">K</div>
          <span className="text-lg font-semibold text-ink">Kassa</span>
        </div>
        <button
          className="rounded p-2 text-ink hover:bg-paper"
          onClick={() => setMobileOpen(true)}
          aria-label="Menyunu aç"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-surface shadow-lg">
            <button
              className="absolute right-3 top-4 rounded p-1 text-muted hover:text-ink"
              onClick={() => setMobileOpen(false)}
              aria-label="Menyunu bağla"
            >
              <X size={20} />
            </button>
            <SidebarContent
              onNavigate={() => setMobileOpen(false)}
              onChangePassword={() => setChangePasswordOpen(true)}
            />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-8xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </div>
      </main>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  )
}
