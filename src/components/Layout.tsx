import { useState, useCallback } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'

export default function Layout() {
  const { lang, setLang, t } = useLanguage()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const toggleShortcuts = useCallback(() => setShowShortcuts(v => !v), [])
  useKeyboardShortcuts(toggleShortcuts)

  const navItems = [
    { to: '/', icon: '📊', label: t('navDashboard') },
    { to: '/structure', icon: '🏗️', label: t('navStructure') },
    { to: '/data', icon: '📥', label: t('navData') },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <KeyboardShortcutsHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          {t('headerTitle')}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary/50"
            title="Switch language"
          >
            {lang === 'ko' ? '🌐 EN' : '🌐 한국어'}
          </button>
          <button
            onClick={toggleShortcuts}
            className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary/50"
            title="Keyboard shortcuts"
          >
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary/50 text-[10px] font-mono">?</kbd>
            <span>shortcuts</span>
          </button>
        </div>
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
