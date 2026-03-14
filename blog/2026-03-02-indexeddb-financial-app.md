---
title: "Why I Built a Finance App That Never Touches a Server"
published: false
description: "How IndexedDB + Dexie.js let me build a full financial planning tool that runs entirely in the browser — no backend, no accounts, no data leaving your device."
tags: indexeddb, javascript, webdev, privacy
series: "Building a Finance App With No Server"
---

Your bank statements contain your entire life story. Where you eat, what you subscribe to, how much you earn. And most finance apps ask you to upload all of that to *their* servers.

I didn't want to build another one of those.

## The Problem I Was Solving

I kept a monthly budget spreadsheet. Every month, I'd set up categories — rent, food, transport, subscriptions. And every month, reality diverged from the plan within a week.

The spreadsheet told me what I *spent*. But nothing told me how my *financial structure* was holding up. Was I overspending on food by 15% or 50%? Was that new subscription quietly eating into my emergency fund allocation?

I wanted a **living financial blueprint** — plan vs. reality, updated as transactions come in, with alerts when things drift.

## Why Zero-Server Architecture

Financial data is the most sensitive data most people have. I made a hard rule: **nothing leaves the browser. Ever.**

This meant:
- No user accounts, no authentication
- No database server, no API
- No cloud sync (yet — considering E2E encrypted options)
- All data lives in IndexedDB on the user's device

The tradeoff is obvious: lose your browser data, lose your financial records. But that's what export/import is for — and users already trust themselves with spreadsheets on their hard drives.

## IndexedDB + Dexie.js: The Stack

Raw IndexedDB is painful. The API is callback-based, transaction-scoped, and error handling is a nightmare. [Dexie.js](https://dexie.org) wraps it with a Promise-based API that feels like a real database:

```javascript
import Dexie from 'dexie';

const db = new Dexie('DonFlowDB');

db.version(1).stores({
  transactions: '++id, date, category, amount, source',
  budgets: '++id, month, category, planned, actual',
  structures: '++id, name, created, components'
});
```

### Schema Design for Financial Data

The core insight: financial planning isn't just tracking transactions. It's tracking the **gap between intention and reality**.

Every budget entry has both `planned` and `actual` fields. The app continuously computes drift:

```javascript
function computeDrift(budget) {
  const elapsed = dayOfMonth / daysInMonth;
  const expectedSpend = budget.planned * elapsed;
  const drift = ((budget.actual - expectedSpend) / expectedSpend) * 100;
  
  return {
    drift,
    status: Math.abs(drift) < 10 ? 'on-track' 
          : drift > 0 ? 'over' : 'under',
    projected: budget.actual / elapsed  // month-end projection
  };
}
```

When drift exceeds a threshold, the user gets a visual alert — not "you spent $50 on coffee" but "your food category is tracking 23% over plan, projected to exceed by ₩45,000 this month."

## Parsing 14 Korean Card Formats

The hardest part wasn't the database — it was importing data. Korean banks and card companies each export CSVs and XLSXs in wildly different formats:

- Different column names for the same data (거래일자 vs 이용일 vs 결제일)
- Different date formats (YYYY-MM-DD vs YYYYMMDD vs MM/DD)
- Amount columns that mix positive/negative conventions
- Headers on row 1, row 3, or row 5 depending on the bank
- Encoding: EUC-KR, UTF-8, and sometimes both in one file

I built a universal parser that:

1. **Detects encoding** automatically (chardet-like heuristics)
2. **Finds the header row** by scanning for known column name patterns
3. **Maps columns** using a registry of 200+ known column names across 14 card companies
4. **Normalizes amounts** to consistent signed values
5. **Deduplicates** based on date + amount + merchant fuzzy matching

```javascript
const COLUMN_PATTERNS = {
  date: ['거래일자', '이용일', '결제일', '거래일', 'Date', '일자'],
  amount: ['거래금액', '이용금액', '결제금액', 'Amount', '금액'],
  merchant: ['가맹점명', '이용가맹점', '사용처', 'Merchant', '거래처'],
  // ... 200+ patterns
};
```

This alone handles ~85% of Korean card statement formats with zero configuration.

## What-If Simulation

The feature I'm most proud of: drag a slider to see "what if I reduce dining out by 30%?" The app instantly recalculates your projected savings, emergency fund timeline, and category balances — all client-side, all instant.

This is where IndexedDB's speed matters. All the data is local, so there's no network round-trip for complex calculations. A full month recalculation with 500 transactions takes <50ms.

## Lessons Learned

1. **IndexedDB is more than enough** for single-user apps with moderate data (<100MB). Don't reach for a backend by default.

2. **Dexie.js is essential** — raw IndexedDB is too painful for production code. The `.where()` chains and live queries alone justify the 45KB.

3. **Financial parsing is 70% of the work** — the "app" part is straightforward. Making it work with real-world messy bank exports is where the complexity lives.

4. **Users trust local-first** — the #1 feature request response in early feedback was "I love that my data stays on my device."

5. **Export early, export often** — without a server, data loss prevention is the user's responsibility. Make export dead-simple and prominent.

## Try It

DonFlow is free, open source, and runs entirely in your browser:

👉 **[donflow.app](https://maxmini0214.github.io/donflow/)** *(currently down for maintenance — back soon!)*

If you've built local-first apps, I'd love to hear about your IndexedDB experiences. What patterns worked? What surprised you?

---

*This is part of my series "Building a Finance App With No Server" — follow along for deep dives into specific challenges like the card parser, what-if engine, and upcoming E2E sync.*
