import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useMonthlyStats,
  useCategoryStats,
  useCategories,
  useBudgetComparison,
  useChangeAlerts,
  useInsights,
  useMonthlySalary,
} from '@/hooks/useDB'
import { formatKRW, formatNumber, getMonthKey } from '@/lib/utils'
import { generateInsights } from '@/services/changeDetection'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthKey = getMonthKey(targetDate)
  const monthLabel = `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`

  const { income, expense, transactions } = useMonthlyStats(monthKey)
  const categoryStats = useCategoryStats(monthKey)
  const categories = useCategories()
  const budgetComparison = useBudgetComparison(monthKey)
  const alerts = useChangeAlerts(false)
  const insights = useInsights(monthKey)
  const salary = useMonthlySalary()
  const navigate = useNavigate()

  // Generate insights on month change
  useEffect(() => {
    generateInsights(monthKey).catch(() => {})
  }, [monthKey])

  const recentTransactions = transactions.slice(0, 5)
  const totalBudget = budgetComparison.reduce((s, b) => s + b.planned, 0)
  const hasBudgets = budgetComparison.length > 0

  // Projection: if we're mid-month, project end-of-month spending
  const dayOfMonth = new Date().getDate()
  const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate()
  const projectedExpense = dayOfMonth > 0 && monthOffset === 0
    ? Math.round(expense / dayOfMonth * daysInMonth)
    : expense

  const visibleCategories = showAllCategories ? categoryStats : categoryStats.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m - 1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground">{monthLabel}</span>
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Hero: Monthly Expense with budget progress */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-1">이번 달 지출</p>
        <p className="text-4xl font-extrabold tracking-tight text-expense">
          {formatKRW(expense)}
        </p>
        {hasBudgets && (
          <div className="mt-3 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>계획 ₩{formatNumber(totalBudget)}</span>
              <span>{totalBudget > 0 ? Math.round(expense / totalBudget * 100) : 0}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  expense > totalBudget ? 'bg-destructive' : expense > totalBudget * 0.8 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(totalBudget > 0 ? (expense / totalBudget * 100) : 0, 110)}%` }}
              />
            </div>
            {monthOffset === 0 && projectedExpense > totalBudget && (
              <p className="text-xs text-amber-500 mt-1">
                ⚡ 이 속도면 월말 ₩{formatNumber(projectedExpense)} 예상 (₩{formatNumber(projectedExpense - totalBudget)} 초과)
              </p>
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          수입 <span className="text-income font-medium">{formatKRW(income)}</span>
        </p>
      </div>

      {/* Budget Alert Banners */}
      {hasBudgets && budgetComparison.filter(b => b.percentage >= 100).length > 0 && (
        <div className="space-y-2">
          {budgetComparison.filter(b => b.percentage >= 100).map(item => (
            <div key={item.categoryId} className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm font-medium">⚠️ {item.categoryIcon} {item.categoryName} 예산 초과! ₩{formatNumber(item.diff)} 오버</p>
            </div>
          ))}
        </div>
      )}
      {hasBudgets && budgetComparison.filter(b => b.percentage >= 80 && b.percentage < 100).length > 0 && (
        <div className="space-y-2">
          {budgetComparison.filter(b => b.percentage >= 80 && b.percentage < 100).map(item => (
            <div key={item.categoryId} className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-sm font-medium">🟡 {item.categoryIcon} {item.categoryName} 예산 {item.percentage}% 소진 — 주의!</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary line */}
      {hasBudgets && monthOffset === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          이번 달 예산 대비 <span className="font-medium text-foreground">{totalBudget > 0 ? Math.round(expense / totalBudget * 100) : 0}%</span> 사용, {daysInMonth - dayOfMonth}일 남음
        </div>
      )}

      {/* Change Alerts Banner */}
      {alerts.length > 0 && (
        <button
          onClick={() => navigate('/structure')}
          className="w-full rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-left transition-colors hover:bg-amber-500/15"
        >
          <p className="text-sm font-medium">⚠️ 변동 {alerts.length}건</p>
          <p className="text-xs text-muted-foreground mt-0.5">{alerts[0].title} — 터치해서 확인</p>
        </button>
      )}

      {/* Budget Comparison */}
      {hasBudgets && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">카테고리별 (계획 대비)</p>
          <div className="space-y-2.5">
            {budgetComparison.slice(0, 6).map((item) => {
              const isOver = item.actual > item.planned
              const pct = Math.min(item.percentage, 120)
              return (
                <div key={item.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.categoryIcon} {item.categoryName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">
                        {formatNumber(item.actual)}
                        <span className="text-muted-foreground font-normal">/{formatNumber(item.planned)}</span>
                      </span>
                      {isOver && <span className="text-xs text-destructive">초과!</span>}
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-destructive' : item.percentage > 80 ? 'bg-amber-500' : 'bg-primary/70'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                    {isOver && (
                      <div
                        className="absolute top-0 h-full bg-destructive/30 rounded-r-full"
                        style={{ left: `${Math.min(100, Math.round(item.planned / item.actual * 100))}%`, width: `${Math.min(pct - Math.round(item.planned / item.actual * 100), 20)}%` }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category Bars (when no budgets) */}
      {!hasBudgets && categoryStats.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">카테고리별</p>
          <div className="space-y-2.5">
            {visibleCategories.map((cat) => {
              const maxVal = categoryStats[0]?.value || 1
              const pct = Math.round((cat.value / maxVal) * 100)
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{cat.icon} {cat.name}</span>
                    <span className="font-medium">{formatNumber(cat.value)}원</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {categoryStats.length > 5 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto transition-colors"
            >
              {showAllCategories ? (
                <><ChevronUp className="w-3.5 h-3.5" /> 접기</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> 더보기 ({categoryStats.length - 5}개)</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">💡 인사이트</p>
          {insights.slice(0, 3).map(insight => (
            <div key={insight.id} className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-sm">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">최근 거래</p>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="text-3xl">📝</div>
            <p className="text-sm text-muted-foreground">아직 거래가 없어요</p>
            <p className="text-xs text-muted-foreground">+ 버튼으로 첫 거래를 기록해보세요</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {recentTransactions.map((tx) => {
                const cat = categories.find(c => c.id === tx.categoryId)
                const dateStr = new Date(tx.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                const isToday = new Date(tx.date).toDateString() === new Date().toDateString()
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat?.icon ?? '📌'}</span>
                      <div>
                        <p className="text-sm font-medium">{tx.merchantName || cat?.name || '거래'}</p>
                        <p className="text-xs text-muted-foreground">{isToday ? '오늘' : dateStr}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}원
                    </span>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" /> 더보기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
