import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { db, type Account } from '@/db'
import { useAccounts } from '@/hooks/useDB'
import { formatKRW } from '@/lib/utils'
import { getBankPreset, BANK_PRESETS } from '@/lib/bankPresets'

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

export default function Accounts() {
  const accounts = useAccounts()
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)

  const [name, setName] = useState('')
  const [bankName, setBankName] = useState('')
  const [type, setType] = useState<Account['type']>('checking')
  const [balance, setBalance] = useState('')

  const totalAssets = accounts
    .filter(a => a.type !== 'credit_card')
    .reduce((s, a) => s + a.balance, 0)
  const totalDebt = accounts
    .filter(a => a.type === 'credit_card')
    .reduce((s, a) => s + Math.abs(a.balance), 0)

  const openForm = (account?: Account) => {
    if (account) {
      setEditAccount(account)
      setName(account.name)
      setBankName(account.bankName)
      setType(account.type)
      setBalance(String(account.balance))
    } else {
      setEditAccount(null)
      setName('')
      setBankName('')
      setType('checking')
      setBalance('')
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name) return
    const typeInfo = ACCOUNT_TYPES.find(t => t.value === type)!
    const preset = getBankPreset(bankName)
    const data = {
      name,
      bankName,
      type,
      balance: parseInt(balance) || 0,
      color: preset?.color ?? '#6366f1',
      icon: preset?.icon ?? typeInfo.icon,
      displayOrder: accounts.length,
      isActive: true,
      updatedAt: new Date(),
    }

    if (editAccount?.id) {
      await db.accounts.update(editAccount.id, data)
    } else {
      await db.accounts.add({ ...data, createdAt: new Date() } as Account)
    }
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm('이 계좌를 삭제하시겠습니까?')) {
      await db.accounts.delete(id)
    }
  }

  const grouped = ACCOUNT_TYPES.map(t => ({
    ...t,
    accounts: accounts.filter(a => a.type === t.value),
  })).filter(g => g.accounts.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">계좌 관리</h2>
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="w-4 h-4 mr-1" /> 추가
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">총 자산</p>
            <p className="text-lg font-bold text-income">{formatKRW(totalAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">카드 결제</p>
            <p className="text-lg font-bold text-expense">{formatKRW(totalDebt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Account List */}
      {accounts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          계좌를 추가해보세요<br />
          <span className="text-sm">은행, 카드, 현금 등을 등록할 수 있어요</span>
        </p>
      ) : (
        grouped.map(group => (
          <div key={group.value}>
            <p className="text-xs text-muted-foreground mb-2">{group.icon} {group.label}</p>
            <div className="space-y-2">
              {group.accounts.map(acc => (
                <Card key={acc.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">{acc.bankName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${acc.type === 'credit_card' ? 'text-expense' : ''}`}>
                        {formatKRW(acc.balance)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(acc)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(acc.id!)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Form Dialog */}
      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editAccount ? '계좌 수정' : '계좌 추가'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">계좌명</label>
                <Input placeholder="급여통장, 생활비카드..." value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">은행/카드사</label>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {Object.values(BANK_PRESETS).slice(0, 9).map(b => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => setBankName(b.name)}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        bankName === b.name ? 'ring-2 ring-primary bg-primary/20' : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {b.icon} {b.name}
                    </button>
                  ))}
                </div>
                <Select value={bankName} onChange={e => setBankName(e.target.value)}>
                  <option value="">선택...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">유형</label>
                <Select value={type} onChange={e => setType(e.target.value as Account['type'])}>
                  {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">잔액 (원)</label>
                <Input type="number" placeholder="0" value={balance} onChange={e => setBalance(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>취소</Button>
                <Button className="flex-1" onClick={handleSave}>저장</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
