# DonFlow 💰

**A browser-only budget planner that compares your plans vs. reality.**

> No server. No signup. No tracking. Your financial data never leaves your browser.

🔗 **[Try it live →](https://maxmini0214.github.io/donflow/)**

## What is DonFlow?

Most expense trackers only record the past. DonFlow lets you **design your financial structure** and then see how reality compares — in real time.

- 📊 **Plan vs. Actual** — Set budgets, upload transactions, see progress bars and drift warnings
- 🔮 **What-If Simulator** — Test financial changes before committing
- 📁 **CSV/XLSX Upload** — Auto-detects formats from 14+ Korean card issuers + generic formats
- 🎲 **Demo Data** — Click "Try Demo Data" on the dashboard to explore instantly
- 🌐 **Bilingual** — Auto-detects browser language (English / Korean)
- 🔒 **100% Private** — All data stored in IndexedDB, never sent anywhere

## Quick Start

1. Visit [donflow](https://maxmini0214.github.io/donflow/)
2. Click **🎲 Try Demo Data** on the Dashboard tab
3. Explore the three tabs: **Dashboard** → **Structure Design** → **Data Import**

## Tech Stack

- **React + TypeScript + Vite**
- **Dexie.js** (IndexedDB wrapper)
- **SheetJS** for CSV/XLSX parsing
- **GitHub Pages** for hosting

## Screenshots

| Dashboard | Structure Design |
|-----------|-----------------|
| Plan vs. actual progress bars, drift alerts | Income/expense category management |

## Development

```bash
npm install
npm run dev
```

## License

MIT
