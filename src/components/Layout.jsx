import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Wallet, HandCoins, Landmark, ArrowLeftRight, Receipt, Users, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const NAV = [
  { to: '/', label: 'Kassa', icon: Wallet, end: true },
  { to: '/loans', label: 'Borc ver', icon: HandCoins },
  { to: '/mydebts', label: 'Mənim borclarım', icon: Landmark },
  { to: '/exchange', label: 'Exchange', icon: ArrowLeftRight },
  { to: '/expenses', label: 'Xərclər', icon: Receipt },
  { to: '/clients', label: 'Müştərilər', icon: Users }
]

export default function Layout() {
  const { username, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
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
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-8xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
