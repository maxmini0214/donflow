import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { db, type Transaction } from '@/db'
import { useCategories, useAccounts } from '@/hooks/useDB'
import { classifyAndGetCategoryId, learnRule } from '@/utils/classifier'
import { Trash2 } from 'lucide-react'

interface Props {
  editId?: number
  onClose: () => void
}

export default function TransactionForm({ editId, onClose }: Props) {
  const categories = useCategories()
  const accounts = useAccounts()

  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [merchantName, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (editId) {
      db.transactions.get(editId).then(tx => {
        if (!tx) return
        setType(tx.type as 'expense' | 'income')
        setAmount(String(tx.amount))
        setMerchant(tx.merchantName)
        setCategoryId(String(tx.categoryId))
        setAccountId(String(tx.accountId))
        setDate(new Date(tx.date).toISOString().split('T')[0])
        setMemo(tx.memo)
      })
    } else {
      if (accounts.length > 0 && !accountId) setAccountId(String(accounts[0].id))
    }
  }, [editId, accounts])

  // Auto-classify on merchant change
  useEffect(() => {
    if (merchantName && !editId) {
      classifyAndGetCategoryId(merchantName).then(id => {
        if (id) setCategoryId(String(id))
      })
    }
  }, [merchantName])

  const handleSave = async () => {
    const amt = parseInt(amount)
    if (!amt || !accountId) return

    const catId = categoryId ? Number(categoryId) : (categories.find(c => c.name === '기타')?.id ?? 1)
    const txData: Omit<Transaction, 'id'> = {
      accountId: Number(accountId),
      amount: amt,
      type,
      categoryId: catId,
      merchantName,
      date: new Date(date),
      memo,
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (editId) {
      await db.transactions.update(editId, { ...txData, updatedAt: new Date() })
    } else {
      await db.transactions.add(txData)
    }

    // Update account balance
    if (!editId) {
      const account = await db.accounts.get(Number(accountId))
      if (account) {
        const delta = type === 'income' ? amt : -amt
        await db.accounts.update(account.id!, { balance: account.balance + delta })
      }
    }

    // Learn merchant rule
    if (merchantName && catId) {
      learnRule(merchantName, catId)
    }

    onClose()
  }

  const handleDelete = async () => {
    if (editId && confirm('이 거래를 삭제하시겠습니까?')) {
      await db.transactions.delete(editId)
      onClose()
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editId ? '거래 수정' : '거래 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              variant={type === 'expense' ? 'default' : 'outline'}
              className={type === 'expense' ? 'bg-expense hover:bg-expense/90 flex-1' : 'flex-1'}
              onClick={() => setType('expense')}
            >
              지출
            </Button>
            <Button
              variant={type === 'income' ? 'default' : 'outline'}
              className={type === 'income' ? 'bg-income hover:bg-income/90 flex-1' : 'flex-1'}
              onClick={() => setType('income')}
            >
              수입
            </Button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-muted-foreground">금액 (원)</label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-2xl font-bold h-14"
              autoFocus
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="text-xs text-muted-foreground">가맹점</label>
            <Input placeholder="스타벅스, 배달의민족..." value={merchantName} onChange={e => setMerchant(e.target.value)} />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-muted-foreground">카테고리</label>
            <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">선택...</option>
              {categories.filter(c => type === 'income' ? c.isIncome : !c.isIncome).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </Select>
          </div>

          {/* Account */}
          <div>
            <label className="text-xs text-muted-foreground">계좌</label>
            <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">선택...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
              ))}
            </Select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-muted-foreground">날짜</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Memo */}
          <div>
            <label className="text-xs text-muted-foreground">메모</label>
            <Input placeholder="메모 (선택)" value={memo} onChange={e => setMemo(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {editId && (
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
            <Button className="flex-1" onClick={handleSave}>저장</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
