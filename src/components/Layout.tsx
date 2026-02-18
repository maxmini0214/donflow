import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: '📊', label: '대시보드' },
  { to: '/structure', icon: '🏗️', label: '구조 설계' },
  { to: '/data', icon: '📥', label: '데이터 입력' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          💸 돈플로우
        </h1>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom Nav — 3 tabs */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex justify-around max-w-4xl mx-auto">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center py-2 px-3 text-xs gap-1 transition-colors flex-1',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
