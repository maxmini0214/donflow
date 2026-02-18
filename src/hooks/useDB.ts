import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Account, type Transaction, type Category } from '@/db'
import { getMonthRange } from '@/lib/utils'

export function useAccounts() {
  return useLiveQuery(() => db.accounts.orderBy('displayOrder').toArray()) ?? []
}

export function useCategories() {
  return useLiveQuery(() => db.categories.orderBy('displayOrder').toArray()) ?? []
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
