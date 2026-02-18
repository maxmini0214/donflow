import { useState } from 'react'
import { Plus, Upload, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useTransactions, useCategories, useAccounts } from '@/hooks/useDB'
import { formatNumber, getMonthKey } from '@/lib/utils'
import TransactionForm from '@/components/TransactionForm'
import CsvImport from '@/components/CsvImport'

export default function Transactions() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editId, setEditId] = useState<number | undefined>()
  const [filterCategoryId, setFilterCategoryId] = useState<string>('')
  const [filterAccountId, setFilterAccountId] = useState<string>('')
  const [search, setSearch] = useState('')

  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthKey = getMonthKey(targetDate)
  const monthLabel = `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`

  const transactions = useTransactions(monthKey)
  const categories = useCategories()
  const accounts = useAccounts()

  const filtered = transactions.filter(tx => {
    if (filterCategoryId && tx.categoryId !== Number(filterCategoryId)) return false
    if (filterAccountId && tx.accountId !== Number(filterAccountId)) return false
    if (search && !tx.merchantName?.toLowerCase().includes(search.toLowerCase()) && !tx.memo?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      {/* Month Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m - 1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-income">수입 +{formatNumber(totalIncome)}원</span>
        <span className="text-expense">지출 -{formatNumber(totalExpense)}원</span>
        <span className="text-muted-foreground">{filtered.length}건</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => { setEditId(undefined); setShowForm(true) }} className="flex-1">
          <Plus className="w-4 h-4 mr-1" /> 거래 추가
        </Button>
        <Button variant="outline" onClick={() => setShowImport(true)}>
          <Upload className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)} className="w-28">
          <option value="">전체</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </Select>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">거래 내역이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => {
            const cat = categories.find(c => c.id === tx.categoryId)
            const acc = accounts.find(a => a.id === tx.accountId)
            return (
              <Card key={tx.id} className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => { setEditId(tx.id); setShowForm(true) }}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat?.icon ?? '📌'}</span>
                    <div>
                      <p className="text-sm font-medium">{tx.merchantName || cat?.name || '거래'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        {acc && ` · ${acc.name}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}원
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Transaction Form Dialog */}
      {showForm && (
        <TransactionForm
          editId={editId}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* CSV Import Dialog */}
      {showImport && (
        <CsvImport onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
