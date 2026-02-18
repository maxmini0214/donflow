import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Wallet, BarChart3, Target, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/structure', icon: Wallet, label: '구조' },
  { to: '/budget', icon: Target, label: '예산' },
  { to: '/transactions', icon: BarChart3, label: '내역' },
]

export default function Layout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          💸 돈플로우
        </h1>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom Nav — 3 tabs */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex justify-around max-w-4xl mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center py-2 px-3 text-xs gap-1 transition-colors flex-1',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
