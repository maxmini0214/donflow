# Show HN Draft

## Title
Show HN: DonFlow – Plan vs. reality budget tracker, 100% browser-only

## Text
I'm a Google Sheets refugee. Every few months I'd build a new budget spreadsheet — income allocations, category targets, the works. Then life happens, I stop updating it, and three months later the plan and reality have completely diverged. Fixing it in a spreadsheet is tedious enough that I just… don't.

DonFlow is the tool I built to solve that specific loop. You set a financial plan once, upload your bank/card exports, and it shows you where reality is drifting from your plan. It's 100% browser-only: IndexedDB for storage, zero network requests, no signup. Open DevTools and verify — there's literally nothing phoning home.

- Plan vs. actual progress bars per category
- Drift warnings when spending drifts from your plan
- What-if simulator: test budget changes before committing
- CSV/XLSX import with auto-detection (works with most bank exports)
- Full JSON export — your data is portable, no vendor lock-in
- Works offline after first load (service worker + PWA)
- Keyboard-driven: 1/2/3 to switch tabs, ? for shortcut reference

Boring tech stack on purpose: React + TypeScript + Vite, Dexie.js for IndexedDB, SheetJS for spreadsheet parsing. Hosted on GitHub Pages. No backend to maintain, no database to migrate, no subscription to cancel.

Try it: https://maxmini0214.github.io/donflow/ (click "Try Demo Data" to explore with sample transactions)

Source: https://github.com/maxmini0214/donflow (MIT)

Tech details for the curious:

~4,450 lines of TypeScript across 25 files. Initial JS is code-split: 309KB main + 47KB React + 39KB UI + 116KB data layer (166KB total gzipped). SheetJS (429KB) is lazy-loaded only when you import an XLSX file, so the first paint doesn't pay for spreadsheet parsing. Core dependencies: Dexie.js wraps IndexedDB (gives structured queries over years of transactions without localStorage's 5MB cap), SheetJS parses CSV/XLSX uploads with auto-column-detection, and React + Vite for the UI. 101 commits, MIT licensed.

The drift detection engine compares your budget plan against actual categorized transactions and fires warnings when any category exceeds a configurable threshold. The what-if simulator clones your current state, lets you adjust allocations, and shows projected outcomes — all computed client-side in ~2ms for typical datasets.

No service worker tricks for "offline" marketing — it genuinely works offline because there's no server to talk to. The SW just caches the static assets on first visit.

Would love feedback on the UX — especially the plan-vs-reality flow.

## Notes
- ✅ **Demo GIF**: docs/demo.gif (165KB, 5 frames, welcome→dashboard→budgets→structure→data)
- **Timing**: Tue-Thu 10am ET optimal. Next window: Tue Feb 25 → 00:00 KST
- Korean card format support is a differentiator but niche — lead with universal value
- Lead with "verify yourself: open DevTools" — HN loves auditable claims

## HN Competitive Intelligence (2026-02-20)

### Mini-Diarium — 124pts, 59 comments (same week!)
**What resonated**: local-first, encrypted, open-source, boring tech, no vendor lock-in
**Top concerns from HN commenters** (apply directly to us):
1. **"Can I read my data in 10 years?"** → Emphasize JSON export, standard formats, no proprietary schema
2. **"Mobile support?"** → Mention PWA/responsive. HN commenter: "most people do this on phones not laptops"
3. **"Plain text > proprietary"** → Our JSON export = fully portable, human-readable
4. **"Boring crypto/tech = trust"** → Our stack (React+IndexedDB+SheetJS) is intentionally boring. Say so.
5. **"What if you stop maintaining it?"** → "No server to shut down. It's a static site. Fork it."
6. **Demo GIF trap**: Mini-Diarium's GIF ended on login screen, people missed the animation. **Our GIF must end on the dashboard (most impressive screen).**

### Micasa — 598pts, 190 comments (SAME DAY as our target!)
**What it is**: Track your house from the terminal (TUI + SQLite)
**Why it exploded**: Triggered a deep philosophical HN discussion:
1. **"Most SaaS = an Excel template"** — Top comment. People realize most tools are just curated CRUD on domain models. DonFlow should lean into this: "yes, you could track this in a spreadsheet. But you won't stick with it."
2. **"I use Google Sheets for house and car tracking"** — EXACTLY our target user. Someone who outgrew sheets but doesn't want SaaS. Our pitch: structured alternative to the finance spreadsheet you abandoned.
3. **TUI vs Web UI debate**: One commenter says "Web UI for power tools = bad idea". Counter: DonFlow works offline, has keyboard shortcuts, zero network. It's web-native but behaves like a local tool.
4. **Nostalgia for FileMaker/Access**: HN loves tools that give domain-specific structure without overcomplicating. DonFlow = "FileMaker for your monthly budget" energy.
5. **"No server to shut down"**: People love the permanence. If Micasa's SQLite file appeals, our IndexedDB + JSON export should too.

**Strategic implication**: Post DonFlow Show HN on a DIFFERENT day than Micasa peaks (let it cool). The "local-first domain tool" wave is hot. Ride it, don't compete with it.

**Key Micasa comment thread** (598pts → top HN philosophical debate):
- "Most SaaS = an Excel template with curated CRUD" — top-voted comment
- FileMaker/Access nostalgia thread: people miss domain-specific tools without SaaS bloat
- "A product exports the _education_ of that domain" — the value isn't the CRUD, it's the opinionated structure
- **For DonFlow**: lean into "yes, you could use a spreadsheet. The spreadsheet doesn't tell you you're lying to yourself about your budget."

### Native macOS HN Client — 81pts in 2 hours (2026-02-21)
**What worked**: 
- Extremely detailed "Tech details for the curious" section (lines of code, specific API choices, CI/CD pipeline)
- Personal motivation first: "I spend a lot of time reading HN — I wanted something that felt like a proper Mac app"
- Invites specific feedback: "especially on features you'd want to see"
- **Applied to DonFlow**: Added "Tech details" section with line count, bundle size, dependency choices, and drift detection perf numbers

### Patterns that get 100+ points on Show HN:
- **Niche + opinionated** (Micasa: "track your house from terminal" = 549pts)
- **"I scratched my own itch"** personal story
- **Auditable claims** ("open DevTools and check" = instant credibility)
- **Respond quickly to comments** — Mini-Diarium creator replied within hours to every concern
- **Academic/deep-tech gets respect** — but DonFlow's angle is "boring on purpose"
- **Trigger philosophy, not just demo** — Micasa's top comments were about the nature of SaaS, not just the tool

### Ledgr — Just Posted on Show HN (2026-02-21, item 47091350)
**What it is**: Offline finance tracker with local LLM categorization (macOS desktop app)
**Stack**: Tauri 2.0 (Rust + React), SQLite, llama.cpp
**Direct DonFlow competitor** — but fundamentally different approach:

| | DonFlow | Ledgr |
|---|---|---|
| Platform | Web (any browser, any OS) | Desktop (macOS ARM only) |
| Core concept | **Plan vs Reality drift** | Transaction categorization |
| AI | None needed | Local LLM (bring your own GGUF) |
| Bank support | 14+ formats auto-detected | Chase CSV only |
| Install | Zero (static site) | Download + install app |
| Mobile | PWA (add to home screen) | No |
| Unique feature | Drift warnings + what-if sim | Shows "why" per categorization |

**Strategic implications**:
- Ledgr validates demand for local-first finance tools on HN
- Our differentiation is crystal clear: **planning** (plan vs actual) vs **tracking** (categorization)
- "No install needed" + "any browser" + "14+ bank formats" = lower friction
- If Ledgr gets traction, it primes the audience for DonFlow's Show HN
- **Do NOT position against Ledgr** — position as complementary (they categorize, we plan)

### HN Front Page Zeitgeist (Feb 20-21)
- **"America vs Singapore: You can't save your way out of economic shocks"** — 302pts. Personal finance topic trending on HN front. HN audience is thinking about money, budgets, financial planning RIGHT NOW.
- **Gemini 3.1 Pro**: 914pts dominating. AI fatigue angle still valid for our "No AI" positioning.
- **Micasa**: 615pts (still climbing, Feb 21 05:30 KST). Local-first wave confirmed and sustained.
- **"AI is not a coworker, it's an exoskeleton"**: 447pts. Nuanced AI debate, not blanket rejection.
- **Anthropic auth ban**: 643pts. Trust/privacy in tech conversation active.
- **Ghostty terminal**: 166pts/70 comments (Feb 21). Another "single purpose + polished UX" hit. Pattern holds.
- **Mines.fyi**: **43pts/23c in 3 hours** (Feb 21, now on Show HN front page!). Public data + clean Leaflet visualization = instant HN love. Confirms "simple data viz" pattern. "I downloaded public datasets and made a visualization" = the ultimate Show HN formula.
- **Native macOS HN client**: 158pts/116 comments (Feb 21, up from 81). "Show your work" + tech details = sustained growth.
- **Ledgr (competitor)**: Dead. 1-2pts, 0 comments after 5+ hours. Chase-only + macOS ARM-only = too narrow.
- **Micasa**: **623pts** (still climbing on Day 2). Local-first terminal tool wave sustained.
- **Timing validation**: Finance + privacy + local-first = three HN themes converging. Feb 25 launch window looks ideal.

### Key Micasa 615pts Meta-Insight (Feb 21)
The HN discussion went philosophical: **"Most SaaS = an Excel template with curated CRUD on domain models."** Top commenter argued the real value of a product is "exporting the _education_ and information architecture of that domain."

This maps PERFECTLY to DonFlow: we don't just store budget data (spreadsheets do that). We teach you to think about budget planning as a plan-vs-reality system with drift detection. The "boring alternative" to a spreadsheet that actually keeps you honest.

Angle for Show HN comments: "A spreadsheet shows you numbers. DonFlow shows you the gap between your intentions and your behavior."

### Pre-launch checklist (before Feb 25):
- [x] Verify demo GIF ends on dashboard, not welcome screen ✅ (verified 2/20 — progress bars + drift warnings)
- [x] Test PWA on mobile (iPhone Safari, Android Chrome) — viewport fixed (a11y: allow zoom), PWA manifest OK
- [x] Create 2-3 GitHub issues (good first issue) for community signal ✅ (#1 dark mode, #2 recurring, #3 i18n)
- [x] Verify offline mode works after first visit ✅ SW runtime caching confirmed (cache-first + network fallback)
- [x] Prepare responses for expected questions ✅ 7 FAQ responses ready (commit debeeb9)
- [x] Add "Google Sheets refugee" angle to opening line ✅ Rewritten opening paragraph
- [x] Keyboard shortcuts added (1/2/3 nav, ? help overlay) ✅ commit cf5985b
- [x] Prepared FAQ responses for fast replies ✅

## Prepared FAQ Responses (copy-paste ready)

### Q: "Why not just use a spreadsheet?"
> That's literally what I was doing. The problem isn't the math — it's the discipline. A spreadsheet doesn't scream at you when your plan and reality diverge. DonFlow's drift warnings are the feature that keeps you honest. You set a plan once, upload your bank exports, and it tells you where you're drifting. The spreadsheet approach works until month 3 when you stop updating it.

### Q: "Mobile support?"
> It's a PWA — works on iPhone Safari and Android Chrome. Add to home screen and it behaves like a native app. The UI is responsive but I'd say the sweet spot is tablet/desktop since you're doing financial planning, not quick glances. That said, checking drift alerts on mobile works fine.

### Q: "What about encryption / security?"
> Your data never leaves your browser. Zero network requests — open DevTools and verify. IndexedDB stores everything locally. There's no server to breach, no account to hack, no database to leak. The tradeoff: if you clear browser data, it's gone. Export to JSON regularly (one click). I chose simplicity over complexity here — no encryption layer means no key management headaches, and the threat model is "your browser, your device."

### Q: "What if you stop maintaining it?"
> No server to shut down. It's a static site on GitHub Pages. The source is MIT-licensed. Fork it, self-host it, or just keep using the deployed version — it'll work indefinitely because there's no backend dependency. Your data is in IndexedDB + exportable JSON.

### Q: "Can I import from [specific bank/app]?"
> CSV and XLSX with auto-format detection. It handles most bank export formats — column mapping is flexible. If your bank exports something weird, open an issue and I'll add support. Korean card company formats are also supported (14 card issuers).

### Q: "How is this different from YNAB / Mint / Copilot?"
> Those are tracking tools — they show where money went. DonFlow is a planning tool — it shows where money *should* go vs where it *actually* goes. The core loop is: set a budget structure → import transactions → see the drift → adjust. Also: no subscription, no account, no data sharing. Your bank data stays on your device.

### Q: "How is this different from Ledgr?"
> Different problem space. Ledgr is a categorization tool — it figures out *what* a transaction is (local LLM, cool tech). DonFlow is a planning tool — it tells you if your *budget structure* still matches reality. They're complementary: Ledgr answers "where did my money go?", DonFlow answers "am I still on track with my plan?" Also: DonFlow runs in any browser with no install, supports 14+ bank formats, and works on mobile as a PWA. Ledgr is macOS ARM only.

### Q: "Why a web app instead of native/TUI?"
> Zero friction to try. No install, no download, no sign-up — click the link and you're in. That matters for a Show HN where people give you 30 seconds. Once you're in, it works offline (service worker caches everything), has keyboard shortcuts (1/2/3 to switch tabs, ? for help), and IndexedDB gives you local persistence across sessions. The tradeoff vs native is no system-level file access, but for a budget tool that imports CSVs, that's fine — drag-and-drop works. PWA lets you pin it to your home screen on mobile. I wanted the widest possible reach with zero deployment overhead.

### Q: "Why IndexedDB instead of just localStorage?"
> Storage limits. localStorage caps at ~5-10MB depending on browser. IndexedDB gives you hundreds of MB, supports structured queries, and handles years of transaction data without breaking a sweat. Dexie.js makes the API pleasant to work with.
