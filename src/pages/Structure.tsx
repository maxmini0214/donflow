import { useState, useMemo } from 'react'
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/db'
import {
  useMonthlySalary,
  useCategories,
  useBudgets,
} from '@/hooks/useDB'
import { formatNumber, getMonthKey } from '@/lib/utils'

// Pre-defined big category groups
const CATEGORY_GROUPS: Record<string, string[]> = {
  '고정비': ['주거', '통신', '보험', '구독', '교통'],
  '생활비': ['식비', '카페', '의료', '교육'],
  '저축/투자': ['저축'],
  '자유지출': ['쇼핑', '데이트', '경조사', '여행', '기타'],
}

export default function Structure() {
  const salary = useMonthlySalary()
  const categories = useCategories()
  const monthKey = getMonthKey(new Date())
  const budgets = useBudgets(monthKey)

  const [editingSalary, setEditingSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState('')
  const [editingBudget, setEditingBudget] = useState<number | null>(null)
  const [budgetInput, setBudgetInput] = useState('')

  const budgetMap = useMemo(() => {
    const m = new Map<number, number>()
    budgets.forEach(b => m.set(b.categoryId, b.amount))
    return m
  }, [budgets])

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const remaining = salary - totalBudget

  const saveSalary = async () => {
    const val = parseInt(salaryInput)
    if (!val || val <= 0) return
    const existing = await db.appSettings.where('key').equals('monthlySalary').first()
    if (existing) {
      await db.appSettings.update(existing.id!, { value: String(val) })
    } else {
      await db.appSettings.add({ key: 'monthlySalary', value: String(val) })
    }
    setEditingSalary(false)
  }

  const saveBudget = async (categoryId: number) => {
    const amount = parseInt(budgetInput) || 0
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
    setEditingBudget(null)
    setBudgetInput('')
  }

  // Group categories into big groups
  const expenseCategories = categories.filter(c => !c.isIncome)
  const groupedView = Object.entries(CATEGORY_GROUPS).map(([groupName, catNames]) => {
    const cats = catNames
      .map(name => expenseCategories.find(c => c.name === name))
      .filter(Boolean) as typeof expenseCategories
    const groupTotal = cats.reduce((s, c) => s + (budgetMap.get(c.id!) ?? 0), 0)
    const groupPct = salary > 0 ? Math.round((groupTotal / salary) * 100) : 0
    return { groupName, cats, groupTotal, groupPct }
  })

  // What-if: auto-calculate remaining when editing
  const whatIfRemaining = useMemo(() => {
    if (editingBudget == null) return remaining
    const editVal = parseInt(budgetInput) || 0
    const currentVal = budgetMap.get(editingBudget) ?? 0
    return remaining + currentVal - editVal
  }, [editingBudget, budgetInput, remaining, budgetMap])

  return (
    <div className="space-y-6">
      {/* Monthly Income */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-1">월 수입</p>
        {editingSalary ? (
          <div className="flex items-center gap-2 justify-center">
            <Input
              type="number"
              value={salaryInput}
              onChange={e => setSalaryInput(e.target.value)}
              className="w-48 text-center text-lg font-bold"
              placeholder="0"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveSalary()}
            />
            <Button size="icon" variant="ghost" onClick={saveSalary}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setEditingSalary(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => { setSalaryInput(String(salary || '')); setEditingSalary(true) }}
            className="text-3xl font-extrabold tracking-tight hover:text-primary transition-colors"
          >
            {salary > 0 ? `₩${formatNumber(salary)}` : '수입을 설정하세요'}
            <Pencil className="w-4 h-4 inline ml-2 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Overall allocation bar */}
      {salary > 0 && totalBudget > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>배분 합계 ₩{formatNumber(totalBudget)} ({Math.round(totalBudget / salary * 100)}%)</span>
            <span className={remaining < 0 ? 'text-destructive font-semibold' : ''}>
              {remaining >= 0 ? `미배분 ₩${formatNumber(remaining)}` : `₩${formatNumber(Math.abs(remaining))} 초과!`}
            </span>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
            {groupedView.map(g => {
              const pct = salary > 0 ? (g.groupTotal / salary) * 100 : 0
              const colors: Record<string, string> = {
                '고정비': '#6366f1',
                '생활비': '#f59e0b',
                '저축/투자': '#10b981',
                '자유지출': '#ec4899',
              }
              return pct > 0 ? (
                <div
                  key={g.groupName}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: colors[g.groupName] ?? '#6b7280' }}
                  title={`${g.groupName}: ₩${formatNumber(g.groupTotal)}`}
                />
              ) : null
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {groupedView.filter(g => g.groupTotal > 0).map(g => {
              const colors: Record<string, string> = {
                '고정비': '#6366f1',
                '생활비': '#f59e0b',
                '저축/투자': '#10b981',
                '자유지출': '#ec4899',
              }
              return (
                <span key={g.groupName} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[g.groupName] }} />
                  {g.groupName} {g.groupPct}%
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* What-if indicator when editing */}
      {editingBudget != null && (
        <div className={`rounded-xl p-3 border text-sm ${
          whatIfRemaining >= 0
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          🔮 이렇게 바꾸면 미배분: ₩{formatNumber(whatIfRemaining)}
        </div>
      )}

      {/* Category Groups */}
      {salary > 0 && groupedView.map(({ groupName, cats, groupTotal, groupPct }) => (
        <section key={groupName} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              ── {groupName} ──
              {groupTotal > 0 && (
                <span className="ml-2 text-foreground">₩{formatNumber(groupTotal)} ({groupPct}%)</span>
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            {cats.map(cat => {
              const budgetAmount = budgetMap.get(cat.id!) ?? 0
              const isEditing = editingBudget === cat.id
              const pct = salary > 0 && budgetAmount > 0 ? Math.round((budgetAmount / salary) * 100) : 0

              return (
                <div key={cat.id} className="rounded-lg bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{cat.icon} {cat.name}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={budgetInput}
                          onChange={e => setBudgetInput(e.target.value)}
                          className="w-28 h-8 text-right text-sm"
                          placeholder="0"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveBudget(cat.id!)
                            if (e.key === 'Escape') { setEditingBudget(null); setBudgetInput('') }
                          }}
                        />
                        <Button size="sm" className="h-8 text-xs" onClick={() => saveBudget(cat.id!)}>
                          저장
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditingBudget(null); setBudgetInput('') }}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingBudget(cat.id!); setBudgetInput(String(budgetAmount || '')) }}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {budgetAmount > 0 ? (
                          <>₩{formatNumber(budgetAmount)} <span className="text-xs text-muted-foreground">{pct}%</span></>
                        ) : (
                          <span className="text-muted-foreground">설정</span>
                        )}
                      </button>
                    )}
                  </div>
                  {budgetAmount > 0 && !isEditing && (
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-300"
                        style={{ width: `${Math.min(pct * 2, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {salary === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">💰</div>
          <p className="text-muted-foreground">먼저 월 수입을 설정해주세요</p>
          <p className="text-xs text-muted-foreground">위의 수입 금액을 터치하면 편집할 수 있어요</p>
        </div>
      )}
    </div>
  )
}
