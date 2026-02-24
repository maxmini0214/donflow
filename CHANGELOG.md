# Changelog

All notable changes to DonFlow are documented here.

## [1.0.0] — 2026-02-25

First public release. 158 commits of iterative development.

### Features
- **Plan vs. Actual Dashboard** — Progress bars compare budget to real spending per category
- **Drift Warnings** — Visual alerts when spending exceeds your plan
- **What-If Simulator** — Test budget changes before committing
- **Smart Import** — CSV and XLSX upload with auto-column detection (works with any bank/card export)
- **Card Alert Parsing** — Paste card payment notifications → auto-parsed and categorized (14 Korean card issuers, 200+ merchants)
- **Custom Categories** — Emoji labels, grouping, drag-to-reorder
- **Full Data Export** — JSON backup + CSV transaction export
- **Keyboard Shortcuts** — `1`/`2`/`3` tab switch, `?` for reference
- **i18n** — English and Korean with browser language auto-detection
- **Demo Mode** — `?demo` URL parameter loads sample data instantly
- **Documentation** — Architecture guide, privacy FAQ, API reference

### Privacy
- Zero network requests — no analytics, no telemetry, no tracking pixels
- No accounts, no signup, no email collection
- All data in IndexedDB — never leaves the browser
- Open source (MIT) — every line auditable

### Technical
- React + TypeScript (Vite)
- IndexedDB via Dexie.js
- SheetJS for spreadsheet parsing
- Static site — no server, no build-time secrets
- Works offline after first load
