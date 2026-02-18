import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useMonthlyStats,
  useBudgetComparison,
  useMonthlySalary,
  useCategories,
} from '@/hooks/useDB'
import { formatKRW, formatNumber, getMonthKey } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [monthOffset, setMonthOffset] = useState(0)
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthKey = getMonthKey(targetDate)
  const monthLabel = `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`

  const { income, expense } = useMonthlyStats(monthKey)
  const budgetComparison = useBudgetComparison(monthKey)
  const salary = useMonthlySalary()
  const categories = useCategories()
  const navigate = useNavigate()

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

  // Group budget items by parent category concept
  // For now, show all budget categories with their progress
  const sortedBudgets = [...budgetComparison].sort((a, b) => b.planned - a.planned)

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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">수입</p>
          <p className="text-sm font-bold text-income mt-1">{formatKRW(income || salary)}</p>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">지출</p>
          <p className="text-sm font-bold text-expense mt-1">{formatKRW(expense)}</p>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">남은 예산</p>
          <p className={`text-sm font-bold mt-1 ${remainingBudget >= 0 ? 'text-income' : 'text-destructive'}`}>
            {hasBudgets ? formatKRW(remainingBudget) : '-'}
          </p>
        </div>
      </div>

      {/* Pace Projection Banner */}
      {hasBudgets && monthOffset === 0 && daysRemaining > 0 && (
        <div className={`rounded-xl p-3 border ${
          projectionDiff >= 0
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-destructive/10 border-destructive/20'
        }`}>
          <p className="text-sm">
            남은 <span className="font-bold">{daysRemaining}일</span>, 현재 페이스대로면{' '}
            {projectionDiff >= 0 ? (
              <span className="text-emerald-400 font-bold">₩{formatNumber(projectionDiff)} 여유</span>
            ) : (
              <span className="text-destructive font-bold">₩{formatNumber(Math.abs(projectionDiff))} 초과</span>
            )}
            {' '}예상
          </p>
        </div>
      )}

      {/* Budget Alert Banners */}
      {hasBudgets && budgetComparison.filter(b => b.percentage >= 100).length > 0 && (
        <div className="space-y-2">
          {budgetComparison.filter(b => b.percentage >= 100).map(item => (
            <div key={item.categoryId} className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm font-medium">🔴 {item.categoryIcon} {item.categoryName} 예산 초과! ₩{formatNumber(item.diff)} 오버</p>
            </div>
          ))}
        </div>
      )}
      {hasBudgets && budgetComparison.filter(b => b.percentage >= 80 && b.percentage < 100).length > 0 && (
        <div className="space-y-2">
          {budgetComparison.filter(b => b.percentage >= 80 && b.percentage < 100).map(item => (
            <div key={item.categoryId} className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-sm font-medium">🟡 {item.categoryIcon} {item.categoryName} {item.percentage}% — 주의!</p>
            </div>
          ))}
        </div>
      )}

      {/* Category Progress Bars — The Core */}
      {hasBudgets ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">카테고리별 계획 vs 실제</p>
          <div className="space-y-3">
            {sortedBudgets.map((item) => {
              const pct = item.percentage
              const isOver = pct >= 100
              const isWarning = pct >= 80 && pct < 100
              const statusIcon = isOver ? '🔴' : isWarning ? '⚠️' : pct >= 60 ? '' : '✅'
              const statusText = isOver ? '초과!' : isWarning ? '주의' : pct < 30 ? '여유' : ''

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
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
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
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">🏗️</div>
          <p className="text-sm text-muted-foreground">아직 예산 계획이 없어요</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/structure')}>
            구조 설계하러 가기 →
          </Button>
        </div>
      )}

      {/* Overall Progress */}
      {hasBudgets && (
        <div className="rounded-xl bg-secondary/30 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">전체 예산 소진율</span>
            <span className="font-bold">{totalBudget > 0 ? Math.round(expense / totalBudget * 100) : 0}%</span>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                expense > totalBudget ? 'bg-destructive' : expense > totalBudget * 0.8 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(totalBudget > 0 ? (expense / totalBudget * 100) : 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₩{formatNumber(expense)} 사용</span>
            <span>₩{formatNumber(totalBudget)} 계획</span>
          </div>
        </div>
      )}
    </div>
  )
}
