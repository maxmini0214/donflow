import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { db } from '@/db'

const STEPS = [
  {
    emoji: '👋',
    title: '돈플로우에 오신 걸 환영해요!',
    desc: '3단계만 거치면 바로 시작할 수 있어요.',
  },
  {
    emoji: '💳',
    title: '주로 쓰는 카드/계좌 하나만\n등록해보세요',
    desc: '나중에 해도 돼요. 없으면 기본 지갑이 자동으로 만들어져요.',
    action: '계좌 등록하러 가기',
    actionPath: '/accounts',
  },
  {
    emoji: '✏️',
    title: '오늘 쓴 거 하나\n입력해보세요',
    desc: '금액이랑 카테고리만 고르면 끝!',
    action: '거래 입력하기',
    actionPath: '/transactions',
  },
  {
    emoji: '🎉',
    title: '끝! 대시보드에서\n확인하세요',
    desc: '이제 돈플로우가 알아서 정리해드릴게요.',
  },
]

export default function Onboarding() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    db.appSettings.where('key').equals('onboardingDone').first().then(s => {
      if (!s) setShow(true)
    })
  }, [])

  const dismiss = async () => {
    setShow(false)
    await db.appSettings.add({ key: 'onboardingDone', value: 'true' })
  }

  if (!show) return null

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <Dialog open onOpenChange={dismiss}>
      <DialogContent className="max-w-sm text-center">
        <div className="py-4 space-y-4">
          <div className="text-5xl">{s.emoji}</div>
          <h2 className="text-lg font-bold whitespace-pre-line">{s.title}</h2>
          <p className="text-sm text-muted-foreground">{s.desc}</p>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 py-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={dismiss}>
              건너뛰기
            </Button>
            {isLast ? (
              <Button className="flex-1" onClick={dismiss}>
                시작하기 🚀
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => setStep(s => s + 1)}>
                다음
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
