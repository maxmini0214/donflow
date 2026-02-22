# Architecture

DonFlow follows a strict **zero-network, browser-only** architecture. There is no backend. There is no server to compromise.

## System Diagram

```
┌─────────────────────────────────────────────┐
│  Browser (your machine)                     │
│                                             │
│  ┌──────────┐    ┌────────────────────────┐ │
│  │ React UI │◄──►│ Dexie.js (IndexedDB)   │ │
│  └────┬─────┘    └────────────────────────┘ │
│       │                                     │
│  ┌────┴──────┐   ┌────────────────────────┐ │
│  │  SheetJS  │   │ Export Engine (JSON)    │ │
│  │ (import)  │   │ (backup / restore)     │ │
│  └───────────┘   └────────────────────────┘ │
│                                             │
│  Network requests: 0                        │
│  Server dependencies: 0                     │
│  External APIs: 0                           │
└─────────────────────────────────────────────┘
```

## Design Principles

### Zero Backend

There is no server. GitHub Pages serves pre-built static assets — it's a CDN, not a backend. The deployed bundle contains zero API keys, tokens, or endpoints.

### IndexedDB as the Sole Data Store

All user data lives in [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [Dexie.js](https://dexie.org/). No localStorage fallback. No cookies. No server sync.

- Data persists across browser sessions
- Close the tab — data is still there
- Clear site data — data is gone (you're in control)

### Client-Side Computation

All computation happens in your browser:

- Budget calculations
- Drift detection & warnings
- What-if simulations
- CSV/XLSX parsing (via SheetJS)
- Column auto-detection from bank statements

### Import Pipeline

```
CSV/XLSX file
    │
    ▼
SheetJS (local parsing)
    │
    ▼
Auto-detect columns (date, amount, description)
    │
    ▼
Map to internal schema
    │
    ▼
Store in IndexedDB
```

The entire pipeline runs in the browser. Your bank statements never leave your machine.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS |
| Storage | IndexedDB via Dexie.js |
| Import | SheetJS (XLSX) + PapaParse (CSV) |
| Hosting | GitHub Pages (static) |
| Components | Radix UI primitives |

## Verify It Yourself

1. Open [DonFlow](https://maxmini0214.github.io/donflow/)
2. Open DevTools → **Network** tab
3. Use DonFlow for an hour
4. Observe: **zero requests** after initial page load

That's the architecture. No trust required — verify it.
