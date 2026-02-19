# Contributing to DonFlow

Thanks for your interest in contributing! DonFlow is a browser-only budget tracker — no server, no accounts, your data stays on your device.

## Quick Start

```bash
git clone https://github.com/maxmini0214/donflow.git
cd donflow
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Tech Stack

- **React + TypeScript** (Vite)
- **IndexedDB** via Dexie.js (all data stays in-browser)
- **SheetJS** for CSV/XLSX import
- **GitHub Pages** for hosting

## How to Contribute

### Bug Reports
Open an issue with:
- What you expected
- What actually happened
- Browser + OS

### Feature Requests
Open an issue describing the use case. We prioritize features that help users compare planned vs actual spending.

### Pull Requests
1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run `npm run build` to verify
5. Open a PR with a clear description

### Code Style
- TypeScript strict mode
- Functional React components
- Keep it simple — no unnecessary abstractions

## Architecture

```
src/
├── components/   # React components (Dashboard, Structure, DataInput)
├── db/           # Dexie.js database schema + queries
├── i18n/         # Internationalization (en/ko)
├── utils/        # Parsers, calculators, helpers
└── App.tsx       # Main app with tab navigation
```

## Questions?

Open an issue or check the [README](./README.md).
