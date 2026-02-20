import { db } from '@/db'

export interface ImportResult {
  success: boolean
  tables: Record<string, number>
  error?: string
}

export async function importJSON(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.version || !data.tables) {
      return { success: false, tables: {}, error: 'Invalid backup file format' }
    }

    const tableNames = [
      'accounts', 'transactions', 'categories', 'budgets',
      'salaryAllocations', 'merchantRules', 'recurringItems',
      'changeAlerts', 'monthlyIncomes', 'insights',
    ] as const

    const counts: Record<string, number> = {}

    // Clear all tables first, then bulk insert
    for (const name of tableNames) {
      const table = db.table(name)
      await table.clear()
      const rows = data.tables[name]
      if (Array.isArray(rows) && rows.length > 0) {
        // Restore Date objects from ISO strings
        const restored = rows.map((row: Record<string, unknown>) => {
          const out = { ...row }
          for (const [key, val] of Object.entries(out)) {
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
              out[key] = new Date(val)
            }
          }
          return out
        })
        await table.bulkAdd(restored)
        counts[name] = restored.length
      } else {
        counts[name] = 0
      }
    }

    return { success: true, tables: counts }
  } catch (e) {
    return { success: false, tables: {}, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

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
