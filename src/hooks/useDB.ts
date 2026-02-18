import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ChangeAlert } from '@/db'
import { getMonthRange } from '@/lib/utils'

export function useAccounts() {
  return useLiveQuery(() => db.accounts.toArray().then(a => a.sort((x, y) => x.displayOrder - y.displayOrder))) ?? []
}

export function useCategories() {
  return useLiveQuery(() => db.categories.toArray().then(a => a.sort((x, y) => x.displayOrder - y.displayOrder))) ?? []
}

export function useTransactions(monthKey?: string) {
  return useLiveQuery(() => {
    if (monthKey) {
      const { start, end } = getMonthRange(monthKey)
      return db.transactions.where('date').between(start, end, true, true).reverse().sortBy('date')
    }
    return db.transactions.orderBy('date').reverse().toArray()
  }, [monthKey]) ?? []
}

export function useBudgets(month: string) {
  return useLiveQuery(() => db.budgets.where('month').equals(month).toArray(), [month]) ?? []
}

export function useMonthlyStats(monthKey: string) {
  const transactions = useTransactions(monthKey)
  
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  return { income, expense, savings: income - expense, transactions }
}

export function useCategoryStats(monthKey: string) {
  const transactions = useTransactions(monthKey)
  const categories = useCategories()
  
  const expenseByCategory = new Map<number, number>()
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory.set(t.categoryId, (expenseByCategory.get(t.categoryId) ?? 0) + t.amount)
    })
  
  return categories
    .filter(c => expenseByCategory.has(c.id!))
    .map(c => ({
      name: c.name,
      icon: c.icon,
      color: c.color,
      value: expenseByCategory.get(c.id!) ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
}

export function useSalaryAllocations() {
  return useLiveQuery(() => db.salaryAllocations.toArray().then(a => a.sort((x, y) => x.displayOrder - y.displayOrder))) ?? []
}

export function useRecurringItems() {
  return useLiveQuery(() => db.recurringItems.where('isActive').equals(1).toArray()) ?? []
}

export function useChangeAlerts(resolved = false) {
  return useLiveQuery(() =>
    db.changeAlerts.where('isResolved').equals(resolved ? 1 : 0).reverse().sortBy('createdAt')
  , [resolved]) ?? [] as ChangeAlert[]
}

export function useInsights(month: string) {
  return useLiveQuery(() => db.insights.where('month').equals(month).toArray(), [month]) ?? []
}

export function useBudgetComparison(monthKey: string) {
  const transactions = useTransactions(monthKey)
  const budgets = useBudgets(monthKey)
  const categories = useCategories()

  const expenseByCategory = new Map<number, number>()
  transactions.filter(t => t.type === 'expense').forEach(t => {
    expenseByCategory.set(t.categoryId, (expenseByCategory.get(t.categoryId) ?? 0) + t.amount)
  })

  return budgets.map(b => {
    const cat = categories.find(c => c.id === b.categoryId)
    const actual = expenseByCategory.get(b.categoryId) ?? 0
    const diff = actual - b.amount
    return {
      categoryId: b.categoryId,
      categoryName: cat?.name ?? '?',
      categoryIcon: cat?.icon ?? '📌',
      categoryColor: cat?.color ?? '#6B7280',
      planned: b.amount,
      actual,
      diff,
      percentage: b.amount > 0 ? Math.round((actual / b.amount) * 100) : 0,
    }
  }).sort((a, b) => b.percentage - a.percentage)
}

export function useMonthlySalary() {
  return useLiveQuery(async () => {
    const setting = await db.appSettings.where('key').equals('monthlySalary').first()
    return setting ? Number(setting.value) : 0
  }) ?? 0
}

export function useMonthlyIncome(monthKey: string) {
  return useLiveQuery(async () => {
    const record = await db.monthlyIncomes.where('yearMonth').equals(monthKey).first()
    if (record) return record.amount
    // Fallback to global salary setting
    const setting = await db.appSettings.where('key').equals('monthlySalary').first()
    return setting ? Number(setting.value) : 0
  }, [monthKey]) ?? 0
}

export function useRecentMerchants() {
  return useLiveQuery(async () => {
    const txs = await db.transactions.orderBy('date').reverse().limit(50).toArray()
    const seen = new Map<string, { merchantName: string; categoryId: number }>()
    for (const tx of txs) {
      if (tx.merchantName && !seen.has(tx.merchantName)) {
        seen.set(tx.merchantName, { merchantName: tx.merchantName, categoryId: tx.categoryId })
      }
      if (seen.size >= 3) break
    }
    const categories = await db.categories.toArray()
    const catMap = new Map(categories.map(c => [c.id, c]))
    return [...seen.values()].map(m => ({
      ...m,
      icon: catMap.get(m.categoryId)?.icon ?? '📌',
    }))
  }) ?? []
}
