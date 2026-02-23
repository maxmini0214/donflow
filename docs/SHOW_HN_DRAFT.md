# Show HN Draft — DonFlow

## Title (max 80 chars)
Show HN: DonFlow – See where your budget plan and reality diverge (browser-only)

> 79자. 대안: "Show HN: DonFlow – Plan vs. reality budget tracker, 100% in your browser" (73자)

## URL
https://maxmini0214.github.io/donflow/?demo

> 💡 ?demo URL 사용 — 클릭 즉시 데모 데이터로 풀 체험 가능

## Text (HN 본문) — COMPRESSED v2

Every few months I'd make a new budget spreadsheet. It looked great for two weeks, then life happened and the plan froze. Fixing a spreadsheet is tedious enough that most people just don't.

DonFlow shows you where you're drifting. Upload bank statements (CSV/XLSX), see plan-vs-actual per category, get drift warnings when spending diverges from your plan.

Zero network requests, no account, no AI, no server. All data in IndexedDB — open DevTools Network tab to verify. MIT licensed.

Try the demo (loads sample data): https://maxmini0214.github.io/donflow/?demo

Source: https://github.com/maxmini0214/donflow

> **📏 5줄. Shuru(41pts)와 같은 밀도. 기술 디테일은 전부 maker comment로.**

<details>
<summary>이전 긴 버전 (보관용)</summary>

Every few months I'd make a new budget spreadsheet. Income targets, category splits, savings goals — it looked great for two weeks. Then life happened, the plan froze, and three months later plan and reality had completely diverged. Fixing a spreadsheet is tedious enough that most people just don't.

DonFlow shows you exactly where you're drifting. Set a budget structure, upload bank/card statements (CSV or XLSX from any bank), and see plan-vs-actual progress bars per category. When spending exceeds your plan, you get drift warnings. A what-if simulator lets you test changes before committing.

Architecture decisions:

- **Zero network requests** — all data stays in IndexedDB. Open DevTools → Network tab → use it for an hour → zero requests. Not a marketing claim — it's architectural.
- **No account** — no signup, no login, no email. Open the URL and start.
- **No AI** — your finances don't need GPT. They need math and good UX.
- **No server** — GitHub Pages serves static assets. There is nothing running. Fork the repo and self-host on any static server.

Built with React, TypeScript, Dexie.js, SheetJS. MIT licensed.

Supports 14+ card statement formats ($, €, £, ¥, ₩), auto-detects columns, handles accounting notation.

Try the demo: https://maxmini0214.github.io/donflow/?demo (loads sample data, no setup needed)

Source: https://github.com/maxmini0214/donflow
</details>

---

## 체크리스트 (Show HN 전)

### 필수 ✅
- [x] ?demo 모드 (원클릭 체험)
- [x] README 감정적 훅 (Micasa 패턴)
- [x] Data Portability 섹션
- [x] Architecture 다이어그램
- [x] "Why Not X?" 비교표
- [x] SEO 키워드 섹션
- [x] Dev.to 글 발행 (크로스 링크)
- [x] OG 태그 + 소셜 이미지

### 미완 ❌
- [x] Cover image for Dev.to 글 ✅ (main_image API로 OG 이미지 반영 완료)
- [x] 모바일 반응형 검증 ✅ (2/23 07:45 — openclaw 브라우저에서 390x844 확인, 깨짐 없음)
- [ ] GitHub Actions CI (PAT workflow scope 필요 → max에게 요청)
- [x] VitePress docs 배포 ✅ (2/23 02:17 — public/docs/에 빌드, 7페이지 전부 라이브)

### 타이밍
- **최적 시간**: 화~목 오전 9-11시 ET (한국 시간 23:00~01:00)
- **현재**: 일요일 밤 → 월요일은 HN 트래픽 낮음 → 화~목 대기
- **추천**: 2/24(화) 또는 2/25(수) 밤 23시~01시 KST

### ⚠️ 경쟁 분석 — 재무앱 Show HN 실적 (2025~2026)
모든 최근 개인금융 Show HN이 실패함:
- **Whisper Money** (2026-01-17) — "zero-knowledge, E2E encrypted" → **3pts, 1 comment**
- **Budgetist** (2025-10-10) — "local-first, double-entry" → **2pts, 0 comments**
- **Fin Serv Rust** (2025-12-01) → **1pt, 0 comments**
- **calories.today** (2026-02-23) — "I quit MyNetDiary" → **2pts after 3h** (진행 중)

**교훈**: HN에서 "또 다른 예산 앱"으로 보이면 즉사. 
DonFlow의 생존 전략 = **drift detection (계획 vs 현실 괴리 감지)**를 전면에.
"budget app" 아닌 **"budget drift detector"**로 포지셔닝.
maker comment에서 "이게 왜 18번째 예산 앱이 아닌지"를 첫 문장부터 설명.

### 주의사항 (HN 가이드라인)
- 제목에 대문자/느낌표 금지
- 댓글에 방어적이지 말고 호기심으로 대응
- upvote 요청 절대 금지
- 첫 댓글은 본인이 달기 (기술적 결정 배경 등)

---

## Maker's First Comment (초안)

> 이걸 제일 먼저 달아야 함. HN에서 maker comment가 없으면 "낙하 투하" 느낌.

```
Hey HN, maker here.

This isn't a budget tracker — it's a drift detector. The problem I kept hitting wasn't "where did my money go?" (Mint/YNAB handle that). It was "my plan said X, reality became Y, and I didn't notice for months." Spreadsheets froze. I never fixed them.

DonFlow's loop: set a plan → upload bank CSV/XLSX → see exactly where and how much you're drifting. Drift warnings are the whole point.

Technical choices: IndexedDB for zero signup friction and zero "is my data safe" anxiety. No AI because budget drift is a math problem, not a prediction problem. SheetJS because bank export formats are a mess (tested 14 card issuers, ~200 merchants).

The ?demo link loads sample data — try the drift view without entering real numbers.

Would love feedback on whether the plan-vs-actual visualization is intuitive, and if lack of a mobile app is a dealbreaker.
```

> **~140 단어. 이전 대비 45% 압축.** 핵심만: 문제→해결→기술 이유→CTA. HN은 짧은 maker comment에 더 반응.

<details>
<summary>이전 긴 버전 (보관용)</summary>

```
Hey HN, maker here.

This isn't a budget tracker — it's a drift detector. I noticed that the actual problem isn't "where did my money go?" (Mint/YNAB solve that). The problem is "my plan said X, reality is Y, and I didn't notice until it was too late." I kept making budget spreadsheets that looked great for two weeks, then diverged silently. Fixing them was tedious enough that I'd just... stop.

DonFlow's core loop: set a plan → upload your actual bank statements → see exactly where and by how much you're drifting. The drift warnings are the whole point.

A few technical decisions:

**Why IndexedDB instead of a server?** Zero excuses for not using it. No signup friction, no "is my data safe" anxiety, no vendor that can suspend your account or shut down. The tradeoff is no cross-device sync — acceptable for something you check weekly.

**Why no AI?** Budget drift is a math problem, not a prediction problem. Your finances need a clear diff, not a language model. Adding AI would've meant sending financial data somewhere, which defeats the whole point.

**Why SheetJS?** Bank statement formats are a mess. I tested with 14 card issuers and ~200 merchants across different formats. SheetJS handles encoding chaos so you just drag-drop your bank export. Works with any bank that lets you download CSV or XLSX.

The `?demo` link loads sample data so you can try the drift visualization without entering real numbers.

Feedback I'd love:
- Is the plan-vs-actual drift visualization intuitive?
- Would you use this, or does lack of a mobile app kill it?
- Any export formats missing?

Happy to discuss architecture or anything else.
```
</details>

### 예상 질문 & 답변 준비

**Q: "Why not just use YNAB/Mint?"**
A: YNAB is great but it's $14.99/mo and cloud-only. DonFlow is free and your data never leaves your browser. Different philosophy — YNAB is an accounting tool, DonFlow is a planning tool.

**Q: "How do I sync between devices?"**
A: You don't — that's by design. Export to JSON/CSV, import on another device. I chose simplicity over sync. If cross-device becomes the #1 request, I'd consider CRDTs over a local relay, but not a cloud server.

**Q: "What happens if I clear my browser data?"**
A: You lose your data. That's why there's a prominent export button. I'm considering adding a periodic backup reminder.

**Q: "Is this really zero network requests?"**
A: Open DevTools → Network tab → use it for an hour. Zero requests. Not a claim — it's architectural. GitHub Pages serves the static bundle, after that the app is fully offline-capable.

**Q: "Will you add bank API integration?"**
A: Probably not. Plaid/Yodlee mean server costs, user auth, and financial data in transit. The CSV/XLSX upload flow keeps everything local. Most banks let you download statements in 2 clicks.

**Q: "What's the roadmap?"**
A: Near-term: recurring transactions (auto-fill monthly bills), budget templates (50/30/20 etc.), and periodic backup reminders. Medium-term: optional CRDT-based sync for people who want multi-device without a server. Long-term: PWA install for true offline-first mobile experience. I won't add anything that requires a server or sends data anywhere.

**Q: "How is this different from a spreadsheet?"**
A: A spreadsheet shows you numbers. DonFlow shows you drift. The core feature is the plan-vs-actual comparison — you set a budget structure, upload your actual spending, and see exactly where and by how much you're off. You could build this in a spreadsheet, but you'd spend more time maintaining the spreadsheet than budgeting. I know because I tried for two years.

---

---

## 🚀 D-Day Execution Plan (2/24 화 23:00 KST)

### T-30min (22:30 KST)
1. Final QA: `?demo` 접속, 각 탭 클릭, export 버튼 테스트
2. GitHub README 정상 렌더링 확인
3. docs 서브페이지 1개 랜덤 접속 확인
4. OG image 확인 (Twitter Card Validator 또는 직접)

### T-0 (23:00 KST = 09:00 ET)
1. https://news.ycombinator.com/submit 접속
2. **Title**: `Show HN: DonFlow – See where your budget plan and reality diverge (browser-only)`
3. **URL**: `https://maxmini0214.github.io/donflow/?demo`
4. **Text**: 위 본문 복붙 (Show HN은 URL 또는 Text 중 하나만. URL+Text 둘 다 쓰려면 Text에 URL 포함)
5. ✅ **URL + Text 둘 다 입력** — Show HN은 URL+Text 동시 제출 가능 (ntransformer 350pts, Shuru 19pts 모두 이 방식). URL에 ?demo, Text에 설명. 일반 Ask HN만 Text-only.

### T+1min
1. 방금 올린 포스트에 **maker comment** 즉시 달기 (위 초안 복붙)
2. 새 탭에서 show HN 페이지 새로고침 → 게시 확인

### T+5min ~ T+2h (골든타임)
1. **모든 댓글에 5분 이내 응답** — 이게 upvote를 결정
2. 기술 질문 → FAQ 참고해서 답변
3. 비판 → 방어하지 말고 "good point, I'll consider that" + 이유 설명
4. "Why not YNAB?" → 준비된 답변
5. Dev.to 글 URL도 관련 댓글에 자연스럽게 언급 가능 (단, 스팸처럼 보이면 안 됨)

### T+2h~T+24h
1. 30분마다 새 댓글 체크
2. 모든 피드백 기록 → GitHub Issues 또는 memory/
3. **절대 upvote 요청 금지**
4. 결과 기록: 포인트, 댓글 수, 피드백 테마

### 비상 시나리오
- **사이트 다운**: GitHub Pages는 거의 안 죽지만, 만약이면 HN 댓글에 "GitHub Pages seems to be having issues, trying to fix" 즉시 달기
- **2pts 30min**: 정상. 포기하지 말고 댓글 대응 계속. 많은 Show HN이 느리게 시작해서 2-3시간 후 떠오름
- **"This is just another budget app"**: 준비된 차별화 포인트 (drift detection) 즉시 설명

---

## Dev.to Cover Image ✅ DONE
- `main_image` API 필드로 업데이트 완료 (2/23 03:14)
- cover_image 정상 표시: `https://maxmini0214.github.io/donflow/og-image.png`
