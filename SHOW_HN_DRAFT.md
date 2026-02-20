# Show HN Draft

## Title
Show HN: DonFlow – Plan vs. reality budget tracker, 100% browser-only

## Text
I built DonFlow because I kept setting up monthly budgets in Google Sheets, then never checking back. Three months later my plan and reality had completely diverged — and fixing it was too annoying to do in a spreadsheet.

DonFlow compares what you planned to spend vs. what you actually spent. It's 100% browser-only: IndexedDB for storage, zero network requests, no signup. Open DevTools and verify — there's literally nothing phoning home.

- Plan vs. actual progress bars per category
- Drift warnings when spending drifts from your plan
- What-if simulator: test budget changes before committing
- CSV/XLSX import with auto-detection (works with most bank exports)
- Full JSON export — your data is portable, no vendor lock-in
- Works offline after first load (service worker + PWA)

Boring tech stack on purpose: React + TypeScript + Vite, Dexie.js for IndexedDB, SheetJS for spreadsheet parsing. Hosted on GitHub Pages. No backend to maintain, no database to migrate, no subscription to cancel.

Try it: https://maxmini0214.github.io/donflow/ (click "Try Demo Data" to explore with sample transactions)

Source: https://github.com/maxmini0214/donflow (MIT)

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

### Micasa — 549pts, 178 comments (SAME DAY as our target!)
**What it is**: Track your house from the terminal (TUI + SQLite)
**Why it exploded**: Triggered a deep philosophical HN discussion:
1. **"Most SaaS = an Excel template"** — Top comment. People realize most tools are just curated CRUD on domain models. DonFlow should lean into this: "yes, you could track this in a spreadsheet. But you won't stick with it."
2. **"I use Google Sheets for house and car tracking"** — EXACTLY our target user. Someone who outgrew sheets but doesn't want SaaS. Our pitch: structured alternative to the finance spreadsheet you abandoned.
3. **TUI vs Web UI debate**: One commenter says "Web UI for power tools = bad idea". Counter: DonFlow works offline, has keyboard shortcuts, zero network. It's web-native but behaves like a local tool.
4. **Nostalgia for FileMaker/Access**: HN loves tools that give domain-specific structure without overcomplicating. DonFlow = "FileMaker for your monthly budget" energy.
5. **"No server to shut down"**: People love the permanence. If Micasa's SQLite file appeals, our IndexedDB + JSON export should too.

**Strategic implication**: Post DonFlow Show HN on a DIFFERENT day than Micasa peaks (let it cool). The "local-first domain tool" wave is hot. Ride it, don't compete with it.

### Patterns that get 100+ points on Show HN:
- **Niche + opinionated** (Micasa: "track your house from terminal" = 549pts)
- **"I scratched my own itch"** personal story
- **Auditable claims** ("open DevTools and check" = instant credibility)
- **Respond quickly to comments** — Mini-Diarium creator replied within hours to every concern
- **Academic/deep-tech gets respect** — but DonFlow's angle is "boring on purpose"
- **Trigger philosophy, not just demo** — Micasa's top comments were about the nature of SaaS, not just the tool

### Pre-launch checklist (before Feb 25):
- [x] Verify demo GIF ends on dashboard, not welcome screen ✅ (verified 2/20 — progress bars + drift warnings)
- [ ] Test PWA on mobile (iPhone Safari, Android Chrome)
- [x] Create 2-3 GitHub issues (good first issue) for community signal ✅ (#1 dark mode, #2 recurring, #3 i18n)
- [ ] Verify offline mode works after first visit
- [ ] Prepare responses for expected questions (mobile? encryption? data format?)
- [ ] Add "Google Sheets refugee" angle to opening line — Micasa proved this resonates
- [ ] Consider adding keyboard shortcuts (Micasa thread: "keyboard-centric operation" = HN value)
