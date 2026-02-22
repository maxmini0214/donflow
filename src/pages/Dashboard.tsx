import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useMonthlyStats,
  useBudgetComparison,
  useMonthlySalary,
  useCategories,
} from '@/hooks/useDB'
import { formatCurrency, formatNumber, getMonthKey } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useLanguage, getCurrency } from '@/lib/i18n'
import { loadDemoData, clearDemoData, isDemoLoaded } from '@/db/demoData'
import { exportJSON, exportCSV, importJSON } from '@/utils/exportData'

export default function Dashboard() {
  const { t } = useLanguage()
  const [monthOffset, setMonthOffset] = useState(0)
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthKey = getMonthKey(targetDate)
  const monthLabel = t('yearSuffix')
    ? `${targetDate.getFullYear()}${t('yearSuffix')} ${targetDate.getMonth() + 1}${t('monthSuffix')}`
    : `${targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`

  const { income, expense } = useMonthlyStats(monthKey)
  const budgetComparison = useBudgetComparison(monthKey)
  const salary = useMonthlySalary()
  const categories = useCategories()
  const navigate = useNavigate()

  const [isDemo, setIsDemo] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  // Auto-load demo data when ?demo is in the URL
  useEffect(() => {
    isDemoLoaded().then(async (loaded) => {
      setIsDemo(loaded)
      if (!loaded && window.location.search.includes('demo')) {
        setDemoLoading(true)
        try {
          await loadDemoData()
          setIsDemo(true)
        } finally {
          setDemoLoading(false)
          // Clean up URL without reload
          const url = new URL(window.location.href)
          url.searchParams.delete('demo')
          window.history.replaceState({}, '', url.toString())
        }
      }
    })
  }, [expense, income])

  const handleLoadDemo = useCallback(async () => {
    setDemoLoading(true)
    try {
      await loadDemoData()
      setIsDemo(true)
    } finally {
      setDemoLoading(false)
    }
  }, [])

  const handleClearDemo = useCallback(async () => {
    setDemoLoading(true)
    try {
      await clearDemoData()
      setIsDemo(false)
    } finally {
      setDemoLoading(false)
    }
  }, [])

  const totalBudget = budgetComparison.reduce((s, b) => s + b.planned, 0)
  const hasBudgets = budgetComparison.length > 0
  const remainingBudget = totalBudget - expense

  // Projection
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - dayOfMonth
  const projectedExpense = dayOfMonth > 0 && monthOffset === 0
    ? Math.round(expense / dayOfMonth * daysInMonth)
    : expense
  const projectionDiff = totalBudget - projectedExpense

  const sortedBudgets = [...budgetComparison].sort((a, b) => b.planned - a.planned)

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <nav className="flex items-center justify-between" aria-label="Month navigation">
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m - 1)} aria-label="Previous month">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground" aria-live="polite">{monthLabel}</span>
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0} aria-label="Next month">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </nav>

      {/* Demo Data Banner */}
      {isDemo && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2">
          <span className="text-xs text-muted-foreground">🎲 Demo mode — exploring sample data</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { handleClearDemo(); navigate('/structure'); }}>
              Use your own data →
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={handleClearDemo} disabled={demoLoading}>
              {t('clearDemoData')}
            </Button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="region" aria-label="Financial summary">
        <div className="rounded-xl bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('income')}</p>
          <p className="text-sm font-bold text-income mt-1">{formatCurrency(income || salary)}</p>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('expense')}</p>
          <p className="text-sm font-bold text-expense mt-1">{formatCurrency(expense)}</p>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('remainingBudget')}</p>
          <p className={`text-sm font-bold mt-1 ${remainingBudget >= 0 ? 'text-income' : 'text-destructive'}`}>
            {hasBudgets ? formatCurrency(remainingBudget) : '-'}
          </p>
        </div>
      </div>

      {/* Savings Rate */}
      {(income > 0 || salary > 0) && expense > 0 && (
        (() => {
          const effectiveIncome = income || salary
          const savingsRate = Math.round((effectiveIncome - expense) / effectiveIncome * 100)
          const isPositive = savingsRate > 0
          const ratingText = savingsRate >= 30 ? t('excellent') : savingsRate >= 15 ? t('good') : t('needsWork')
          const ratingColor = savingsRate >= 30 ? 'text-emerald-400' : savingsRate >= 15 ? 'text-amber-400' : 'text-destructive'
          const ratingEmoji = savingsRate >= 30 ? '🌟' : savingsRate >= 15 ? '👍' : '⚡'

          return (
            <div className="rounded-xl bg-secondary/30 p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('savingsRate')}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${isPositive ? 'text-emerald-400' : 'text-destructive'}`}>
                    {savingsRate}%
                  </span>
                  <span className={`text-xs ${ratingColor}`}>{ratingEmoji} {ratingText}</span>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    savingsRate >= 30 ? 'bg-emerald-500' : savingsRate >= 15 ? 'bg-amber-500' : 'bg-destructive'
                  }`}
                  style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('savingsRateDesc')} — {getCurrency()}{formatNumber(Math.max(effectiveIncome - expense, 0))} {t('surplus')}
              </p>
            </div>
          )
        })()
      )}

      {/* Pace Projection Banner */}
      {hasBudgets && monthOffset === 0 && daysRemaining > 0 && (
        <div className={`rounded-xl p-3 border ${
          projectionDiff >= 0
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-destructive/10 border-destructive/20'
        }`}>
          <p className="text-sm">
            {t('currentPace')} <span className="font-bold">{daysRemaining} {t('daysRemaining')}</span>{' '}
            {projectionDiff >= 0 ? (
              <span className="text-emerald-400 font-bold">{getCurrency()}{formatNumber(projectionDiff)} {t('surplus')}</span>
            ) : (
              <span className="text-destructive font-bold">{getCurrency()}{formatNumber(Math.abs(projectionDiff))} {t('overBudget')}</span>
            )}
            {' '}{t('forecast')}
          </p>
        </div>
      )}

      {/* Daily Spending Rate */}
      {hasBudgets && monthOffset === 0 && dayOfMonth > 0 && expense > 0 && (
        (() => {
          const dailyAvg = Math.round(expense / dayOfMonth)
          const dailyBudget = Math.round(totalBudget / daysInMonth)
          const isOverDaily = dailyAvg > dailyBudget
          return (
            <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('dailyAvgSpending')}</span>
                <span className={`font-bold ${isOverDaily ? 'text-destructive' : 'text-emerald-400'}`}>
                  {getCurrency()}{formatNumber(dailyAvg)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t('dailyBudget')}</span>
                <span className="font-medium">{getCurrency()}{formatNumber(dailyBudget)}</span>
              </div>
            </div>
          )
        })()
      )}

      {/* Budget Alert Banners */}
      {hasBudgets && budgetComparison.filter(b => b.percentage >= 100).length > 0 && (
        <div className="space-y-2">
          {budgetComparison.filter(b => b.percentage >= 100).map(item => (
            <div key={item.categoryId} className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm font-medium">🔴 {item.categoryIcon} {item.categoryName} {t('budgetExceeded')} {getCurrency()}{formatNumber(item.diff)} {t('over')}</p>
            </div>
          ))}
        </div>
      )}
      {hasBudgets && budgetComparison.filter(b => b.percentage >= 80 && b.percentage < 100).length > 0 && (
        <div className="space-y-2">
          {budgetComparison.filter(b => b.percentage >= 80 && b.percentage < 100).map(item => (
            <div key={item.categoryId} className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-sm font-medium">🟡 {item.categoryIcon} {item.categoryName} {item.percentage}% — {t('caution')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category Progress Bars — The Core */}
      {hasBudgets ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{t('categoryPlanVsActual')}</p>
          <div className="space-y-3">
            {sortedBudgets.map((item) => {
              const pct = item.percentage
              const isOver = pct >= 100
              const isWarning = pct >= 80 && pct < 100
              const statusIcon = isOver ? '🔴' : isWarning ? '⚠️' : pct >= 60 ? '' : '✅'
              const statusText = isOver ? t('exceeded') : isWarning ? t('caution') : pct < 30 ? t('comfortable') : ''

              return (
                <div key={item.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.categoryIcon} {item.categoryName}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {formatNumber(item.actual)}/{formatNumber(item.planned)}
                      </span>
                      <span className={`font-bold ${
                        isOver ? 'text-destructive' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {pct}%
                      </span>
                      {statusIcon && <span>{statusIcon}</span>}
                    </div>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.min(pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.categoryName} budget usage`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 space-y-6">
          <div className="text-6xl">📊</div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{t('welcomeTitle') || 'Welcome to DonFlow'}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('welcomeDesc') || 'Plan your budget, track spending, and see exactly where your money goes. 100% private — your data never leaves this browser.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {['🔒 No Server', '🚫 No AI', '👁️ No Tracking', '💯 Open Source'].map((badge) => (
                <span key={badge} className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground border border-border/40">
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            {!isDemo && (
              <Button size="lg" className="text-base px-8" onClick={handleLoadDemo} disabled={demoLoading}>
                🎲 {t('tryDemoData') || 'Try with Demo Data'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate('/structure')}>
              {t('startFromScratch') || 'Start from scratch →'}
            </Button>
          </div>
        </div>
      )}

      {/* Overall Progress */}
      {hasBudgets && (
        <div className="rounded-xl bg-secondary/30 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('overallBurnRate')}</span>
            <span className="font-bold">{totalBudget > 0 ? Math.round(expense / totalBudget * 100) : 0}%</span>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={totalBudget > 0 ? Math.round(expense / totalBudget * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Overall budget burn rate">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                expense > totalBudget ? 'bg-destructive' : expense > totalBudget * 0.8 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(totalBudget > 0 ? (expense / totalBudget * 100) : 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{getCurrency()}{formatNumber(expense)} {t('used')}</span>
            <span>{getCurrency()}{formatNumber(totalBudget)} {t('planned')}</span>
          </div>
        </div>
      )}

      {/* Export / Import Data */}
      <div className="rounded-xl bg-secondary/30 p-4 space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{t('exportData')}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={exportJSON}>
            {t('exportJsonBackup')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={exportCSV}>
            {t('exportCsv')}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              if (!confirm(t('importConfirm'))) return
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.json'
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return
                const result = await importJSON(file)
                if (result.success) {
                  const total = Object.values(result.tables).reduce((a, b) => a + b, 0)
                  alert(`${t('importSuccess')} ${total} ${t('tablesRestored')}`)
                  window.location.reload()
                } else {
                  alert(`${t('importFailed')}: ${result.error}`)
                }
              }
              input.click()
            }}
          >
            {t('importJsonBackup')}
          </Button>
        </div>
      </div>

      {/* Support CTA */}
      <div className="rounded-xl p-4 text-center space-y-2" style={{background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.05))', border: '1px solid rgba(251,191,36,0.2)'}}>
        <p className="text-sm font-semibold">☕ Like this tool? Support the project!</p>
        <p className="text-xs text-muted-foreground">Every coffee keeps free tools alive. No account needed.</p>
        <a
          href="https://paypal.me/maxseats"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{background: '#0070ba'}}
        >
          ☕ Buy Me a Coffee via PayPal
        </a>
      </div>
    </div>
  )
}
