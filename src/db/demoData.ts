import { db } from './index'
import type { Account, Transaction, Category, Budget, MonthlyIncome } from './index'

function getRecentMonths(): [string, string] {
  const now = new Date()
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  return [prevKey, cur]
}

function randomDate(yearMonth: string, preferDay?: number): Date {
  const [y, m] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const day = preferDay ? Math.min(preferDay, daysInMonth) : Math.floor(Math.random() * daysInMonth) + 1
  const hour = Math.floor(Math.random() * 14) + 8
  return new Date(y, m - 1, day, hour, Math.floor(Math.random() * 60))
}

// ─── 카테고리: max의 실제 재정 구조 기반 ───
const DEMO_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '월세', icon: '🏠', color: '#22C55E', isIncome: false, isDefault: false, displayOrder: 1, groupName: '고정비' },
  { name: '통신/구독', icon: '📱', color: '#8B5CF6', isIncome: false, isDefault: false, displayOrder: 2, groupName: '고정비' },
  { name: '교통', icon: '🚌', color: '#EAB308', isIncome: false, isDefault: false, displayOrder: 3, groupName: '고정비' },
  { name: '식비', icon: '🍽️', color: '#EF4444', isIncome: false, isDefault: false, displayOrder: 4, groupName: '생활비' },
  { name: '생필품', icon: '🧴', color: '#14B8A6', isIncome: false, isDefault: false, displayOrder: 5, groupName: '생활비' },
  { name: '의류', icon: '👕', color: '#F97316', isIncome: false, isDefault: false, displayOrder: 6, groupName: '생활비' },
  { name: '데이트', icon: '💕', color: '#EC4899', isIncome: false, isDefault: false, displayOrder: 7, groupName: '생활비' },
  { name: '저축/투자', icon: '🏦', color: '#0EA5E9', isIncome: false, isDefault: false, displayOrder: 8, groupName: '저축' },
  { name: '기타', icon: '📦', color: '#6B7280', isIncome: false, isDefault: false, displayOrder: 9, groupName: '생활비' },
  { name: '급여', icon: '💰', color: '#10B981', isIncome: true, isDefault: false, displayOrder: 10, groupName: '수입' },
]

// ─── 월 예산 배분 (만원 → 원) ───
// 월 수입 250만원 기준
// 고정 82만: 월세(35) + 통신구독(9) + 교통(7) + 식비(21 풀무원)
// 생활비: 생필품(5) + 의류(5) + 데이트(40) + 기타(10)
// 저축: 나머지
const BUDGET_MAP: Record<string, number> = {
  '월세': 350000,
  '통신/구독': 90000,
  '교통': 70000,
  '식비': 300000,
  '생필품': 50000,
  '의류': 50000,
  '데이트': 400000,
  '저축/투자': 1500000,
  '기타': 100000,
}

interface TxTemplate {
  category: string
  merchant: string
  minAmt: number
  maxAmt: number
  fixedDay?: number  // 자동이체 날짜
}

const TX_TEMPLATES: TxTemplate[] = [
  // 고정비
  { category: '월세', merchant: '월세 이체', minAmt: 300000, maxAmt: 350000, fixedDay: 5 },
  { category: '통신/구독', merchant: 'SKT 휴대폰', minAmt: 67140, maxAmt: 67140, fixedDay: 25 },
  { category: '통신/구독', merchant: '네이버플러스 멤버십', minAmt: 4900, maxAmt: 4900, fixedDay: 20 },
  { category: '통신/구독', merchant: '유튜브 프리미엄', minAmt: 14900, maxAmt: 14900, fixedDay: 5 },
  { category: '통신/구독', merchant: '벅스 음악', minAmt: 7590, maxAmt: 7590, fixedDay: 15 },
  { category: '교통', merchant: '버스 출퇴근', minAmt: 2900, maxAmt: 2900 },
  { category: '교통', merchant: '카카오T 바이크', minAmt: 3000, maxAmt: 5000 },

  // 식비
  { category: '식비', merchant: '풀무원 정기배송', minAmt: 210000, maxAmt: 210000, fixedDay: 1 },
  { category: '식비', merchant: '하나마트', minAmt: 8000, maxAmt: 25000 },
  { category: '식비', merchant: '원마트', minAmt: 15000, maxAmt: 50000 },
  { category: '식비', merchant: '삼평마트', minAmt: 10000, maxAmt: 48000 },
  { category: '식비', merchant: '신세계할인마트', minAmt: 5000, maxAmt: 15000 },
  { category: '식비', merchant: '편의점 CU', minAmt: 2000, maxAmt: 8000 },
  { category: '식비', merchant: '배달의민족', minAmt: 15000, maxAmt: 30000 },

  // 생필품
  { category: '생필품', merchant: '다이소', minAmt: 2000, maxAmt: 10000 },
  { category: '생필품', merchant: '올리브영', minAmt: 15000, maxAmt: 35000 },

  // 의류
  { category: '의류', merchant: '유니클로', minAmt: 20000, maxAmt: 60000 },
  { category: '의류', merchant: '무신사', minAmt: 15000, maxAmt: 50000 },

  // 데이트
  { category: '데이트', merchant: '카페', minAmt: 8000, maxAmt: 15000 },
  { category: '데이트', merchant: '영화관 CGV', minAmt: 24000, maxAmt: 30000 },
  { category: '데이트', merchant: '레스토랑', minAmt: 30000, maxAmt: 80000 },
  { category: '데이트', merchant: '편의점 간식', minAmt: 5000, maxAmt: 15000 },

  // 저축/투자
  { category: '저축/투자', merchant: '나무증권 RP 자유약정', minAmt: 500000, maxAmt: 500000, fixedDay: 24 },
  { category: '저축/투자', merchant: '케이뱅크 파킹통장', minAmt: 1000000, maxAmt: 1000000, fixedDay: 26 },

  // 기타
  { category: '기타', merchant: '카카오페이 이체', minAmt: 10000, maxAmt: 30000 },
  { category: '기타', merchant: '모바일이즐 선불', minAmt: 10000, maxAmt: 15000 },
]

function pickAmount(min: number, max: number): number {
  if (min === max) return min
  return Math.round(Math.random() * (max - min) + min)
}

export async function loadDemoData(): Promise<void> {
  await clearDemoData()

  const now = new Date()

  // 1. 계좌 생성
  const accountId = await db.accounts.add({
    name: '직장인우대통장',
    type: 'checking',
    bankName: '하나은행',
    balance: 500000,
    color: '#3B82F6',
    icon: '🏦',
    displayOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  } as Account) as number

  // 2. 카테고리 생성
  const catIds: Record<string, number> = {}
  for (const cat of DEMO_CATEGORIES) {
    const id = await db.categories.add(cat as Category) as number
    catIds[cat.name] = id
  }

  // 3. 2개월 예산 + 거래
  const [prevMonth, curMonth] = getRecentMonths()

  for (const month of [prevMonth, curMonth]) {
    // 예산
    for (const [catName, amount] of Object.entries(BUDGET_MAP)) {
      await db.budgets.add({
        categoryId: catIds[catName],
        amount,
        month,
      } as Budget)
    }

    // 급여 수입
    await db.transactions.add({
      accountId,
      amount: 2500000,
      type: 'income',
      categoryId: catIds['급여'],
      merchantName: '급여 입금',
      date: randomDate(month, 25),
      memo: '월급',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    } as Transaction)

    const isCurrent = month === curMonth
    const txList: Omit<Transaction, 'id'>[] = []

    // 고정 거래 (매월 필수)
    const fixedTx = TX_TEMPLATES.filter(t => t.fixedDay)
    for (const tpl of fixedTx) {
      txList.push({
        accountId,
        amount: pickAmount(tpl.minAmt, tpl.maxAmt),
        type: 'expense',
        categoryId: catIds[tpl.category],
        merchantName: tpl.merchant,
        date: randomDate(month, tpl.fixedDay),
        memo: '',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      })
    }

    // 변동 거래
    const variableTx = TX_TEMPLATES.filter(t => !t.fixedDay)
    const variableCount = isCurrent ? 12 : 18

    // 교통비: 출퇴근 (근무일 기준)
    const workDays = isCurrent ? 12 : 20
    for (let d = 0; d < workDays; d++) {
      txList.push({
        accountId,
        amount: 2900,
        type: 'expense',
        categoryId: catIds['교통'],
        merchantName: '버스 출퇴근',
        date: randomDate(month),
        memo: '',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      })
    }

    // 나머지 변동 거래 랜덤 생성
    const used = new Set<number>()
    let count = 0
    while (count < variableCount) {
      const idx = Math.floor(Math.random() * variableTx.length)
      const tpl = variableTx[idx]
      if (tpl.merchant === '버스 출퇴근') continue // 이미 추가됨

      // 이번 달엔 데이트 좀 과하게
      let amt = pickAmount(tpl.minAmt, tpl.maxAmt)
      if (isCurrent && tpl.category === '데이트') {
        amt = Math.round(amt * 1.3)
      }

      txList.push({
        accountId,
        amount: amt,
        type: 'expense',
        categoryId: catIds[tpl.category],
        merchantName: tpl.merchant,
        date: randomDate(month),
        memo: '',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      })
      count++
    }

    await db.transactions.bulkAdd(txList as Transaction[])
  }

  // 4. 월 수입 기록
  for (const month of [prevMonth, curMonth]) {
    await db.monthlyIncomes.add({ yearMonth: month, amount: 2500000 } as MonthlyIncome)
  }

  // 5. 월급 설정
  await db.appSettings.add({ key: 'monthlySalary', value: '2500000' })

  // 6. 데모 플래그
  await db.appSettings.add({ key: 'isDemoData', value: 'true' })
}

export async function clearDemoData(): Promise<void> {
  await db.transactions.clear()
  await db.budgets.clear()
  await db.accounts.clear()
  await db.categories.clear()
  await db.monthlyIncomes.clear()
  await db.salaryAllocations.clear()
  await db.merchantRules.clear()
  await db.recurringItems.clear()
  await db.changeAlerts.clear()
  await db.insights.clear()

  for (const key of ['isDemoData', 'monthlySalary']) {
    const setting = await db.appSettings.where('key').equals(key).first()
    if (setting?.id) await db.appSettings.delete(setting.id)
  }

  const { seedCategories } = await import('./index')
  await seedCategories()
}

export async function isDemoLoaded(): Promise<boolean> {
  const setting = await db.appSettings.where('key').equals('isDemoData').first()
  return setting?.value === 'true'
}
