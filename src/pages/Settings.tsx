import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { db, type Account } from '@/db'
import { useCategories, useAccounts, useBudgets } from '@/hooks/useDB'
import { formatKRW, getMonthKey } from '@/lib/utils'
import { getBankPreset, BANK_PRESETS } from '@/lib/bankPresets'
import { Download, Upload, Trash2, Plus, AlertTriangle, Pencil, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ACCOUNT_TYPES = [
  { value: 'checking', label: '입출금', icon: '🏦' },
  { value: 'savings', label: '저축', icon: '💰' },
  { value: 'credit_card', label: '신용카드', icon: '💳' },
  { value: 'debit_card', label: '체크카드', icon: '💳' },
  { value: 'investment', label: '투자', icon: '📈' },
  { value: 'cash', label: '현금', icon: '💵' },
] as const

const BANKS = [
  '신한은행', '국민은행', '하나은행', '우리은행', '카카오뱅크', '토스뱅크',
  'NH농협', 'IBK기업', '신한카드', '삼성카드', '현대카드', '국민카드',
  'BC카드', '롯데카드', '하나카드', '우리카드', '기타',
]

export default function Settings() {
  const categories = useCategories()
  const accounts = useAccounts()
  const navigate = useNavigate()
  const monthKey = getMonthKey(new Date())
  const budgets = useBudgets(monthKey)

  const [importFile, setImportFile] = useState<File | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📌')

  // Account form state
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [accName, setAccName] = useState('')
  const [accBank, setAccBank] = useState('')
  const [accType, setAccType] = useState<Account['type']>('checking')
  const [accBalance, setAccBalance] = useState('')

  // Budget form state
  const [budgetCatId, setBudgetCatId] = useState<string>('')
  const [budgetAmount, setBudgetAmount] = useState('')

  // Export
  const handleExport = async () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: 1,
      accounts: await db.accounts.toArray(),
      transactions: await db.transactions.toArray(),
      categories: await db.categories.toArray(),
      budgets: await db.budgets.toArray(),
      salaryAllocations: await db.salaryAllocations.toArray(),
      merchantRules: await db.merchantRules.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donflow-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    const existing = await db.appSettings.where('key').equals('lastBackup').first()
    if (existing) {
      await db.appSettings.update(existing.id!, { value: new Date().toISOString() })
    } else {
      await db.appSettings.add({ key: 'lastBackup', value: new Date().toISOString() })
    }
  }

  // Import
  const handleImport = async () => {
    if (!importFile) return
    if (!confirm('기존 데이터를 모두 덮어씁니다. 계속하시겠습니까?')) return
    const text = await importFile.text()
    const data = JSON.parse(text)
    await Promise.all([
      db.accounts.clear(), db.transactions.clear(), db.categories.clear(),
      db.budgets.clear(), db.salaryAllocations.clear(), db.merchantRules.clear(),
    ])
    if (data.accounts) await db.accounts.bulkAdd(data.accounts.map((a: any) => ({
      ...a, createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt)
    })))
    if (data.transactions) await db.transactions.bulkAdd(data.transactions.map((t: any) => ({
      ...t, date: new Date(t.date), createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt)
    })))
    if (data.categories) await db.categories.bulkAdd(data.categories)
    if (data.budgets) await db.budgets.bulkAdd(data.budgets)
    if (data.salaryAllocations) await db.salaryAllocations.bulkAdd(data.salaryAllocations)
    if (data.merchantRules) await db.merchantRules.bulkAdd(data.merchantRules)
    alert('데이터 복원 완료!')
    setImportFile(null)
  }

  const handleClearAll = async () => {
    if (!confirm('정말 모든 데이터를 삭제하시겠습니까?')) return
    if (!confirm('마지막 확인: 모든 데이터가 영구 삭제됩니다.')) return
    await Promise.all([
      db.accounts.clear(), db.transactions.clear(),
      db.budgets.clear(), db.salaryAllocations.clear(), db.merchantRules.clear(),
    ])
    alert('모든 데이터가 삭제되었습니다.')
  }

  // Category
  const handleAddCategory = async () => {
    if (!newCatName) return
    await db.categories.add({
      name: newCatName, icon: newCatIcon, color: '#6B7280',
      isIncome: false, isDefault: false, displayOrder: categories.length + 1,
    })
    setNewCatName('')
    setNewCatIcon('📌')
  }

  const handleDeleteCategory = async (id: number, isDefault: boolean) => {
    if (isDefault) return alert('기본 카테고리는 삭제할 수 없습니다.')
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return
    await db.categories.delete(id)
  }

  // Accounts
  const openAccountForm = (account?: Account) => {
    if (account) {
      setEditAccount(account)
      setAccName(account.name)
      setAccBank(account.bankName)
      setAccType(account.type)
      setAccBalance(String(account.balance))
    } else {
      setEditAccount(null)
      setAccName('')
      setAccBank('')
      setAccType('checking')
      setAccBalance('')
    }
    setShowAccountForm(true)
  }

  const handleSaveAccount = async () => {
    if (!accName) return
    const typeInfo = ACCOUNT_TYPES.find(t => t.value === accType)!
    const preset = getBankPreset(accBank)
    const data = {
      name: accName, bankName: accBank, type: accType,
      balance: parseInt(accBalance) || 0,
      color: preset?.color ?? '#6366f1',
      icon: preset?.icon ?? typeInfo.icon,
      displayOrder: accounts.length, isActive: true, updatedAt: new Date(),
    }
    if (editAccount?.id) {
      await db.accounts.update(editAccount.id, data)
    } else {
      await db.accounts.add({ ...data, createdAt: new Date() } as Account)
    }
    setShowAccountForm(false)
  }

  const handleDeleteAccount = async (id: number) => {
    if (confirm('이 계좌를 삭제하시겠습니까?')) await db.accounts.delete(id)
  }

  // Budget
  const handleAddBudget = async () => {
    if (!budgetCatId || !budgetAmount) return
    const existing = budgets.find(b => b.categoryId === Number(budgetCatId))
    if (existing) {
      await db.budgets.update(existing.id!, { amount: parseInt(budgetAmount) })
    } else {
      await db.budgets.add({
        categoryId: Number(budgetCatId),
        month: monthKey,
        amount: parseInt(budgetAmount),
      })
    }
    setBudgetCatId('')
    setBudgetAmount('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">설정</h2>
      </div>

      {/* Accounts */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base">🏦 계좌 관리</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => openAccountForm()}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">계좌를 추가해보세요</p>
          ) : (
            accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium">{acc.name}</p>
                  <p className="text-xs text-muted-foreground">{acc.bankName} · {formatKRW(acc.balance)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAccountForm(acc)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteAccount(acc.id!)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">🏷️ 카테고리 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="이모지" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} className="w-16 text-center" />
            <Input placeholder="카테고리명" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1" />
            <Button size="icon" onClick={handleAddCategory}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1">
                <span className="text-sm">
                  {c.icon} {c.name}
                  {c.isIncome && <span className="text-xs text-income ml-1">(수입)</span>}
                </span>
                {!c.isDefault && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCategory(c.id!, c.isDefault)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">💰 예산 설정 ({monthKey})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={budgetCatId} onChange={e => setBudgetCatId(e.target.value)} className="flex-1">
              <option value="">카테고리</option>
              {categories.filter(c => !c.isIncome).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </Select>
            <Input type="number" placeholder="금액" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} className="w-28" />
            <Button size="icon" onClick={handleAddBudget}><Plus className="w-4 h-4" /></Button>
          </div>
          {budgets.length > 0 && (
            <div className="space-y-1">
              {budgets.map(b => {
                const cat = categories.find(c => c.id === b.categoryId)
                return (
                  <div key={b.id} className="flex items-center justify-between text-sm py-1">
                    <span>{cat?.icon} {cat?.name}</span>
                    <span className="font-medium">{formatKRW(b.amount)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">📦 백업 / 복원</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleExport} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" /> JSON 내보내기
          </Button>
          <div className="space-y-2">
            <input type="file" accept=".json" onChange={e => setImportFile(e.target.files?.[0] ?? null)} className="text-sm w-full" />
            {importFile && (
              <Button variant="outline" onClick={handleImport} className="w-full">
                <Upload className="w-4 h-4 mr-2" /> JSON 복원
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger */}
      <Card className="border-destructive/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> 위험 영역
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleClearAll} className="w-full">
            <Trash2 className="w-4 h-4 mr-2" /> 모든 데이터 삭제
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <p>돈플로우 v1.0.0</p>
        <p>모든 데이터는 브라우저에 저장 · 서버 전송 없음</p>
      </div>

      {/* Account Form Dialog */}
      {showAccountForm && (
        <Dialog open onOpenChange={() => setShowAccountForm(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editAccount ? '계좌 수정' : '계좌 추가'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">계좌명</label>
                <Input placeholder="급여통장, 생활비카드..." value={accName} onChange={e => setAccName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">은행/카드사</label>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {Object.values(BANK_PRESETS).slice(0, 9).map(b => (
                    <button
                      key={b.name} type="button" onClick={() => setAccBank(b.name)}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        accBank === b.name ? 'ring-2 ring-primary bg-primary/20' : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {b.icon} {b.name}
                    </button>
                  ))}
                </div>
                <Select value={accBank} onChange={e => setAccBank(e.target.value)}>
                  <option value="">선택...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">유형</label>
                <Select value={accType} onChange={e => setAccType(e.target.value as Account['type'])}>
                  {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">잔액 (원)</label>
                <Input type="number" placeholder="0" value={accBalance} onChange={e => setAccBalance(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAccountForm(false)}>취소</Button>
                <Button className="flex-1" onClick={handleSaveAccount}>저장</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
