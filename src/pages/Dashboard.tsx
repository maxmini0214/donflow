import { useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMonthlyStats, useCategoryStats, useCategories, useAccounts } from '@/hooks/useDB'
import { formatKRW, formatNumber, getMonthKey } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [monthOffset, setMonthOffset] = useState(0)
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthKey = getMonthKey(targetDate)
  const monthLabel = `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`

  const { income, expense, savings, transactions } = useMonthlyStats(monthKey)
  const categoryStats = useCategoryStats(monthKey)
  const categories = useCategories()
  const accounts = useAccounts()
  const navigate = useNavigate()

  const recentTransactions = transactions.slice(0, 5)
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-4">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m - 1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <Button variant="ghost" size="icon" onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-income mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">수입</p>
            <p className="text-sm font-bold text-income">{formatNumber(income)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-5 h-5 text-expense mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">지출</p>
            <p className="text-sm font-bold text-expense">{formatNumber(expense)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="w-5 h-5 text-savings mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">순저축</p>
            <p className={`text-sm font-bold ${savings >= 0 ? 'text-savings' : 'text-expense'}`}>
              {formatNumber(savings)}원
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Total Balance */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">총 자산</p>
          <p className="text-2xl font-bold">{formatKRW(totalBalance)}</p>
        </CardContent>
      </Card>

      {/* Category Pie Chart */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">카테고리별 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryStats.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatKRW(value)}
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid #27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#fafafa' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categoryStats.slice(0, 6).map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted-foreground">{cat.icon} {cat.name}</span>
                  <span className="ml-auto font-medium">{formatNumber(cat.value)}원</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base">최근 거래</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>전체보기</Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              거래 내역이 없습니다.<br />
              <Button variant="link" className="mt-2" onClick={() => navigate('/transactions')}>
                첫 거래를 추가해보세요 →
              </Button>
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => {
                const cat = categories.find(c => c.id === tx.categoryId)
                return (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat?.icon ?? '📌'}</span>
                      <div>
                        <p className="text-sm font-medium">{tx.merchantName || cat?.name || '거래'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}원
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
