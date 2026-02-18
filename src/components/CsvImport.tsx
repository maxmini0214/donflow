import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { db } from '@/db'
import { useAccounts, useCategories } from '@/hooks/useDB'
import { classifyMerchant } from '@/utils/classifier'
import { formatNumber } from '@/lib/utils'
import { Upload, Check } from 'lucide-react'

interface ParsedRow {
  date: string
  merchant: string
  amount: number
  categoryName: string
  categoryId?: number
  selected: boolean
}

interface Props {
  onClose: () => void
}

export default function CsvImport({ onClose }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [accountId, setAccountId] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const accounts = useAccounts()
  const categories = useCategories()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (results) => {
        const parsed: ParsedRow[] = []
        for (const row of results.data as Record<string, string>[]) {
          // Try to detect columns flexibly
          const dateCol = findCol(row, ['이용일시', '이용일', '이용일자', '거래일', '거래일시', '날짜', 'date'])
          const merchantCol = findCol(row, ['가맹점', '가맹점명', '이용가맹점', '이용처', '적요', 'merchant', '내용'])
          const amountCol = findCol(row, ['이용금액', '국내이용금액', '결제금액', '거래금액', '금액', 'amount'])

          if (!dateCol || !amountCol) continue

          const dateVal = row[dateCol]?.trim()
          const merchant = row[merchantCol ?? '']?.trim() ?? ''
          const amountStr = row[amountCol]?.replace(/[,원\s]/g, '')
          const amount = Math.abs(parseInt(amountStr ?? '0'))
          if (!amount || !dateVal) continue

          const { categoryName } = await classifyMerchant(merchant)
          const cat = categories.find(c => c.name === categoryName)

          parsed.push({
            date: normalizeDate(dateVal),
            merchant,
            amount,
            categoryName,
            categoryId: cat?.id,
            selected: true,
          })
        }
        setRows(parsed)
      }
    })
  }

  const handleImport = async () => {
    if (!accountId) return
    setImporting(true)

    const selected = rows.filter(r => r.selected)
    const defaultCatId = categories.find(c => c.name === '기타')?.id ?? 1

    for (const row of selected) {
      const csvHash = `${row.date}-${row.amount}-${row.merchant}`
      const exists = await db.transactions.where('csvHash').equals(csvHash).count()
      if (exists > 0) continue

      await db.transactions.add({
        accountId: Number(accountId),
        amount: row.amount,
        type: 'expense',
        categoryId: row.categoryId ?? defaultCatId,
        merchantName: row.merchant,
        date: new Date(row.date),
        memo: '',
        source: 'csv',
        csvHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    setDone(true)
    setImporting(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CSV 임포트</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-income mx-auto mb-3" />
            <p className="font-medium">임포트 완료!</p>
            <p className="text-sm text-muted-foreground mt-1">{rows.filter(r => r.selected).length}건 저장됨</p>
            <Button className="mt-4" onClick={onClose}>닫기</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">임포트할 계좌</label>
              <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
                <option value="">선택...</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </Select>
            </div>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">CSV 파일을 선택하세요</p>
              <p className="text-xs text-muted-foreground mt-1">신한/삼성/국민/현대카드 지원</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{rows.length}건 감지됨</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {rows.map((row, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded text-sm ${row.selected ? '' : 'opacity-40'}`}>
                  <input type="checkbox" checked={row.selected} onChange={() => {
                    const newRows = [...rows]
                    newRows[i].selected = !newRows[i].selected
                    setRows(newRows)
                  }} />
                  <span className="text-xs text-muted-foreground w-16">{row.date}</span>
                  <span className="flex-1 truncate">{row.merchant}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary">{row.categoryName}</span>
                  <span className="font-medium">{formatNumber(row.amount)}원</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRows([])}>다시 선택</Button>
              <Button className="flex-1" onClick={handleImport} disabled={importing}>
                {importing ? '가져오는 중...' : `${rows.filter(r => r.selected).length}건 임포트`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function findCol(row: Record<string, string>, candidates: string[]): string | null {
  for (const c of candidates) {
    if (c in row) return c
  }
  // Partial match
  for (const key of Object.keys(row)) {
    for (const c of candidates) {
      if (key.includes(c)) return key
    }
  }
  return null
}

function normalizeDate(d: string): string {
  // Handle various Korean date formats
  const cleaned = d.replace(/[년월]/g, '-').replace(/[일\s]/g, '').replace(/\//g, '-')
  const parts = cleaned.split('-').filter(Boolean)
  if (parts.length >= 3) {
    const y = parts[0].length === 2 ? '20' + parts[0] : parts[0]
    return `${y}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }
  return d
}
