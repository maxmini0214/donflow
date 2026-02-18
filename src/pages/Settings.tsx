import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/db'
import { useCategories } from '@/hooks/useDB'
import { Download, Upload, Trash2, Plus, AlertTriangle } from 'lucide-react'

export default function Settings() {
  const categories = useCategories()
  const [importFile, setImportFile] = useState<File | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📌')

  // Export all data as JSON
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

    // Save last backup date
    const existing = await db.appSettings.where('key').equals('lastBackup').first()
    if (existing) {
      await db.appSettings.update(existing.id!, { value: new Date().toISOString() })
    } else {
      await db.appSettings.add({ key: 'lastBackup', value: new Date().toISOString() })
    }
  }

  // Import data from JSON
  const handleImport = async () => {
    if (!importFile) return
    if (!confirm('기존 데이터를 모두 덮어씁니다. 계속하시겠습니까?')) return

    const text = await importFile.text()
    const data = JSON.parse(text)

    // Clear existing data
    await Promise.all([
      db.accounts.clear(),
      db.transactions.clear(),
      db.categories.clear(),
      db.budgets.clear(),
      db.salaryAllocations.clear(),
      db.merchantRules.clear(),
    ])

    // Import with date conversion
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

  // Clear all data
  const handleClearAll = async () => {
    if (!confirm('정말 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    if (!confirm('마지막 확인: 모든 데이터가 영구 삭제됩니다.')) return

    await Promise.all([
      db.accounts.clear(),
      db.transactions.clear(),
      db.budgets.clear(),
      db.salaryAllocations.clear(),
      db.merchantRules.clear(),
    ])
    alert('모든 데이터가 삭제되었습니다.')
  }

  // Add custom category
  const handleAddCategory = async () => {
    if (!newCatName) return
    await db.categories.add({
      name: newCatName,
      icon: newCatIcon,
      color: '#6B7280',
      isIncome: false,
      isDefault: false,
      displayOrder: categories.length + 1,
    })
    setNewCatName('')
    setNewCatIcon('📌')
  }

  const handleDeleteCategory = async (id: number, isDefault: boolean) => {
    if (isDefault) return alert('기본 카테고리는 삭제할 수 없습니다.')
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return
    await db.categories.delete(id)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">설정</h2>

      {/* Data Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📦 데이터 백업</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleExport} className="w-full">
            <Download className="w-4 h-4 mr-2" /> JSON 내보내기
          </Button>
          <div className="space-y-2">
            <input
              type="file"
              accept=".json"
              onChange={e => setImportFile(e.target.files?.[0] ?? null)}
              className="text-sm w-full"
            />
            {importFile && (
              <Button variant="outline" onClick={handleImport} className="w-full">
                <Upload className="w-4 h-4 mr-2" /> JSON 복원
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🏷️ 카테고리 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="이모지"
              value={newCatIcon}
              onChange={e => setNewCatIcon(e.target.value)}
              className="w-16 text-center"
            />
            <Input
              placeholder="카테고리명"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1"
            />
            <Button size="icon" onClick={handleAddCategory}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
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

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
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

      {/* App Info */}
      <Card>
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          <p>돈플로우 v1.0.0</p>
          <p className="mt-1">모든 데이터는 브라우저에 저장됩니다</p>
          <p>서버 전송 없음 · 완전 오프라인</p>
        </CardContent>
      </Card>
    </div>
  )
}
