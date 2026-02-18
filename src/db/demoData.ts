import { db } from './index'
import type { Account, Transaction, Category, Budget, MonthlyIncome } from './index'

function getRecentMonths(): [string, string] {
  const now = new Date()
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  return [prevKey, cur]
}

function randomDate(yearMonth: string): Date {
  const [y, m] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const day = Math.floor(Math.random() * daysInMonth) + 1
  const hour = Math.floor(Math.random() * 14) + 8
  return new Date(y, m - 1, day, hour, Math.floor(Math.random() * 60))
}

const DEMO_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Housing', icon: '🏠', color: '#22C55E', isIncome: false, isDefault: false, displayOrder: 1, groupName: 'Fixed' },
  { name: 'Food', icon: '🍽️', color: '#EF4444', isIncome: false, isDefault: false, displayOrder: 2, groupName: 'Living' },
  { name: 'Transport', icon: '🚗', color: '#EAB308', isIncome: false, isDefault: false, displayOrder: 3, groupName: 'Fixed' },
  { name: 'Entertainment', icon: '🎮', color: '#8B5CF6', isIncome: false, isDefault: false, displayOrder: 4, groupName: 'Discretionary' },
  { name: 'Savings', icon: '🏦', color: '#0EA5E9', isIncome: false, isDefault: false, displayOrder: 5, groupName: 'Savings' },
  { name: 'Utilities', icon: '💡', color: '#14B8A6', isIncome: false, isDefault: false, displayOrder: 6, groupName: 'Fixed' },
  { name: 'Shopping', icon: '🛒', color: '#F97316', isIncome: false, isDefault: false, displayOrder: 7, groupName: 'Discretionary' },
  { name: 'Health', icon: '🏥', color: '#3B82F6', isIncome: false, isDefault: false, displayOrder: 8, groupName: 'Living' },
  { name: 'Salary', icon: '💰', color: '#10B981', isIncome: true, isDefault: false, displayOrder: 9, groupName: 'Income' },
]

// Budget amounts per category name
const BUDGET_MAP: Record<string, number> = {
  Housing: 1200,
  Food: 600,
  Transport: 200,
  Entertainment: 150,
  Savings: 800,
  Utilities: 250,
  Shopping: 300,
  Health: 200,
}

interface TxTemplate {
  category: string
  merchant: string
  minAmt: number
  maxAmt: number
}

const TX_TEMPLATES: TxTemplate[] = [
  { category: 'Housing', merchant: 'Rent Payment', minAmt: 1200, maxAmt: 1200 },
  { category: 'Food', merchant: 'Whole Foods', minAmt: 45, maxAmt: 120 },
  { category: 'Food', merchant: 'Trader Joe\'s', minAmt: 30, maxAmt: 80 },
  { category: 'Food', merchant: 'Chipotle', minAmt: 12, maxAmt: 18 },
  { category: 'Food', merchant: 'Starbucks', minAmt: 5, maxAmt: 8 },
  { category: 'Food', merchant: 'DoorDash', minAmt: 20, maxAmt: 45 },
  { category: 'Food', merchant: 'Local Restaurant', minAmt: 25, maxAmt: 60 },
  { category: 'Transport', merchant: 'Shell Gas Station', minAmt: 35, maxAmt: 55 },
  { category: 'Transport', merchant: 'Uber', minAmt: 12, maxAmt: 30 },
  { category: 'Transport', merchant: 'Parking', minAmt: 8, maxAmt: 15 },
  { category: 'Entertainment', merchant: 'Netflix', minAmt: 15, maxAmt: 15 },
  { category: 'Entertainment', merchant: 'Spotify', minAmt: 10, maxAmt: 10 },
  { category: 'Entertainment', merchant: 'Movie Theater', minAmt: 15, maxAmt: 25 },
  { category: 'Entertainment', merchant: 'Bar & Grill', minAmt: 30, maxAmt: 60 },
  { category: 'Savings', merchant: 'Auto Savings Transfer', minAmt: 800, maxAmt: 800 },
  { category: 'Utilities', merchant: 'Electric Company', minAmt: 80, maxAmt: 120 },
  { category: 'Utilities', merchant: 'Water Bill', minAmt: 40, maxAmt: 60 },
  { category: 'Utilities', merchant: 'Internet - Comcast', minAmt: 70, maxAmt: 70 },
  { category: 'Shopping', merchant: 'Amazon', minAmt: 15, maxAmt: 120 },
  { category: 'Shopping', merchant: 'Target', minAmt: 20, maxAmt: 80 },
  { category: 'Shopping', merchant: 'Nike Store', minAmt: 60, maxAmt: 150 },
  { category: 'Health', merchant: 'CVS Pharmacy', minAmt: 10, maxAmt: 40 },
  { category: 'Health', merchant: 'Gym Membership', minAmt: 50, maxAmt: 50 },
  { category: 'Health', merchant: 'Doctor Visit Copay', minAmt: 30, maxAmt: 30 },
]

function pickAmount(min: number, max: number): number {
  if (min === max) return min
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

export async function loadDemoData(): Promise<void> {
  // Clear existing data first
  await clearDemoData()

  const now = new Date()

  // 1. Create demo account
  const accountId = await db.accounts.add({
    name: 'Demo Checking',
    type: 'checking',
    bankName: 'Demo Bank',
    balance: 3200,
    color: '#3B82F6',
    icon: '🏦',
    displayOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  } as Account) as number

  // 2. Create categories
  const catIds: Record<string, number> = {}
  for (const cat of DEMO_CATEGORIES) {
    const id = await db.categories.add(cat as Category) as number
    catIds[cat.name] = id
  }

  // 3. Create budgets & transactions for 2 months
  const [prevMonth, curMonth] = getRecentMonths()

  for (const month of [prevMonth, curMonth]) {
    // Budgets
    for (const [catName, amount] of Object.entries(BUDGET_MAP)) {
      await db.budgets.add({
        categoryId: catIds[catName],
        amount,
        month,
      } as Budget)
    }

    // Salary income
    await db.transactions.add({
      accountId,
      amount: 4500,
      type: 'income',
      categoryId: catIds['Salary'],
      merchantName: 'Employer Direct Deposit',
      date: randomDate(month),
      memo: 'Monthly salary',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    } as Transaction)

    // Expense transactions — pick ~17-20 per month
    const isCurrent = month === curMonth
    const txCount = isCurrent ? 17 : 20
    const used = new Set<number>()
    const txList: Omit<Transaction, 'id'>[] = []

    // Always include rent, savings, utilities, gym
    const mustInclude = [0, 14, 15, 16, 17, 22] // indices into TX_TEMPLATES
    for (const idx of mustInclude) {
      if (idx < TX_TEMPLATES.length) {
        const tpl = TX_TEMPLATES[idx]
        // For current month, make some categories over budget
        let amt = pickAmount(tpl.minAmt, tpl.maxAmt)
        if (isCurrent && tpl.category === 'Food' && tpl.merchant === 'DoorDash') {
          amt = 48 // push food over
        }
        txList.push({
          accountId,
          amount: amt,
          type: 'expense',
          categoryId: catIds[tpl.category],
          merchantName: tpl.merchant,
          date: randomDate(month),
          memo: '',
          source: 'manual',
          createdAt: now,
          updatedAt: now,
        })
        used.add(idx)
      }
    }

    // Fill remaining with random picks
    while (txList.length < txCount) {
      const idx = Math.floor(Math.random() * TX_TEMPLATES.length)
      if (used.has(idx) && used.size < TX_TEMPLATES.length - 2) continue
      used.add(idx)
      const tpl = TX_TEMPLATES[idx]
      let amt = pickAmount(tpl.minAmt, tpl.maxAmt)
      // Make previous month's entertainment over budget
      if (!isCurrent && tpl.category === 'Entertainment') {
        amt = Math.max(amt, 50)
      }
      // Make shopping slightly over for current month
      if (isCurrent && tpl.category === 'Shopping') {
        amt = Math.max(amt, 90)
      }
      txList.push({
        accountId,
        amount: amt,
        type: 'expense',
        categoryId: catIds[tpl.category],
        merchantName: tpl.merchant,
        date: randomDate(month),
        memo: '',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      })
    }

    await db.transactions.bulkAdd(txList as Transaction[])
  }

  // 4. Monthly income
  for (const month of [prevMonth, curMonth]) {
    await db.monthlyIncomes.add({ yearMonth: month, amount: 4500 } as MonthlyIncome)
  }

  // 5. Mark as demo
  await db.appSettings.add({ key: 'isDemoData', value: 'true' })
}

export async function clearDemoData(): Promise<void> {
  await db.transactions.clear()
  await db.budgets.clear()
  await db.accounts.clear()
  await db.categories.clear()
  await db.monthlyIncomes.clear()
  await db.salaryAllocations.clear()
  await db.merchantRules.clear()
  await db.recurringItems.clear()
  await db.changeAlerts.clear()
  await db.insights.clear()

  // Remove demo flag
  const setting = await db.appSettings.where('key').equals('isDemoData').first()
  if (setting?.id) await db.appSettings.delete(setting.id)

  // Re-seed default categories
  const { seedCategories } = await import('./index')
  await seedCategories()
}

export async function isDemoLoaded(): Promise<boolean> {
  const setting = await db.appSettings.where('key').equals('isDemoData').first()
  return setting?.value === 'true'
}
