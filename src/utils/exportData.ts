import { db } from '@/db'

function getDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportJSON() {
  const [
    accounts,
    transactions,
    categories,
    budgets,
    salaryAllocations,
    merchantRules,
    recurringItems,
    changeAlerts,
    monthlyIncomes,
    insights,
  ] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.salaryAllocations.toArray(),
    db.merchantRules.toArray(),
    db.recurringItems.toArray(),
    db.changeAlerts.toArray(),
    db.monthlyIncomes.toArray(),
    db.insights.toArray(),
  ])

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      accounts,
      transactions,
      categories,
      budgets,
      salaryAllocations,
      merchantRules,
      recurringItems,
      changeAlerts,
      monthlyIncomes,
      insights,
    },
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadFile(blob, `donflow-backup-${getDateString()}.json`)
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function exportCSV() {
  const [transactions, categories] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
  ])

  const categoryMap = new Map(categories.map(c => [c.id!, c.name]))

  const header = 'date,amount,type,merchantName,categoryName,memo'
  const rows = transactions.map(tx => {
    const date = tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : String(tx.date)
    const categoryName = categoryMap.get(tx.categoryId) ?? ''
    return [
      date,
      String(tx.amount),
      tx.type,
      escapeCsv(tx.merchantName || ''),
      escapeCsv(categoryName),
      escapeCsv(tx.memo || ''),
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  downloadFile(blob, `donflow-transactions-${getDateString()}.csv`)
}
