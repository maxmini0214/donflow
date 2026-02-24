# Show HN — 예상 질문 & 답변 템플릿

> max용. HN 댓글에 30초 내 대응하기 위한 치트시트.
> 자연스럽게 수정해서 쓸 것 — 복붙 느낌 나면 안 됨.

---

## 1. "Why not just use a spreadsheet?"

> Great question — I actually started with Google Sheets! The problem was maintenance: every time my spending pattern changed, I had to manually update formulas, conditional formatting, and category mappings. DonFlow automates the "plan vs actual" comparison that spreadsheets make tedious. If you enjoy spreadsheet formulas, a well-built template works fine. DonFlow is for people who want that structure without the maintenance overhead.

## 2. "How is this different from YNAB?"

> YNAB is great but costs $99/year, requires an account, and syncs your data to their servers. DonFlow is: (1) free forever, (2) zero backend — all data stays in IndexedDB on your machine, (3) open source under MIT. The core difference in philosophy: YNAB is about "every dollar has a job" (envelope budgeting). DonFlow is about showing where your plan diverges from reality, with drift detection and what-if simulation.

## 3. "IndexedDB? What about data durability?"

> Valid concern. IndexedDB persists across browser restarts and is quite durable in practice. But I added one-click JSON export specifically for this — you can back up anytime. I'm considering adding automatic localStorage backup as a fallback. For people who want extra safety, the export/import cycle is the recommended workflow. Your data is plain JSON — no proprietary format.

## 4. "Zero backend sounds nice, but what about sync across devices?"

> Honest answer: there's no sync right now. This was a deliberate tradeoff — the moment you add sync, you need a server, accounts, and the privacy promise breaks. I'm exploring options like encrypted file sync (export JSON → put in iCloud/Dropbox) or WebRTC peer sync, but nothing built yet. For now, it's a single-device tool. If multi-device is critical for you, this isn't the right fit yet.

## 5. "Can I import from my bank?"

> Yes! DonFlow auto-detects CSV/XLSX columns from any bank. I built a column-matching algorithm that handles different date formats, amount formats (negative vs debit/credit columns), and encoding. It's been tested with formats from 14+ Korean card companies, but should work with most bank exports worldwide since it pattern-matches rather than hardcoding formats.

## 6. "What about mobile?"

> It's a PWA — works on iPhone Safari and Android Chrome. Add to home screen and it behaves like a native app. The UI is responsive but the sweet spot is tablet/desktop since you're doing financial planning. That said, checking drift alerts on mobile works fine. No app store, no download — just your browser.

## 7. "Is this a business? What's the monetization plan?"

> No monetization plan. It's a personal project that solved my own problem — I built it because I was frustrated that budgeting tools either cost money, require accounts, or don't show plan-vs-actual tracking. It's MIT licensed, hosted on GitHub Pages (free), zero infrastructure cost. If it's useful to others, great. I have some dev resource guides on Gumroad but DonFlow itself will stay free.

## 8. "The code looks like it was AI-generated"

> I used AI tools during development — mostly for boilerplate and testing repetitive patterns. The architecture decisions (Dexie.js for reactive queries, column auto-detection algorithm, drift detection logic) were designed by hand. The merchant classifier and notification parser were iteratively refined with real data. I think AI-assisted development is just how modern solo devs ship faster — happy to discuss specific implementation decisions.

## 9. "Why React? This could be vanilla JS"

> Fair point — for a tool this size, vanilla JS would work fine. I chose React + Vite because: (1) Dexie's `useLiveQuery` gives reactive data binding for free, (2) component composition made the 3-tab architecture clean, (3) I wanted fast hot-reload during development. The bundle is ~180KB gzipped which I think is acceptable for a tool you use regularly.

## 10. "What's the 'drift detection' actually doing?"

> It's simpler than it sounds: each category has a planned monthly budget. DonFlow tracks daily spend rate and projects forward. If your projected month-end spend exceeds your plan by >10%, it triggers a warning. The "4 days, $X over projected" message means "at your current pace, you'll exceed your budget by $X with 4 days left." It's linear projection — not ML, just math. But it catches overspending early enough to adjust.

---

## 💡 대응 원칙

1. **첫 1시간이 승부** — 초기 댓글에 빠르고 성실하게 답하면 upvote 올라감
2. **방어적 X, 감사 O** — 비판에 "good point, here's my thinking..." 스타일
3. **짧게** — HN 댓글은 2-3문단이 최적. 벽 텍스트 금지
4. **기술적 질문에 구체적으로** — 코드 링크, 줄 번호, 구현 세부사항
5. **"I don't know" OK** — 모르면 솔직하게. HN은 진정성 = 신뢰
6. **절대 금지**: upvote 요청, 다른 사이트로 유도, 경쟁사 비방
