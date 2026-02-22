# Show HN Draft — DonFlow

## Title (max 80 chars)
Show HN: DonFlow – Budget tracker that shows where plan and reality diverge (browser-only)

## URL
https://maxmini0214.github.io/donflow/?demo

> 💡 ?demo URL 사용 — 클릭 즉시 데모 데이터로 풀 체험 가능

## Text (HN 본문)

Every few months I'd make a new budget spreadsheet. Income targets, category splits, savings goals — it looked great for two weeks. Then life happened, the plan froze, and three months later plan and reality had completely diverged. Fixing a spreadsheet is tedious enough that most people just don't.

DonFlow shows you exactly where you're drifting. Set a budget structure, upload bank/card statements (CSV or XLSX from any bank), and see plan-vs-actual progress bars per category. When spending exceeds your plan, you get drift warnings. A what-if simulator lets you test changes before committing.

Architecture decisions:

- **Zero network requests** — all data stays in IndexedDB. Open DevTools → Network tab → use it for an hour → zero requests. Not a marketing claim — it's architectural.
- **No account** — no signup, no login, no email. Open the URL and start.
- **No AI** — your finances don't need GPT. They need math and good UX.
- **No server** — GitHub Pages serves static assets. There is nothing running. Fork the repo and self-host on any static server.

Built with React, TypeScript, Dexie.js, SheetJS. MIT licensed.

Supports 14+ card statement formats (₩, $, €, £, ¥), auto-detects columns, handles accounting notation.

Try the demo: https://maxmini0214.github.io/donflow/?demo (loads sample data, no setup needed)

Source: https://github.com/maxmini0214/donflow

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
- [ ] Cover image for Dev.to 글 (피드 노출 ↑)
- [ ] 모바일 스크린샷 (HN 유저 질문 선제 대응)
- [ ] GitHub Actions CI (PAT workflow scope 필요 → max에게 요청)
- [x] VitePress docs 배포 ✅ (2/23 02:17 — public/docs/에 빌드, 7페이지 전부 라이브)

### 타이밍
- **최적 시간**: 화~목 오전 9-11시 ET (한국 시간 23:00~01:00)
- **현재**: 일요일 밤 → 월요일은 HN 트래픽 낮음 → 화~목 대기
- **추천**: 2/24(화) 또는 2/25(수) 밤 23시~01시 KST

### 주의사항 (HN 가이드라인)
- 제목에 대문자/느낌표 금지
- 댓글에 방어적이지 말고 호기심으로 대응
- upvote 요청 절대 금지
- 첫 댓글은 본인이 달기 (기술적 결정 배경 등)
