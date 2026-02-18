import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Copy, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/db'
import {
  useCategories,
  useBudgets,
  useMonthlyIncome,
  useBudgetComparison,
  useCategoryStats,
} from '@/hooks/useDB'
import { formatNumber, getMonthKey } from '@/lib/utils'

export default function Budget() {
  const [monthOffset, setMonthOffset] = useState(0)
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthKey = getMonthKey(targetDate)
  const monthLabel = `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`

  const categories = useCategories()
  const budgets = useBudgets(monthKey)
  const monthlyIncome = useMonthlyIncome(monthKey)
  const budgetComparison = useBudgetComparison(monthKey)
  const expenseCategories = categories.filter(c => !c.isIncome)

  // Previous month for comparison
  const prevDate = new Date(now.getFullYear(), now.getMonth() + monthOffset - 1, 1)
  const prevMonthKey = getMonthKey(prevDate)
  const prevCategoryStats = useCategoryStats(prevMonthKey)

  const [incomeInput, setIncomeInput] = useState<string | null>(null)
  const [editingBudgets, setEditingBudgets] = useState<Map<number, string>>(new Map())
  const [whatIfId, setWhatIfId] = useState<number | null>(null)
  const [whatIfValue, setWhatIfValue] = useState('')

  const budgetMap = useMemo(() => {
    const m = new Map<number, number>()
    budgets.forEach(b => m.set(b.categoryId, b.amount))
    return m
  }, [budgets])

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const incomeAmount = monthlyIncome ?? 0
  const remaining = incomeAmount - totalBudget

  // What-if simulation
  const whatIfTotal = useMemo(() => {
    if (whatIfId == null) return totalBudget
    const val = parseInt(whatIfValue) || 0
    const current = budgetMap.get(whatIfId) ?? 0
    return totalBudget - current + val
  }, [whatIfId, whatIfValue, totalBudget, budgetMap])

  const saveIncome = async () => {
    const val = parseInt(incomeInput ?? '0')
    if (val <= 0) return
    const existing = await db.monthlyIncomes.where('yearMonth').equals(monthKey).first()
    if (existing) {
      await db.monthlyIncomes.update(existing.id!, { amount: val })
    } else {
      await db.monthlyIncomes.add({ yearMonth: monthKey, amount: val })
    }
    setIncomeInput(null)
  }

  const saveBudget = async (categoryId: number, value: string) => {
    const amount = parseInt(value) || 0
    const existing = await db.budgets
      .where('[categoryId+month]')
      .equals([categoryId, monthKey])
      .first()
    if (existing) {
      if (amount === 0) {
        await db.budgets.delete(existing.id!)
      } else {
        await db.budgets.update(existing.id!, { amount })
      }
    } else if (amount > 0) {
      await db.budgets.add({ categoryId, amount, month: monthKey })
    }
    setEditingBudgets(prev => { const n = new Map(prev); n.delete(categoryId); return n })
  }

  const copyFromPrevMonth = async () => {
    const prevBudgets = await db.budgets.where('month').equals(prevMonthKey).toArray()
    if (prevBudgets.length === 0) return
    for (const pb of prevBudgets) {
      const existing = await db.budgets
        .where('[categoryId+month]')
        .equals([pb.categoryId, monthKey])
        .first()
      if (!existing) {
        await db.budgets.add({ categoryId: pb.categoryId, amount: pb.amount, month: monthKey })
      }
    }
    // Also copy income
    const prevIncome = await db.monthlyIncomes.where('yearMonth').equals(prevMonthKey).first()
    if (prevIncome) {
      const existing = await db.monthlyIncomes.where('yearMonth').equals(monthKey).first()
      if (!existing) {
        await db.monthlyIncomes.add({ yearMonth: monthKey, amount: prevIncome.amount })
      }
    }
  }

  const resetBudgets = async () => {
    const ids = budgets.map(b => b.id!).filter(Boolean)
    await db.budgets.bulkDelete(ids)
  }

  // Trend: compare with previous month actual spending
  const prevSpendMap = useMemo(() => {
    const m = new Map<string, number>()
    prevCategoryStats.forEach(s => m.set(s.name, s.value))
    return m
  }, [prevCategoryStats])

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m - 1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground">{monthLabel} 예산</span>
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m + 1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Monthly Income */}
      <div className="text-center py-3">
        <p className="text-sm text-muted-foreground mb-1">이번 달 수입</p>
        {incomeInput !== null ? (
          <div className="flex items-center gap-2 justify-center">
            <Input
              type="number"
              value={incomeInput}
              onChange={e => setIncomeInput(e.target.value)}
              className="w-48 text-center text-lg font-bold"
              placeholder="0"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveIncome()}
            />
            <Button size="sm" onClick={saveIncome}>저장</Button>
            <Button size="sm" variant="ghost" onClick={() => setIncomeInput(null)}>취소</Button>
          </div>
        ) : (
          <button
            onClick={() => setIncomeInput(String(incomeAmount || ''))}
            className="text-3xl font-extrabold tracking-tight hover:text-primary transition-colors"
          >
            ₩{formatNumber(incomeAmount || 0)}
          </button>
        )}
      </div>

      {/* Budget Overview Bar */}
      {incomeAmount > 0 && totalBudget > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>예산 합계 ₩{formatNumber(totalBudget)}</span>
            <span className={remaining < 0 ? 'text-destructive font-semibold' : ''}>
              {remaining >= 0 ? `여유 ₩${formatNumber(remaining)}` : `₩${formatNumber(Math.abs(remaining))} 초과`}
            </span>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
            {budgetComparison.map(item => {
              const pct = incomeAmount > 0 ? (item.planned / incomeAmount) * 100 : 0
              return (
                <div
                  key={item.categoryId}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: item.categoryColor }}
                  title={`${item.categoryName}: ₩${formatNumber(item.planned)}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-center">
        <Button size="sm" variant="outline" onClick={copyFromPrevMonth} className="text-xs gap-1">
          <Copy className="w-3.5 h-3.5" /> 지난달 복사
        </Button>
        <Button size="sm" variant="outline" onClick={resetBudgets} className="text-xs gap-1">
          <RotateCcw className="w-3.5 h-3.5" /> 초기화
        </Button>
      </div>

      {/* Category Budget List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">── 카테고리별 예산 ──</p>
        {expenseCategories.map(cat => {
          const budgetAmount = budgetMap.get(cat.id!) ?? 0
          const isEditing = editingBudgets.has(cat.id!)
          const comparison = budgetComparison.find(b => b.categoryId === cat.id)
          const actual = comparison?.actual ?? 0
          const pct = budgetAmount > 0 ? Math.round((actual / budgetAmount) * 100) : 0
          const prevSpend = prevSpendMap.get(cat.name) ?? 0
          const trendPct = prevSpend > 0 ? Math.round(((actual - prevSpend) / prevSpend) * 100) : 0
          const isSimulating = whatIfId === cat.id

          return (
            <div key={cat.id} className="rounded-xl bg-secondary/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{cat.icon} {cat.name}</span>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editingBudgets.get(cat.id!) ?? ''}
                        onChange={e => setEditingBudgets(prev => new Map(prev).set(cat.id!, e.target.value))}
                        className="w-28 h-8 text-right text-sm"
                        placeholder="0"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && saveBudget(cat.id!, editingBudgets.get(cat.id!) ?? '0')}
                      />
                      <Button size="sm" className="h-8 text-xs" onClick={() => saveBudget(cat.id!, editingBudgets.get(cat.id!) ?? '0')}>
                        저장
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingBudgets(prev => new Map(prev).set(cat.id!, String(budgetAmount || '')))}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {budgetAmount > 0 ? `₩${formatNumber(budgetAmount)}` : '설정'}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar if budget is set */}
              {budgetAmount > 0 && (
                <>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 100 ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      ₩{formatNumber(actual)} / ₩{formatNumber(budgetAmount)}
                      <span className={`ml-1 font-medium ${pct > 100 ? 'text-destructive' : pct > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        ({pct}%)
                      </span>
                    </span>
                    {prevSpend > 0 && trendPct !== 0 && (
                      <span className={`flex items-center gap-0.5 ${trendPct > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                        {trendPct > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trendPct > 0 ? '+' : ''}{trendPct}%
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* What-if simulation */}
              {budgetAmount > 0 && (
                <div>
                  {isSimulating ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">만약</span>
                      <Input
                        type="number"
                        value={whatIfValue}
                        onChange={e => setWhatIfValue(e.target.value)}
                        className="w-24 h-7 text-xs text-right"
                        placeholder={String(budgetAmount)}
                      />
                      <span className="text-xs text-muted-foreground">이면?</span>
                      {parseInt(whatIfValue) > 0 && (
                        <span className={`text-xs font-medium ${(incomeAmount - whatIfTotal) < 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                          여유 ₩{formatNumber(incomeAmount - whatIfTotal)}
                        </span>
                      )}
                      <button onClick={() => { setWhatIfId(null); setWhatIfValue('') }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setWhatIfId(cat.id!); setWhatIfValue(String(budgetAmount)) }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      🔮 시뮬레이션
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Budget Alerts */}
      {budgetComparison.filter(b => b.percentage >= 80).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">── 이탈 경고 ──</p>
          {budgetComparison
            .filter(b => b.percentage >= 80)
            .map(item => (
              <div
                key={item.categoryId}
                className={`rounded-xl p-3 border ${
                  item.percentage >= 100
                    ? 'bg-destructive/10 border-destructive/20'
                    : 'bg-amber-500/10 border-amber-500/20'
                }`}
              >
                <p className="text-sm font-medium">
                  {item.percentage >= 100 ? '🔴' : '🟡'} {item.categoryIcon} {item.categoryName}
                  {item.percentage >= 100
                    ? ` 예산 초과! ₩${formatNumber(item.diff)} 오버`
                    : ` 예산 ${item.percentage}% 소진`
                  }
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
