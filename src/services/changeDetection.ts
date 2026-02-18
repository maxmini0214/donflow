import { db, type Transaction } from '@/db'

/**
 * Called after a transaction is saved.
 * Checks if it matches a recurring item and detects price changes.
 */
export async function detectChanges(tx: Transaction) {
  if (tx.type !== 'expense') return

  const recurringItems = await db.recurringItems.where('isActive').equals(1).toArray()
  if (recurringItems.length === 0) return

  const name = tx.merchantName?.toLowerCase().trim()
  if (!name) return

  for (const item of recurringItems) {
    const itemName = item.name.toLowerCase().trim()
    // Fuzzy match: contains or equal
    if (!name.includes(itemName) && !itemName.includes(name)) continue

    // Price change detection
    if (item.amount !== tx.amount) {
      const existingAlert = await db.changeAlerts
        .where('recurringId').equals(item.id!)
        .and(a => !a.isResolved)
        .first()

      if (!existingAlert) {
        await db.changeAlerts.add({
          type: 'price_change',
          title: `${item.name} 금액 변동`,
          description: `${item.name} 결제 금액이 ₩${item.amount.toLocaleString()}에서 ₩${tx.amount.toLocaleString()}(으)로 변경되었어요.`,
          oldAmount: item.amount,
          newAmount: tx.amount,
          recurringId: item.id,
          isResolved: false,
          suggestedAction: tx.amount > item.amount ? '여유자금에서 차감' : '절약된 금액 저축',
          createdAt: new Date(),
        })
      }

      // Update lastAmount for tracking
      await db.recurringItems.update(item.id!, { lastAmount: tx.amount, updatedAt: new Date() })
    }
    break
  }
}

/**
 * Generate insights based on transaction history.
 * Called periodically or on dashboard load.
 */
export async function generateInsights(monthKey: string) {
  const allTx = await db.transactions.toArray()
  if (allTx.length < 10) return

  const categories = await db.categories.toArray()
  const [year, month] = monthKey.split('-').map(Number)

  // Get last 3 months of data
  const months: string[] = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthlyByCategory = new Map<number, number[]>()
  for (const m of months) {
    const [y, mo] = m.split('-').map(Number)
    const start = new Date(y, mo - 1, 1)
    const end = new Date(y, mo, 0, 23, 59, 59)
    const txs = allTx.filter(t => t.type === 'expense' && new Date(t.date) >= start && new Date(t.date) <= end)

    for (const tx of txs) {
      if (!monthlyByCategory.has(tx.categoryId)) monthlyByCategory.set(tx.categoryId, [0, 0, 0])
      const arr = monthlyByCategory.get(tx.categoryId)!
      const idx = months.indexOf(m)
      arr[idx] += tx.amount
    }
  }

  // Clear old insights for this month
  const oldInsights = await db.insights.where('month').equals(monthKey).toArray()
  if (oldInsights.length > 0) {
    await db.insights.bulkDelete(oldInsights.map(i => i.id!))
  }

  // Detect trends
  for (const [catId, amounts] of monthlyByCategory) {
    const cat = categories.find(c => c.id === catId)
    if (!cat || amounts.every(a => a === 0)) continue

    // Increasing trend
    if (amounts[0] > 0 && amounts[1] > amounts[0] && amounts[2] > amounts[1]) {
      const formatAmt = (a: number) => a >= 10000 ? `${Math.round(a / 10000)}만` : `${Math.round(a / 1000)}천`
      await db.insights.add({
        type: 'trend',
        title: `${cat.icon} ${cat.name} 지출 증가세`,
        description: `지난 3개월: ${amounts.map(formatAmt).join('→')} (계속 증가 중이에요 📈)`,
        categoryId: catId,
        month: monthKey,
        isRead: false,
        createdAt: new Date(),
      })
    }

    // Current month anomaly (>40% above average of prev 2 months)
    const prevAvg = (amounts[0] + amounts[1]) / 2
    if (prevAvg > 0 && amounts[2] > prevAvg * 1.4) {
      const pctOver = Math.round((amounts[2] / prevAvg - 1) * 100)
      await db.insights.add({
        type: 'anomaly',
        title: `${cat.icon} ${cat.name} 지출 급증`,
        description: `이번 달 ${cat.name} 지출이 평소보다 ${pctOver}% 높아요`,
        categoryId: catId,
        month: monthKey,
        isRead: false,
        createdAt: new Date(),
      })
    }
  }

  // Top merchant this month
  const currentMonthTx = allTx.filter(t => {
    const d = new Date(t.date)
    return t.type === 'expense' && d.getFullYear() === year && d.getMonth() === month - 1 && t.merchantName
  })

  const merchantCount = new Map<string, { count: number; total: number }>()
  for (const tx of currentMonthTx) {
    const name = tx.merchantName
    const prev = merchantCount.get(name) ?? { count: 0, total: 0 }
    merchantCount.set(name, { count: prev.count + 1, total: prev.total + tx.amount })
  }

  let topMerchant = { name: '', count: 0, total: 0 }
  for (const [name, data] of merchantCount) {
    if (data.count > topMerchant.count) {
      topMerchant = { name, ...data }
    }
  }

  if (topMerchant.count >= 3) {
    await db.insights.add({
      type: 'tip',
      title: `🏪 가장 자주 간 곳: ${topMerchant.name}`,
      description: `${topMerchant.count}회, ₩${topMerchant.total.toLocaleString()}`,
      month: monthKey,
      isRead: false,
      createdAt: new Date(),
    })
  }
}
