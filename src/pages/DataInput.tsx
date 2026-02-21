import { useState, useRef } from 'react'
import { useLanguage, getLang, type TKey } from '@/lib/i18n'
import Papa from 'papaparse'
import { Upload, ClipboardPaste, Sparkles, Check, ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { db } from '@/db'
import { useCategories, useTransactions } from '@/hooks/useDB'
import { classifyMerchant, learnMerchant, isPGMerchant } from '@/utils/merchantClassifier'
import { parseNotifications, type ParsedTransaction } from '@/utils/notificationParser'
import { ensureDefaultWallet } from '@/lib/defaultWallet'
import { formatNumber, getMonthKey } from '@/lib/utils'

type Tab = 'csv' | 'paste' | 'history'

interface ParsedRow {
  date: string
  merchant: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  categoryName: string
  categoryId?: number
  selected: boolean
}

// ─── Banksalad 대분류 → DonFlow category mapping ───
const BANKSALAD_CATEGORY_MAP: Record<string, string> = {
  '식비': '식비',
  '카페/간식': '식비',
  '교통': '교통',
  '생활': '생활',
  '문화/여가': '여가',
  '술/유흥': '여가',
  '온라인쇼핑': '쇼핑',
  '패션/쇼핑': '쇼핑',
  '뷰티/미용': '생활',
  '의료/건강': '의료',
  '주거/통신': '주거',
  '금융': '금융',
  '교육/학습': '교육',
  '여행/숙박': '여가',
  '경조/선물': '기타',
  '자녀/육아': '기타',
  '자동차': '교통',
  '급여': '급여',
  '금융수입': '금융수입',
  '사업수입': '사업수입',
  '앱테크': '급여',
  '용돈': '용돈',
  '저축': '저축',
  '투자': '저축',
  '대출': '기타',
  '미분류': '기타',
  '현금': '기타',
  '내계좌이체': '기타',
  '이체': '기타',
  '카드대금': '기타',
}

const BANKSALAD_SUB_MAP: Record<string, string> = {
  '편의점': '쇼핑',
  '마트': '식비',
  '커피/음료': '카페',
  '아이스크림/빙수': '카페',
  '기타간식': '카페',
  '대중교통': '교통',
  '택시': '교통',
}

function detectTransactionType(row: Record<string, string>, amount: number): 'income' | 'expense' | 'transfer' {
  const typeCol = row['타입']?.trim()
  if (typeCol) {
    if (typeCol === '수입') return 'income'
    if (typeCol === '이체') return 'transfer'
    if (typeCol === '지출') return 'expense'
  }
  const rawAmount = parseFloat(row['금액']?.replace(/[,원\s]/g, '') ?? '0')
  if (rawAmount > 0 && !typeCol) return 'income'
  return 'expense'
}

interface ClassifiedNotif extends ParsedTransaction {
  categoryId?: number
  categoryName: string
}

// ─── Column detection candidates (KO + EN CSV headers) ───
const DATE_COLS = ['이용일시', '이용일', '이용일자', '거래일', '거래일시', '날짜', '일자', '일시', 'date', '결제일', '승인일', '사용일', '거래일자', '승인일시', '매입일', '결제일시', '거래 일시', '결제 일시', '날짜/시간', '시간', '거래시간', 'transaction date', 'posting date', 'trans date', 'trans. date']
const MERCHANT_COLS = ['가맹점', '가맹점명', '이용가맹점', '이용처', '적요', 'merchant', '내용', '사용처', '상호', '상호명', '거래처', '비고', '메모', '이용 내역', '거래내용', '사용처명', '결제처', '사용 내역', '이용 가맹점', '결제내역', '거래처명', '카드사용처', 'description', 'payee', 'name', 'memo', 'details', 'reference']
const AMOUNT_COLS = ['이용금액', '국내이용금액', '결제금액', '거래금액', '금액', 'amount', '결제', '이용금', '출금', '출금액', '승인금액', '지출금액', '사용금액', '결제 금액', '매출금액', '카드결제금액', '출금금액', '지출', '수입', '입금액', 'debit', 'credit', 'charge', 'payment', 'total']

interface DetectedColumns {
  dateCol: string | null
  merchantCol: string | null
  amountCol: string | null
}

function detectColumnsByData(rows: Record<string, string>[]): DetectedColumns {
  const result: DetectedColumns = { dateCol: null, merchantCol: null, amountCol: null }
  if (rows.length === 0) return result

  const headers = Object.keys(rows[0])
  const sampleRows = rows.slice(0, Math.min(5, rows.length))

  for (const col of headers) {
    const samples = sampleRows.map(r => r[col]?.trim()).filter(Boolean)
    if (samples.length === 0) continue

    const dateScore = samples.filter(s =>
      /\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(s) ||
      /\d{2}[-./]\d{1,2}[-./]\d{1,2}/.test(s) ||
      /^\d{8}$/.test(s.replace(/\s/g, ''))
    ).length / samples.length

    const amountScore = samples.filter(s => {
      const cleaned = s.replace(/\s/g, '')
      return /^-?[$€£¥₩]?[\d,]+\.?\d*원?$/.test(cleaned) ||
             /^-?[\d,]+\.?\d*[$€£¥₩원]?$/.test(cleaned) ||
             /^\([\d,]+\.?\d*\)$/.test(cleaned)  // accounting format: (1,234.56)
    }).length / samples.length

    const merchantScore = samples.filter(s => {
      const trimmed = s.trim()
      const isDate = /^\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(trimmed) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(trimmed)
      const isAmount = /^-?[$€£¥₩]?[\d,]+\.?\d*[$€£¥₩원]?$/.test(trimmed.replace(/\s/g, ''))
      const hasText = /[가-힣a-zA-Z]/.test(trimmed)
      return hasText && !isDate && !isAmount && trimmed.length > 1
    }).length / samples.length

    if (dateScore >= 0.8 && !result.dateCol) result.dateCol = col
    else if (amountScore >= 0.8 && !result.amountCol) result.amountCol = col
    else if (merchantScore >= 0.8 && !result.merchantCol) result.merchantCol = col
  }

  return result
}

export default function DataInput() {
  const [tab, setTab] = useState<Tab>('csv')
  const { t } = useLanguage()
  const categories = useCategories()
  const monthKey = getMonthKey(new Date())
  const transactions = useTransactions(monthKey)

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex gap-2">
        {([
          { key: 'csv' as Tab, icon: '📄', label: t('tabCsvUpload') },
          { key: 'paste' as Tab, icon: '📋', label: t('tabNotifPaste') },
          { key: 'history' as Tab, icon: '📜', label: t('tabHistory') },
        ]).map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              tab === item.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {tab === 'csv' && <CsvUpload categories={categories} />}
      {tab === 'paste' && <NotificationPaste categories={categories} />}
      {tab === 'history' && <TransactionList transactions={transactions} categories={categories} />}
    </div>
  )
}

// ─── CSV Guide (collapsible) ───
function CsvGuide() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const lang = getLang()
  const guides = lang === 'ko' ? [
    { name: '토스', steps: t('guideToss') },
    { name: '뱅크샐러드', steps: t('guideBanksalad') },
    { name: '삼성카드', steps: t('guideSamsung') },
    { name: 'KB국민', steps: t('guideKB') },
    { name: '신한', steps: t('guideShinhan') },
    { name: '현대', steps: t('guideHyundai') },
  ] : [
    { name: 'Chase', steps: t('guideToss') },
    { name: 'Amex', steps: t('guideBanksalad') },
    { name: 'Capital One', steps: t('guideSamsung') },
    { name: 'Citi', steps: t('guideKB') },
    { name: 'Wells Fargo', steps: t('guideShinhan') },
    { name: 'Any Bank', steps: t('guideHyundai') },
  ]

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-secondary/50 transition-colors"
      >
        <span>{t('csvGuideTitle')}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-border/30 pt-2.5">
          {guides.map(g => (
            <div key={g.name} className="flex gap-2 text-xs">
              <span className="font-semibold text-foreground shrink-0 w-16">{g.name}</span>
              <span className="text-muted-foreground">{g.steps}</span>
            </div>
          ))}
          <p className="text-xs text-primary font-medium pt-1">{t('csvGuideSupport')}</p>
        </div>
      )}
    </div>
  )
}

// ─── CSV Preview Table ───
function CsvPreview({ rows }: { rows: ParsedRow[] }) {
  const preview = rows.slice(0, 5)
  const { t } = useLanguage()
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="px-3 py-2 bg-secondary/30 text-xs font-medium text-muted-foreground">
        {t('previewLabel')} ({Math.min(5, rows.length)}/{rows.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30 bg-secondary/20">
              <th className="px-3 py-1.5 text-left font-medium">{t('date')}</th>
              <th className="px-3 py-1.5 text-left font-medium">{t('merchant')}</th>
              <th className="px-3 py-1.5 text-right font-medium">{t('amount')}</th>
              <th className="px-3 py-1.5 text-center font-medium">{t('type')}</th>
              <th className="px-3 py-1.5 text-left font-medium">{t('autoClassify')}</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i) => (
              <tr key={i} className="border-b border-border/20 last:border-0">
                <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">{r.date}</td>
                <td className="px-3 py-1.5 truncate max-w-[120px]">{r.merchant || '-'}</td>
                <td className={`px-3 py-1.5 text-right font-medium ${r.type === 'income' ? 'text-income' : r.type === 'transfer' ? 'text-muted-foreground' : 'text-expense'}`}>
                  {r.type === 'income' ? '+' : r.type === 'transfer' ? '↔' : '-'}{formatNumber(r.amount)}{t('won')}
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    r.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    r.type === 'transfer' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>{r.type === 'income' ? t('incomeType') : r.type === 'transfer' ? t('transferType') : t('expenseType')}</span>
                </td>
                <td className="px-3 py-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">{r.categoryName}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── CSV Upload ───
function CsvUpload({ categories }: { categories: ReturnType<typeof useCategories> }) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [autoDetectMsg, setAutoDetectMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  const parseRows = async (
    data: Record<string, string>[],
    dateCandidates: string[],
    merchantCandidates: string[],
    amountCandidates: string[],
  ): Promise<ParsedRow[]> => {
    const parsed: ParsedRow[] = []
    const hasBanksaladCols = data.length > 0 && ('대분류' in data[0]) && ('타입' in data[0])

    for (const row of data) {
      const dateCol = findCol(row, dateCandidates)
      const merchantCol = findCol(row, merchantCandidates)
      const amountCol = findCol(row, amountCandidates)
      if (!dateCol || !amountCol) continue

      const dateVal = row[dateCol]?.trim()
      const merchant = row[merchantCol ?? '']?.trim() ?? ''
      const amountStr = row[amountCol]?.replace(/[$€£¥₩,원\s()]/g, '')
      const amount = Math.abs(parseFloat(amountStr ?? '0'))
      if (!amount || !dateVal) continue

      const txType = hasBanksaladCols ? detectTransactionType(row, amount) : 'expense'

      let categoryName = getLang() === 'ko' ? '기타' : 'Other'
      let categoryId: number | undefined
      if (hasBanksaladCols && row['대분류']) {
        const subCat = row['소분류']?.trim()
        const subMapped = subCat ? BANKSALAD_SUB_MAP[subCat] : undefined
        const mappedName = subMapped ?? BANKSALAD_CATEGORY_MAP[row['대분류'].trim()]
        if (mappedName) {
          const cat = await db.categories.where('name').equals(mappedName).first()
          categoryName = mappedName
          categoryId = cat?.id
        }
      }
      if (!categoryId || categoryName === '기타') {
        const classified = await classifyMerchant(merchant)
        if (classified.categoryId && classified.categoryName !== '기타') {
          categoryName = classified.categoryName
          categoryId = classified.categoryId
        } else if (categoryId) {
          // Keep the banksalad mapping
        } else {
          categoryName = classified.categoryName
          categoryId = classified.categoryId
        }
      }

      parsed.push({
        date: normalizeDate(dateVal),
        merchant,
        amount,
        type: txType,
        categoryName,
        categoryId,
        selected: txType !== 'transfer',
      })
    }
    return parsed
  }

  const processData = async (data: Record<string, string>[]) => {
    if (data.length === 0) return
    setAutoDetectMsg(null)
    setParseError(null)

    const parsed = await parseRows(data, DATE_COLS, MERCHANT_COLS, AMOUNT_COLS)

    if (parsed.length > 0) {
      setRows(parsed)
      return
    }

    const detected = detectColumnsByData(data)
    if (detected.dateCol && detected.amountCol) {
      const dateCols = [detected.dateCol]
      const merchantCols = detected.merchantCol ? [detected.merchantCol] : []
      const amountCols = [detected.amountCol]
      const patternParsed = await parseRows(data, dateCols, merchantCols, amountCols)

      if (patternParsed.length > 0) {
        setAutoDetectMsg(`${t('autoDetected')} ${t('dateCol')}=${detected.dateCol}, ${t('merchantCol')}=${detected.merchantCol ?? t('none')}, ${t('amountCol')}=${detected.amountCol}`)
        setRows(patternParsed)
        return
      }
    }

    setParseError(t('unrecognizedFormat'))
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      // Try each sheet until one parses successfully
      let parsed = false
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '', raw: false })
        if (jsonData.length === 0) continue
        // Check if this sheet has recognizable columns
        const keys = Object.keys(jsonData[0] || {})
        const hasDate = keys.some(k => DATE_COLS.includes(k))
        const hasAmount = keys.some(k => AMOUNT_COLS.includes(k))
        if (hasDate && hasAmount) {
          await processData(jsonData)
          parsed = true
          break
        }
      }
      if (!parsed) {
        // Fallback: try first sheet anyway
        const ws = wb.Sheets[wb.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '', raw: false })
        await processData(jsonData)
      }
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: async (results) => {
          await processData(results.data as Record<string, string>[])
        }
      })
    }
  }

  const handleImport = async () => {
    setImporting(true)
    const walletId = await ensureDefaultWallet()
    const selected = rows.filter(r => r.selected)
    const defaultCatId = categories.find(c => c.name === '기타')?.id ?? 1

    for (const row of selected) {
      const csvHash = `${row.date}-${row.amount}-${row.merchant}`
      const exists = await db.transactions.where('csvHash').equals(csvHash).count()
      if (exists > 0) continue

      await db.transactions.add({
        accountId: walletId,
        amount: row.amount,
        type: row.type,
        categoryId: row.categoryId ?? defaultCatId,
        merchantName: row.merchant,
        date: new Date(row.date),
        memo: row.type === 'transfer' ? t('transferMemo') : '',
        source: 'csv',
        csvHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    setDone(true)
    setImporting(false)
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <Check className="w-12 h-12 text-income mx-auto mb-3" />
        <p className="font-medium">{t('importComplete')}</p>
        <p className="text-sm text-muted-foreground mt-1">{rows.filter(r => r.selected).length} {t('savedCount')}</p>
        <Button className="mt-4" onClick={() => { setDone(false); setRows([]); setParseError(null); setAutoDetectMsg(null) }}>
          {t('uploadMore')}
        </Button>
      </div>
    )
  }

  if (rows.length > 0) {
    return (
      <div className="space-y-4">
        {autoDetectMsg && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-2.5">
            <p className="text-xs font-medium text-green-600">{autoDetectMsg}</p>
          </div>
        )}
        <CsvPreview rows={rows} />

        <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
          <span>{rows.length} {t('detected')}</span>
          <span className="text-expense">{t('expenseType')} {rows.filter(r => r.type === 'expense').length}</span>
          <span className="text-income">{t('incomeType')} {rows.filter(r => r.type === 'income').length}</span>
          <span>{t('transferType')} {rows.filter(r => r.type === 'transfer').length}</span>
          <span className="text-xs">({t('transferExcluded')})</span>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {rows.map((row, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-sm ${row.selected ? '' : 'opacity-40'}`}>
              <input type="checkbox" checked={row.selected} onChange={() => {
                const newRows = [...rows]
                newRows[i].selected = !newRows[i].selected
                setRows(newRows)
              }} />
              <span className="text-xs text-muted-foreground w-20">{row.date}</span>
              <span className="flex-1 truncate">{row.merchant}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-secondary">{row.categoryName}</span>
              <span className={`font-medium ${row.type === 'income' ? 'text-income' : row.type === 'transfer' ? 'text-muted-foreground' : ''}`}>
                {row.type === 'income' ? '+' : row.type === 'transfer' ? '↔' : ''}{formatNumber(row.amount)}{t('won')}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setRows([])}>{t('reselect')}</Button>
          <Button className="flex-1" onClick={handleImport} disabled={importing}>
            {importing ? t('importing') : `${rows.filter(r => r.selected).length} ${t('importCount')}`}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CsvGuide />

      {parseError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-600">{parseError}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('supportedApps')}</p>
        </div>
      )}

      <div
        className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">{t('uploadCsvExcel')}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {t('supportedApps')}
        </p>
      </div>
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ─── Notification Paste ───
function NotificationPaste({ categories }: { categories: ReturnType<typeof useCategories> }) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ClassifiedNotif[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const expenseCategories = categories.filter(c => !c.isIncome)
  const { t } = useLanguage()

  const handleParse = async () => {
    const results = parseNotifications(text)
    const classified: ClassifiedNotif[] = await Promise.all(
      results.map(async r => {
        const cls = await classifyMerchant(r.merchantName)
        return { ...r, categoryId: cls.categoryId, categoryName: cls.categoryName }
      })
    )
    setParsed(classified)
  }

  const handleCategoryChange = (index: number, catId: number) => {
    setParsed(prev => prev.map((item, i) => {
      if (i !== index) return item
      const cat = categories.find(c => c.id === catId)
      return { ...item, categoryId: catId, categoryName: cat?.name ?? t('uncategorized') }
    }))
  }

  const handleSave = async () => {
    if (parsed.length === 0) return
    setSaving(true)
    const walletId = await ensureDefaultWallet()
    const defaultCatId = categories.find(c => c.name === (getLang() === 'ko' ? '기타' : 'Other'))?.id ?? categories.find(c => c.name === 'Other')?.id ?? categories.find(c => c.name === '기타')?.id ?? 1

    for (const item of parsed) {
      const catId = item.categoryId ?? defaultCatId
      if (item.merchantName && catId) {
        await learnMerchant(item.merchantName, catId)
      }
      await db.transactions.add({
        accountId: walletId,
        amount: item.amount,
        type: 'expense',
        categoryId: catId,
        merchantName: item.merchantName,
        date: item.date,
        memo: `[${item.cardCompany}${t('cardSuffix')}]`,
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => { setParsed([]); setText(''); setSaved(false) }, 1500)
  }

  if (saved) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl">✅</span>
        <p className="text-sm font-medium mt-3">{t('saveComplete')}</p>
      </div>
    )
  }

  if (parsed.length > 0) {
    const total = parsed.reduce((s, p) => s + p.amount, 0)
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">{parsed.length} {t('items')} · {t('total')} {formatNumber(total)}{t('won')}</p>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {parsed.map((item, i) => {
            const catObj = categories.find(c => c.id === item.categoryId)
            return (
              <div key={i} className="bg-secondary/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{catObj?.icon ?? '📌'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.merchantName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.cardCompany} · {item.date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-expense">-{formatNumber(item.amount)}{t('won')}</span>
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
              </div>
            )
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setParsed([])}>{t('back')}</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : `${parsed.length} ${t('saveCount')}`}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={`${t('pasteNotifications')}\n\n${t('pasteExample')}`}
        className="w-full h-40 rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
        autoFocus
      />
      <Button className="w-full h-11 text-sm font-semibold gap-2" onClick={handleParse} disabled={!text.trim()}>
        <Sparkles className="w-4 h-4" /> {t('parse')}
      </Button>
    </div>
  )
}

// ─── Transaction List ───
function TransactionList({
  transactions,
  categories,
}: {
  transactions: ReturnType<typeof useTransactions>
  categories: ReturnType<typeof useCategories>
}) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCatId, setEditCatId] = useState('')
  const [editMemo, setEditMemo] = useState('')
  const expenseCategories = categories.filter(c => !c.isIncome)
  const { t } = useLanguage()

  const etcCat = categories.find(c => c.name === '기타')

  // Identify unclassified transactions: PG merchants OR category is "기타" with PG name
  const isUnclassified = (tx: typeof transactions[0]) => {
    const isPG = isPGMerchant(tx.merchantName)
    const isEtc = tx.categoryId === etcCat?.id
    return isPG && isEtc
  }

  const filtered = transactions.filter(tx => {
    if (!search) return true
    return tx.merchantName?.toLowerCase().includes(search.toLowerCase())
  })

  // Sort: unclassified first
  const sorted = [...filtered].sort((a, b) => {
    const aUn = isUnclassified(a) ? 0 : 1
    const bUn = isUnclassified(b) ? 0 : 1
    if (aUn !== bUn) return aUn - bUn
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const unclassifiedCount = filtered.filter(isUnclassified).length
  const visible = showAll ? sorted : sorted.slice(0, 20)

  const saveClassification = async (txId: number) => {
    if (!editCatId) return
    const catId = Number(editCatId)
    const tx = await db.transactions.get(txId)
    if (!tx) return

    const newMerchantName = editMemo.trim() || tx.merchantName
    await db.transactions.update(txId, {
      categoryId: catId,
      merchantName: newMerchantName,
      updatedAt: new Date(),
    })

    // Learn the rule with amount for PG merchants
    if (tx.merchantName) {
      await learnMerchant(tx.merchantName, catId, {
        amount: tx.amount,
        userLabel: editMemo.trim() || undefined,
      })
    }

    setEditingId(null)
    setEditCatId('')
    setEditMemo('')
  }

  const saveCategory = async (txId: number) => {
    if (!editCatId) return
    await db.transactions.update(txId, { categoryId: Number(editCatId), updatedAt: new Date() })
    const tx = await db.transactions.get(txId)
    if (tx?.merchantName) {
      await learnMerchant(tx.merchantName, Number(editCatId))
    }
    setEditingId(null)
    setEditCatId('')
    setEditMemo('')
  }

  return (
    <div className="space-y-3">
      {/* Unclassified banner */}
      {unclassifiedCount > 0 && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 flex items-center gap-2">
          <span className="text-lg">❓</span>
          <div>
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              {unclassifiedCount}{t('unclassifiedCount')}
            </p>
            <p className="text-xs text-yellow-600/80 dark:text-yellow-500/80">{t('unclassifiedHint')}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">{t('noTransactions')}</p>
      ) : (
        <div className="space-y-1">
          {visible.map(tx => {
            const cat = categories.find(c => c.id === tx.categoryId)
            const dateStr = new Date(tx.date).toLocaleDateString(getLang() === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })
            const isEditing = editingId === tx.id
            const unclassified = isUnclassified(tx)

            return (
              <div key={tx.id} className={`py-2.5 border-b border-border/50 last:border-0 ${unclassified ? 'bg-yellow-500/5 rounded-lg px-2 -mx-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        if (isEditing) { setEditingId(null); setEditMemo(''); return }
                        setEditingId(tx.id!); setEditCatId(String(tx.categoryId)); setEditMemo('')
                      }}
                      className="text-lg hover:scale-110 transition-transform"
                      title={t('changeCategory')}
                    >
                      {cat?.icon ?? '📌'}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{tx.merchantName || cat?.name || t('transaction')}</p>
                        {unclassified && !isEditing && (
                          <span
                            className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-semibold cursor-pointer hover:bg-yellow-400/30 transition-colors"
                            onClick={() => { setEditingId(tx.id!); setEditCatId(String(tx.categoryId)); setEditMemo('') }}
                          >
                            ❓ {t('whatWasThis')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{dateStr} · {tx.source === 'csv' ? 'CSV' : t('manual')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}{t('won')}
                  </span>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <div className="mt-2 ml-9 space-y-2">
                    {unclassified && (
                      <Input
                        placeholder={t('whatWasThisPlaceholder')}
                        value={editMemo}
                        onChange={e => setEditMemo(e.target.value)}
                        className="h-8 text-xs"
                        autoFocus
                      />
                    )}
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={editCatId}
                        onChange={e => setEditCatId(e.target.value)}
                        className="h-8 text-xs flex-1"
                      >
                        {expenseCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        className="h-8 text-xs px-3"
                        onClick={() => unclassified ? saveClassification(tx.id!) : saveCategory(tx.id!)}
                      >
                        {t('save')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > 20 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto transition-colors"
        >
          {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showAll ? t('collapse') : `${t('showMore')} (${filtered.length - 20})`}
        </button>
      )}
    </div>
  )
}

// ─── Helpers ───
function findCol(row: Record<string, string>, candidates: string[]): string | null {
  for (const c of candidates) {
    if (c in row) return c
  }
  for (const key of Object.keys(row)) {
    for (const c of candidates) {
      if (key.includes(c)) return key
    }
  }
  return null
}

function normalizeDate(d: string): string {
  const dateOnly = d.trim().split(/[\sT]/)[0]
  const cleaned = dateOnly.replace(/[년월]/g, '-').replace(/[일]/g, '').replace(/\//g, '-')
  const parts = cleaned.split('-').filter(Boolean)
  if (parts.length >= 3) {
    const y = parts[0].length === 2 ? '20' + parts[0] : parts[0]
    return `${y}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }
  return dateOnly
}
