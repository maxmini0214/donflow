import { useEffect, Component, type ReactNode } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Structure from '@/pages/Structure'
import DataInput from '@/pages/DataInput'
import { seedCategories, db } from '@/db'
import { useLiveQuery } from 'dexie-react-hooks'

class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return <pre style={{color:'red',padding:20}}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
    return this.props.children
  }
}

function AppRoutes() {
  useEffect(() => { seedCategories() }, [])

  // Check if user has set up income → redirect to structure if not
  const salary = useLiveQuery(async () => {
    const s = await db.appSettings.where('key').equals('monthlySalary').first()
    return s ? Number(s.value) : 0
  })

  const hasSetup = salary != null && salary > 0

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={hasSetup ? <Dashboard /> : <Navigate to="/structure" replace />} />
        <Route path="/structure" element={<Structure />} />
        <Route path="/data" element={<DataInput />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ErrorBoundary>
  )
}
