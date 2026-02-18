import { useEffect, Component, type ReactNode } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Structure from '@/pages/Structure'
import Transactions from '@/pages/Transactions'
import Accounts from '@/pages/Accounts'
import Budget from '@/pages/Budget'
import Settings from '@/pages/Settings'
import Onboarding from '@/components/Onboarding'
import QuickAdd from '@/components/QuickAdd'
import NotificationPaste from '@/components/NotificationPaste'
import { seedCategories } from '@/db'

class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return <pre style={{color:'red',padding:20}}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
    return this.props.children
  }
}

export default function App() {
  useEffect(() => {
    seedCategories()
  }, [])

  return (
    <ErrorBoundary>
      <HashRouter>
        <Onboarding />
        <QuickAdd />
        <NotificationPaste />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/structure" element={<Structure />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
