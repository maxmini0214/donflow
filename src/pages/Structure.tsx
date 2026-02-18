import { useState } from 'react'
import { Plus, Pencil, X, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { db, type RecurringItem, type SalaryAllocation } from '@/db'
import {
  useSalaryAllocations,
  useRecurringItems,
  useChangeAlerts,
  useMonthlySalary,
  useCategories,
  useAccounts,
} from '@/hooks/useDB'
import { formatNumber } from '@/lib/utils'

export default function Structure() {
  const salary = useMonthlySalary()
  const allocations = useSalaryAllocations()
  const recurringItems = useRecurringItems()
  const alerts = useChangeAlerts(false)
  const categories = useCategories()
  const accounts = useAccounts()

  const [editingSalary, setEditingSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState('')
  const [showAllocForm, setShowAllocForm] = useState(false)
  const [showRecurringForm, setShowRecurringForm] = useState(false)

  const totalAllocated = allocations.reduce((s, a) => {
    if (a.type === 'fixed') return s + a.value
    return s + Math.round(salary * a.value / 100)
  }, 0)
  const remaining = salary - totalAllocated

  const saveSalary = async () => {
    const val = parseInt(salaryInput)
    if (!val) return
    const existing = await db.appSettings.where('key').equals('monthlySalary').first()
    if (existing) {
      await db.appSettings.update(existing.id!, { value: String(val) })
    } else {
      await db.appSettings.add({ key: 'monthlySalary', value: String(val) })
    }
    setEditingSalary(false)
  }

  const resolveAlert = async (id: number) => {
    await db.changeAlerts.update(id, { isResolved: true })
  }

  const deleteAllocation = async (id: number) => {
    await db.salaryAllocations.delete(id)
  }

  const deleteRecurring = async (id: number) => {
    await db.recurringItems.update(id, { isActive: false })
  }

  const recurringExpenses = recurringItems.filter(r => r.type === 'expense')
  const recurringIncomes = recurringItems.filter(r => r.type === 'income')
  const totalRecurringExpense = recurringExpenses.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* Monthly Salary */}
      <div className="text-center py-3">
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
            ₩{formatNumber(salary || 0)} <Pencil className="w-4 h-4 inline text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Salary Allocation */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">── 배분 ──</p>
          <Button size="sm" variant="ghost" onClick={() => setShowAllocForm(!showAllocForm)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {showAllocForm && (
          <AllocationForm
            salary={salary}
            accounts={accounts}
            nextOrder={allocations.length}
            onClose={() => setShowAllocForm(false)}
          />
        )}

        {salary > 0 && allocations.length > 0 ? (
          <div className="space-y-2">
            {allocations.map(alloc => {
              const amount = alloc.type === 'fixed' ? alloc.value : Math.round(salary * alloc.value / 100)
              const pct = salary > 0 ? Math.round((amount / salary) * 100) : 0
              return (
                <div key={alloc.id} className="group">
                  <div className="flex items-center justify-between text-sm">
                    <span>{alloc.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₩{formatNumber(amount)}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                      <button onClick={() => deleteAllocation(alloc.id!)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className={`text-sm text-right ${remaining < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
              {remaining >= 0 ? `미배분 ₩${formatNumber(remaining)}` : `₩${formatNumber(Math.abs(remaining))} 초과!`}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {salary === 0 ? '먼저 월 수입을 설정하세요' : '배분 항목을 추가하세요'}
          </p>
        )}
      </section>

      {/* Recurring Expenses */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">── 고정 지출 ──</p>
          <Button size="sm" variant="ghost" onClick={() => setShowRecurringForm(!showRecurringForm)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {showRecurringForm && (
          <RecurringForm
            categories={categories}
            type="expense"
            onClose={() => setShowRecurringForm(false)}
          />
        )}

        {recurringExpenses.length > 0 ? (
          <div className="space-y-1.5">
            {recurringExpenses.map(item => {
              const cat = categories.find(c => c.id === item.categoryId)
              const hasChange = item.lastAmount != null && item.lastAmount !== item.amount
              return (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 group">
                  <div className="flex items-center gap-2">
                    <span>{cat?.icon ?? '📌'}</span>
                    <div>
                      <p className="text-sm font-medium">
                        {item.name}
                        {hasChange && <span className="text-xs text-amber-500 ml-1">⚠️ 변동</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        매월 {item.dayOfMonth ?? '-'}일
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">₩{formatNumber(item.amount)}</span>
                    <button onClick={() => deleteRecurring(item.id!)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
            <div className="text-sm text-right text-muted-foreground">
              합계 ₩{formatNumber(totalRecurringExpense)}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">고정 지출을 추가하세요</p>
        )}
      </section>

      {/* Recurring Incomes */}
      {recurringIncomes.length > 0 && (
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">── 고정 수입 ──</p>
          <div className="space-y-1.5">
            {recurringIncomes.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <p className="text-sm">{item.name}</p>
                <span className="text-sm font-medium text-income">₩{formatNumber(item.amount)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Change Alerts */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">── 변동 알림 ──</p>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
                <p className="text-sm font-medium">🔔 {alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
                {alert.oldAmount != null && alert.newAmount != null && (
                  <p className="text-xs">
                    ₩{formatNumber(alert.oldAmount)} → ₩{formatNumber(alert.newAmount)}
                    <span className="text-amber-500 ml-1">
                      ({alert.newAmount > alert.oldAmount ? '+' : ''}₩{formatNumber(alert.newAmount - alert.oldAmount)})
                    </span>
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => resolveAlert(alert.id!)}>
                    적용
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => resolveAlert(alert.id!)}>
                    무시
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// --- Sub-components ---

function AllocationForm({ salary, accounts, nextOrder, onClose }: {
  salary: number
  accounts: { id?: number; name: string }[]
  nextOrder: number
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')

  const save = async () => {
    const val = parseInt(amount)
    if (!name || !val) return
    await db.salaryAllocations.add({
      name,
      accountId: accountId ? Number(accountId) : 0,
      type: 'fixed',
      value: val,
      displayOrder: nextOrder,
    })
    onClose()
  }

  return (
    <div className="rounded-xl bg-secondary/50 p-3 space-y-2">
      <Input placeholder="이름 (예: 생활비)" value={name} onChange={e => setName(e.target.value)} />
      <Input type="number" placeholder={`금액 (월급: ₩${formatNumber(salary)})`} value={amount} onChange={e => setAmount(e.target.value)} />
      {accounts.length > 0 && (
        <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
          <option value="">계좌 선택 (선택)</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={!name || !amount}>추가</Button>
        <Button size="sm" variant="ghost" onClick={onClose}>취소</Button>
      </div>
    </div>
  )
}

function RecurringForm({ categories, type, onClose }: {
  categories: { id?: number; name: string; icon: string; isIncome: boolean }[]
  type: 'income' | 'expense'
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [day, setDay] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const save = async () => {
    const val = parseInt(amount)
    if (!name || !val) return
    const item: RecurringItem = {
      name,
      amount: val,
      type,
      frequency: 'monthly',
      dayOfMonth: day ? Number(day) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.recurringItems.add(item)
    onClose()
  }

  const filteredCats = categories.filter(c => type === 'income' ? c.isIncome : !c.isIncome)

  return (
    <div className="rounded-xl bg-secondary/50 p-3 space-y-2">
      <Input placeholder="이름 (예: 넷플릭스)" value={name} onChange={e => setName(e.target.value)} />
      <div className="flex gap-2">
        <Input type="number" placeholder="금액" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1" />
        <Input type="number" placeholder="매월 X일" value={day} onChange={e => setDay(e.target.value)} className="w-24" />
      </div>
      <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
        <option value="">카테고리 (선택)</option>
        {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
      </Select>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={!name || !amount}>추가</Button>
        <Button size="sm" variant="ghost" onClick={onClose}>취소</Button>
      </div>
    </div>
  )
}
