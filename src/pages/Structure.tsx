import { useState, useMemo, useCallback } from 'react'
import { Pencil, Check, X, Plus, Trash2, ChevronUp, ChevronDown, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { db, type Category } from '@/db'
import {
  useMonthlySalary,
  useCategories,
  useBudgets,
} from '@/hooks/useDB'
import { formatNumber, getMonthKey } from '@/lib/utils'

const GROUP_COLORS: Record<string, string> = {
  '고정비': '#6366f1',
  '생활비': '#f59e0b',
  '저축/투자': '#10b981',
  '자유지출': '#ec4899',
}

const DEFAULT_GROUP_ORDER = ['고정비', '생활비', '저축/투자', '자유지출']

const EMOJI_PRESETS = [
  '🍔', '🍚', '🚗', '🚌', '☕', '🛒', '💊', '📚', '🏠', '💰',
  '🎮', '✈️', '🐕', '💄', '🏥', '📱', '🎵', '🔄', '🛡️', '🏦',
  '💕', '🎁', '📌', '🏋️', '🍺', '👶', '🐱', '💻', '🎬', '🧹',
]

const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#64748B',
]

interface CategoryFormData {
  name: string
  icon: string
  color: string
  groupName: string
  isIncome: boolean
}

const emptyForm: CategoryFormData = { name: '', icon: '📌', color: '#6B7280', groupName: '자유지출', isIncome: false }

export default function Structure() {
  const salary = useMonthlySalary()
  const categories = useCategories()
  const monthKey = getMonthKey(new Date())
  const budgets = useBudgets(monthKey)

  const [editingSalary, setEditingSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState('')
  const [editingBudget, setEditingBudget] = useState<number | null>(null)
  const [budgetInput, setBudgetInput] = useState('')

  // Category management state
  const [editMode, setEditMode] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryFormData>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // Group management
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const budgetMap = useMemo(() => {
    const m = new Map<number, number>()
    budgets.forEach(b => m.set(b.categoryId, b.amount))
    return m
  }, [budgets])

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const remaining = salary - totalBudget

  // Get unique group names from categories, maintaining order
  const groupNames = useMemo(() => {
    const expCats = categories.filter(c => !c.isIncome)
    const groups = new Set<string>()
    // Add default order first
    DEFAULT_GROUP_ORDER.forEach(g => {
      if (expCats.some(c => c.groupName === g)) groups.add(g)
    })
    // Then any custom groups
    expCats.forEach(c => { if (c.groupName) groups.add(c.groupName) })
    return Array.from(groups)
  }, [categories])

  const groupedView = useMemo(() => {
    const expenseCategories = categories.filter(c => !c.isIncome)
    return groupNames.map(groupName => {
      const cats = expenseCategories
        .filter(c => c.groupName === groupName)
        .sort((a, b) => a.displayOrder - b.displayOrder)
      const groupTotal = cats.reduce((s, c) => s + (budgetMap.get(c.id!) ?? 0), 0)
      const groupPct = salary > 0 ? Math.round((groupTotal / salary) * 100) : 0
      return { groupName, cats, groupTotal, groupPct }
    })
  }, [categories, groupNames, budgetMap, salary])

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

  // Category CRUD
  const openAddDialog = useCallback((groupName?: string) => {
    setEditingCategory(null)
    setForm({ ...emptyForm, groupName: groupName ?? '자유지출' })
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((cat: Category) => {
    setEditingCategory(cat)
    setForm({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      groupName: cat.groupName ?? '자유지출',
      isIncome: cat.isIncome,
    })
    setDialogOpen(true)
  }, [])

  const saveCategory = async () => {
    if (!form.name.trim()) return

    if (editingCategory) {
      await db.categories.update(editingCategory.id!, {
        name: form.name.trim(),
        icon: form.icon,
        color: form.color,
        groupName: form.groupName,
        isIncome: form.isIncome,
      })
    } else {
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.displayOrder), 0)
      await db.categories.add({
        name: form.name.trim(),
        icon: form.icon,
        color: form.color,
        isIncome: form.isIncome,
        isDefault: false,
        displayOrder: maxOrder + 1,
        groupName: form.groupName,
      })
    }
    setDialogOpen(false)
  }

  const deleteCategory = async (catId: number) => {
    // Move transactions to "기타" (uncategorized)
    const etcCat = categories.find(c => c.name === '기타')
    if (etcCat) {
      await db.transactions.where('categoryId').equals(catId).modify({ categoryId: etcCat.id! })
    }
    // Delete budgets for this category
    await db.budgets.where('categoryId').equals(catId).delete()
    await db.categories.delete(catId)
    setDeleteConfirm(null)
  }

  const moveCategory = async (cat: Category, direction: 'up' | 'down') => {
    const sameCats = categories
      .filter(c => c.groupName === cat.groupName && c.isIncome === cat.isIncome)
      .sort((a, b) => a.displayOrder - b.displayOrder)
    const idx = sameCats.findIndex(c => c.id === cat.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sameCats.length) return
    const other = sameCats[swapIdx]
    await db.categories.update(cat.id!, { displayOrder: other.displayOrder })
    await db.categories.update(other.id!, { displayOrder: cat.displayOrder })
  }

  const addGroup = async () => {
    if (!newGroupName.trim() || groupNames.includes(newGroupName.trim())) return
    // Add a placeholder category so the group exists
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.displayOrder), 0)
    await db.categories.add({
      name: '새 카테고리',
      icon: '📌',
      color: '#6B7280',
      isIncome: false,
      isDefault: false,
      displayOrder: maxOrder + 1,
      groupName: newGroupName.trim(),
    })
    setAddGroupOpen(false)
    setNewGroupName('')
  }

  const deleteGroup = async (groupName: string) => {
    const groupCats = categories.filter(c => c.groupName === groupName)
    const etcCat = categories.find(c => c.name === '기타' && c.groupName !== groupName)
    for (const cat of groupCats) {
      if (etcCat) {
        await db.transactions.where('categoryId').equals(cat.id!).modify({ categoryId: etcCat.id! })
      }
      await db.budgets.where('categoryId').equals(cat.id!).delete()
      await db.categories.delete(cat.id!)
    }
  }

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
              return pct > 0 ? (
                <div
                  key={g.groupName}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: GROUP_COLORS[g.groupName] ?? '#6b7280' }}
                  title={`${g.groupName}: ₩${formatNumber(g.groupTotal)}`}
                />
              ) : null
            })}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {groupedView.filter(g => g.groupTotal > 0).map(g => (
              <span key={g.groupName} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GROUP_COLORS[g.groupName] ?? '#6b7280' }} />
                {g.groupName} {g.groupPct}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit mode toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">카테고리 관리</h2>
        <Button
          size="sm"
          variant={editMode ? 'default' : 'outline'}
          className="h-8 text-xs gap-1"
          onClick={() => setEditMode(!editMode)}
        >
          <Settings2 className="w-3.5 h-3.5" />
          {editMode ? '완료' : '편집'}
        </Button>
      </div>

      {/* What-if indicator when editing budget */}
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
            {editMode && (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => openAddDialog(groupName)}
                  title="이 그룹에 카테고리 추가"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`"${groupName}" 그룹과 하위 카테고리를 모두 삭제하시겠습니까?`)) {
                      deleteGroup(groupName)
                    }
                  }}
                  title="그룹 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            {cats.map((cat, idx) => {
              const budgetAmount = budgetMap.get(cat.id!) ?? 0
              const isEditing = editingBudget === cat.id
              const pct = salary > 0 && budgetAmount > 0 ? Math.round((budgetAmount / salary) * 100) : 0

              return (
                <div key={cat.id} className="rounded-lg bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {editMode && (
                        <div className="flex flex-col -my-1">
                          <button
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                            onClick={() => moveCategory(cat, 'up')}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                            onClick={() => moveCategory(cat, 'down')}
                            disabled={idx === cats.length - 1}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
                        style={{ backgroundColor: cat.color + '22' }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-sm">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {editMode ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(cat)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {deleteConfirm === cat.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs px-2"
                                onClick={() => deleteCategory(cat.id!)}
                              >
                                확인
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                취소
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm(cat.id!)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </>
                      ) : isEditing ? (
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
                  </div>
                  {budgetAmount > 0 && !isEditing && !editMode && (
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

      {/* Edit mode bottom actions */}
      {editMode && salary > 0 && (
        <div className="space-y-2">
          <Button
            className="w-full h-11 text-sm gap-2"
            variant="outline"
            onClick={() => openAddDialog()}
          >
            <Plus className="w-4 h-4" /> 카테고리 추가
          </Button>
          <Button
            className="w-full h-11 text-sm gap-2"
            variant="outline"
            onClick={() => setAddGroupOpen(true)}
          >
            <Plus className="w-4 h-4" /> 대분류 그룹 추가
          </Button>
        </div>
      )}

      {salary === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">💰</div>
          <p className="text-muted-foreground">먼저 월 수입을 설정해주세요</p>
          <p className="text-xs text-muted-foreground">위의 수입 금액을 터치하면 편집할 수 있어요</p>
        </div>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '카테고리 편집' : '카테고리 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">이름</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="카테고리 이름"
                autoFocus
              />
            </div>

            {/* Group */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">대분류</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                value={form.groupName}
                onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))}
              >
                {groupNames.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Emoji */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">아이콘</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_PRESETS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                      form.icon === emoji
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                    onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">색상</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      form.color === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm(f => ({ ...f, color }))}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-secondary/30 p-3 flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-md flex items-center justify-center text-lg"
                style={{ backgroundColor: form.color + '22' }}
              >
                {form.icon}
              </span>
              <span className="text-sm font-medium">{form.name || '미리보기'}</span>
              <span className="text-xs text-muted-foreground ml-auto">{form.groupName}</span>
            </div>

            <Button className="w-full" onClick={saveCategory} disabled={!form.name.trim()}>
              {editingCategory ? '저장' : '추가'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>대분류 그룹 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="그룹 이름 (예: 부업/수입)"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && addGroup()}
            />
            <Button className="w-full" onClick={addGroup} disabled={!newGroupName.trim()}>
              추가
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
