# FAQ

## General

### What is DonFlow?

DonFlow is a browser-based budget tracking app that shows where your financial plan and reality diverge. It runs entirely in your browser — no server, no signup, no tracking.

### Is it really free?

Yes. Free forever. No freemium, no premium tier, no "free for 30 days." MIT licensed open source.

### Does it work offline?

Yes. Once the page loads, DonFlow works without internet. Your budget doesn't need WiFi.

### Can I use it on mobile?

Yes. DonFlow is a responsive web app. Open it in your mobile browser.

## vs. Other Tools

### DonFlow vs. YNAB

| | DonFlow | YNAB |
|---|---|---|
| **Cost** | Free forever | $99/year |
| **Account required** | No | Yes |
| **Data location** | Your browser | YNAB's servers |
| **Bank sync** | Manual CSV/XLSX upload | Automatic via Plaid |
| **Plan vs. Reality** | ✅ Core feature | ✅ Envelope budgeting |
| **Privacy** | Zero tracking | Analytics + third-party data sharing |

**Choose DonFlow if:** You want zero-cost, zero-tracking budget planning and don't mind manual imports.

**Choose YNAB if:** You want automatic bank sync and don't mind paying $99/year and sharing data with their servers.

### DonFlow vs. Mint (RIP)

Mint was shut down in 2024. If you're looking for a Mint replacement:

- DonFlow is free (Mint was ad-supported)
- DonFlow doesn't require bank credentials (Mint used Plaid/Yodlee)
- DonFlow doesn't show ads (Mint was famous for credit card ads)
- DonFlow's plan-vs-reality view is more actionable than Mint's category tracking

### DonFlow vs. Toss (토스)

| | DonFlow | Toss |
|---|---|---|
| **Data location** | Your browser | Toss servers |
| **Account required** | No | Yes (Korean phone number) |
| **Budget planning** | ✅ Plan vs. Reality | Basic spending summary |
| **Custom categories** | ✅ Full control | Limited |
| **What-if simulation** | ✅ Built-in | ❌ |
| **Open source** | ✅ MIT | ❌ |

**Choose DonFlow if:** You want to *design* your budget structure, not just view auto-categorized transactions.

**Choose Toss if:** You want automatic transaction tracking from Korean bank accounts.

### DonFlow vs. Spreadsheets

| | DonFlow | Google Sheets / Excel |
|---|---|---|
| **Setup time** | 30 seconds | Hours (formulas, formatting) |
| **Drift alerts** | ✅ Automatic | ❌ Manual formulas |
| **What-if simulation** | ✅ Built-in | DIY with formulas |
| **CSV import** | ✅ Auto-detect columns | Copy-paste |
| **Data privacy** | Browser only | Google/Microsoft servers |
| **Maintenance** | Zero | Constant formula fixing |

**Choose DonFlow if:** You want budget structure without spreadsheet maintenance.

**Choose spreadsheets if:** You need highly custom calculations or already have a working system.

## Data & Privacy

### Where is my data stored?

In [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) inside your browser. It never leaves your machine.

### Can I sync across devices?

Not automatically. You can export your data as JSON and import it on another device. This is by design — syncing requires a server, and we don't have one.

### What if I clear my browser data?

Your DonFlow data will be deleted. Export a JSON backup first if you want to keep it. We cannot recover your data because we never had it.

### Can I read my data in 10 years?

Yes. Your exports are JSON and CSV — formats that will outlive us all.

### What if DonFlow stops being maintained?

It keeps working. It's a static site with no server dependencies. Fork the repo and host it yourself. MIT licensed.

## Technical

### What's the tech stack?

React + TypeScript + Vite, with Dexie.js (IndexedDB), SheetJS (file parsing), and Tailwind CSS. Hosted on GitHub Pages.

### How does CSV import work?

SheetJS parses your file locally in the browser. DonFlow auto-detects date, amount, and description columns from 14+ bank statement formats. Your file never leaves your machine.

### Why not use a service worker for offline?

DonFlow works offline after the initial load because it has no server calls to make. A service worker could cache the initial assets, but the core functionality is already offline-first by architecture.
