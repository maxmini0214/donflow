import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { db } from '@/db'
import { useCategories, useAccounts } from '@/hooks/useDB'
import { ensureDefaultWallet } from '@/lib/defaultWallet'
import { detectChanges } from '@/services/changeDetection'

export default function QuickAdd() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedCat, setSelectedCat] = useState<number | null>(null)
  const [memo, setMemo] = useState('')
  const [accountId, setAccountId] = useState<number | null>(null)
  const [showMore, setShowMore] = useState(false)
  const categories = useCategories()
  const accounts = useAccounts()

  const expenseCategories = categories.filter(c => !c.isIncome)

  const reset = () => {
    setAmount('')
    setSelectedCat(null)
    setMemo('')
    setAccountId(null)
    setShowMore(false)
  }

  const handleSave = async () => {
    const amt = parseInt(amount)
    if (!amt || !selectedCat) return

    const walletId = accountId ?? await ensureDefaultWallet()

    const txData = {
      accountId: walletId,
      amount: amt,
      type: 'expense' as const,
      categoryId: selectedCat,
      merchantName: memo || '',
      date: new Date(),
      memo: memo || '',
      source: 'manual' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.transactions.add(txData)
    detectChanges(txData as any).catch(() => {})

    // Update wallet balance
    const wallet = await db.accounts.get(walletId)
    if (wallet) {
      await db.accounts.update(walletId, { balance: wallet.balance - amt })
    }

    reset()
    setOpen(false)
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Sheet Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => { reset(); setOpen(false) }} />

          {/* Sheet */}
          <div className="relative bg-background rounded-t-2xl p-5 pb-8 max-w-lg mx-auto w-full animate-in slide-in-from-bottom duration-200">
            {/* Handle */}
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

            {/* Close */}
            <button
              onClick={() => { reset(); setOpen(false) }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <p className="text-lg font-semibold mb-4">얼마 썼어?</p>

            <div className="space-y-4">
              {/* Amount */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">₩</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="text-2xl font-bold h-14 pl-10 text-center"
                  autoFocus
                />
              </div>

              {/* Category emoji grid */}
              <div className="grid grid-cols-4 gap-2">
                {expenseCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id!)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all text-center ${
                      selectedCat === cat.id
                        ? 'bg-primary/20 ring-2 ring-primary scale-105'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* More options (collapsed) */}
              <button
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showMore ? '접기' : '메모 · 계좌'}
              </button>

              {showMore && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <Input
                    placeholder="메모 (선택)"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                  />
                  {accounts.length > 0 && (
                    <Select
                      value={accountId ? String(accountId) : ''}
                      onChange={e => setAccountId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">기본 지갑</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </Select>
                  )}
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleSave}
                disabled={!amount || !selectedCat}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
