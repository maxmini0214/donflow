import { useState, useEffect } from 'react'
import { ClipboardPaste, Sparkles, Save, Trash2, X, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { db } from '@/db'
import { useCategories, useAccounts } from '@/hooks/useDB'
import { ensureDefaultWallet } from '@/lib/defaultWallet'
import { parseNotifications, type ParsedTransaction } from '@/utils/notificationParser'
import { classifyMerchant, learnMerchant } from '@/utils/merchantClassifier'
import { detectChanges } from '@/services/changeDetection'

interface ClassifiedTransaction extends ParsedTransaction {
  categoryId?: number
  categoryName: string
  confidence: number
}

export default function NotificationPaste() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ClassifiedTransaction[]>([])
  const [accountId, setAccountId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const categories = useCategories()
  const accounts = useAccounts()
  const expenseCategories = categories.filter(c => !c.isIncome)

  const handleParse = async () => {
    const results = parseNotifications(text)
    const classified: ClassifiedTransaction[] = await Promise.all(
      results.map(async (r) => {
        const cls = await classifyMerchant(r.merchantName)
        return { ...r, categoryId: cls.categoryId, categoryName: cls.categoryName, confidence: cls.confidence }
      })
    )
    setParsed(classified)
  }

  const handleCategoryChange = (index: number, catId: number) => {
    setParsed(prev => prev.map((item, i) => {
      if (i !== index) return item
      const cat = categories.find(c => c.id === catId)
      return { ...item, categoryId: catId, categoryName: cat?.name ?? '기타', confidence: 1.0 }
    }))
  }

  const handleRemove = (index: number) => {
    setParsed(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (parsed.length === 0) return
    setSaving(true)
    try {
      const walletId = accountId ?? await ensureDefaultWallet()

      for (const item of parsed) {
        const catId = item.categoryId ?? (await db.categories.where('name').equals('기타').first())?.id ?? 1

        // Learn if user changed category (confidence < 1 originally or user modified)
        if (item.confidence < 1.0 || item.categoryName !== '기타') {
          await learnMerchant(item.merchantName, catId)
        }

        const txData = {
          accountId: walletId,
          amount: item.amount,
          type: 'expense' as const,
          categoryId: catId,
          merchantName: item.merchantName,
          date: item.date,
          memo: `[${item.cardCompany}카드] ${item.merchantName}`,
          source: 'manual' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.transactions.add(txData)
        detectChanges(txData as any).catch(() => {})

        const wallet = await db.accounts.get(walletId)
        if (wallet) {
          await db.accounts.update(walletId, { balance: wallet.balance - item.amount })
        }
      }

      setSaved(true)
      setTimeout(() => {
        setParsed([])
        setText('')
        setSaved(false)
        setOpen(false)
      }, 1200)
    } finally {
      setSaving(false)
    }
  }

  const totalAmount = parsed.reduce((sum, p) => sum + p.amount, 0)

  return (
    <>
      {/* Button - positioned above FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-20 z-40 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-500 active:scale-95 transition-all"
        title="카드 알림 붙여넣기"
      >
        <CreditCard className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setOpen(false); setParsed([]); setText('') }} />

          <div className="relative bg-background rounded-t-2xl p-5 pb-8 max-w-lg mx-auto w-full animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

            <button
              onClick={() => { setOpen(false); setParsed([]); setText('') }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ClipboardPaste className="w-5 h-5 text-indigo-400" />
              <p className="text-lg font-semibold">카드 알림 붙여넣기</p>
            </div>

            {/* Input phase */}
            {parsed.length === 0 && !saved && (
              <div className="space-y-3">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={`카드 결제 알림을 붙여넣으세요\n\n예시:\n[삼성카드] 15,800원 스타벅스 판교점 02/18 14:23\n[KB국민카드] 32,000원 쿠팡 02/18 09:11`}
                  className="w-full h-40 rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-muted-foreground/60"
                  autoFocus
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

                <Button
                  className="w-full h-11 text-sm font-semibold gap-2"
                  onClick={handleParse}
                  disabled={!text.trim()}
                >
                  <Sparkles className="w-4 h-4" />
                  파싱하기
                </Button>
              </div>
            )}

            {/* Results phase */}
            {parsed.length > 0 && !saved && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {parsed.length}건 · 총 {totalAmount.toLocaleString()}원
                </p>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {parsed.map((item, i) => {
                    const catObj = categories.find(c => c.id === item.categoryId)
                    return (
                      <div key={i} className="bg-secondary/60 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">{catObj?.icon ?? '📌'}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{item.merchantName}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {item.cardCompany} · {item.date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {item.date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-red-400">-{item.amount.toLocaleString()}원</span>
                            <button onClick={() => handleRemove(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <Select
                          value={item.categoryId ? String(item.categoryId) : ''}
                          onChange={e => handleCategoryChange(i, Number(e.target.value))}
                          className="h-8 text-xs"
                        >
                          {expenseCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                          ))}
                        </Select>

                        {item.confidence < 0.5 && (
                          <p className="text-[10px] text-amber-400">⚠️ 자동 분류 실패 — 카테고리를 선택해주세요</p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 text-sm"
                    onClick={() => setParsed([])}
                  >
                    뒤로
                  </Button>
                  <Button
                    className="flex-1 h-11 text-sm font-semibold gap-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? '저장 중...' : `${parsed.length}건 저장`}
                  </Button>
                </div>
              </div>
            )}

            {/* Success */}
            {saved && (
              <div className="flex flex-col items-center gap-3 py-8">
                <span className="text-4xl">✅</span>
                <p className="text-sm font-medium">저장 완료!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
