import { db, type Account } from '@/db'

const DEFAULT_WALLET_NAME = '기본 지갑'

export async function ensureDefaultWallet(): Promise<number> {
  const existing = await db.accounts.where('name').equals(DEFAULT_WALLET_NAME).first()
  if (existing?.id) return existing.id

  const id = await db.accounts.add({
    name: DEFAULT_WALLET_NAME,
    type: 'cash',
    bankName: '',
    balance: 0,
    color: '#6366f1',
    icon: '💵',
    displayOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Account)
  return id as number
}

export async function getDefaultWalletId(): Promise<number | undefined> {
  const w = await db.accounts.where('name').equals(DEFAULT_WALLET_NAME).first()
  return w?.id
}
