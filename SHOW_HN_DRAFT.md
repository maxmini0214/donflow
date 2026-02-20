# Show HN Draft

## Title
Show HN: DonFlow – Plan vs. reality budget tracker, 100% browser-only

## Text
I built DonFlow because I kept setting up monthly budgets, then never checking back. Three months later my plan and reality had completely diverged — and fixing it was too annoying.

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
- **Blocker**: Need demo GIF or screenshot before posting (animated walkthrough of demo data)
- **Timing**: Tue-Thu 10am ET optimal. Next window: Tue Feb 25 → 00:00 KST
- Korean card format support is a differentiator but niche — lead with universal value
- **HN validation (2026-02-20)**: Mini-Diarium (encrypted local journaling) got 113pts on Show HN same week. Local-first + privacy + boring-tech resonates strongly with HN audience.
- **Key HN themes that apply to us**: data portability in 10 years, no vendor lock-in, standard formats, works offline, mobile support
- Lead with "verify yourself: open DevTools" — HN loves auditable claims
