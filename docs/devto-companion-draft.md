---
title: "I Built a Budget Tracker With Zero Backend — Here's What I Learned"
published: false
description: "Why I chose IndexedDB over a database, how browser-only apps work, and lessons from building DonFlow."
tags: webdev, javascript, react, privacy
cover_image: https://maxmini0214.github.io/donflow/og-image.png
---

## The Spreadsheet Graveyard

Every few months, I'd create a new budget spreadsheet. Income allocations, category targets, formulas that auto-calculate everything. It was beautiful.

Then month 3 happens. I stop updating it. The plan and reality diverge. Fixing the spreadsheet feels worse than starting over. So I don't. Another spreadsheet dies.

I built [DonFlow](https://maxmini0214.github.io/donflow/) to break this cycle. It's a budget planner that compares your **plan** vs. your **reality** — and it runs entirely in your browser.

No server. No signup. No tracking. Zero network requests.

## Why Zero Backend?

Financial data is intimate. It's not something I want sitting on someone else's server, even encrypted. So I made a decision: **the app never phones home.**

Here's the stack:
- **React + TypeScript + Vite** — standard SPA
- **Dexie.js** (IndexedDB wrapper) — local database with real queries
- **SheetJS** — parse CSV/XLSX from any bank export
- **GitHub Pages** — static hosting, zero cost

The entire "backend" is your browser's IndexedDB. Years of transaction data, stored locally, queryable instantly.

### Why IndexedDB Over localStorage?

localStorage caps at ~5-10MB. That sounds like a lot until you import 3 years of credit card transactions. IndexedDB gives you hundreds of MB with proper indexing. Dexie.js makes the API feel like a real ORM:

```typescript
// Get all transactions over budget this month
const overBudget = await db.transactions
  .where('date').between(monthStart, monthEnd)
  .and(tx => tx.amount > categoryBudget[tx.category])
  .toArray();
```

## The Core Feature: Drift Detection

Most budget apps answer: "Where did my money go?"

DonFlow answers: "Where is my spending **diverging from my plan**?"

You set a budget structure once (income → categories → amounts). Then upload bank/card exports. DonFlow shows progress bars per category and screams at you when you're drifting:

- 🟢 On track (< 80% of budget used)
- 🟡 Watch it (80-100%)
- 🔴 Over budget (> 100%)

The "What-If Simulator" lets you test changes: "What if I move ₩200K from dining to savings?" — see the impact before committing.

## Lessons Learned

### 1. Boring Tech = Trust

When someone sees "local-first, zero tracking," their first instinct is skepticism. My response: **"Open DevTools. Network tab. See for yourself."**

Using a boring, auditable stack (React + IndexedDB) means anyone can verify the privacy claim in 30 seconds. No blockchain, no zero-knowledge proofs, no hand-waving. Just... no network requests.

### 2. Import UX Is Everything

The moment users need to upload their bank data, you've lost them if the UX isn't perfect. I spent more time on CSV/XLSX auto-detection than on the entire dashboard:

- Auto-detect column mappings (date, amount, description, category)
- Handle 14+ Korean card company formats
- Gracefully handle encoding issues (EUC-KR, UTF-8 BOM)
- Show a preview before committing the import

### 3. PWA Makes Browser-Only Feel Native

Service worker + manifest.json = installable app that works offline. After the first visit, DonFlow loads from cache. Your budget doesn't need WiFi.

### 4. "No Server to Shut Down" Is a Feature

This might be the most underrated benefit. If I stop maintaining DonFlow tomorrow:
- The deployed site keeps working (static files on GitHub Pages)
- Your data stays in IndexedDB
- The source is MIT — fork it
- JSON export means zero vendor lock-in

## Try It

🔗 [**DonFlow Live Demo**](https://maxmini0214.github.io/donflow/) — click "Try Demo Data" to explore
📦 [**Source on GitHub**](https://github.com/maxmini0214/donflow) (MIT)

If you're a spreadsheet refugee who wants structure without surveillance, give it a try. Feedback welcome — especially on the plan-vs-reality flow.

---

*What's your approach to local-first apps? Have you built anything that avoids backend entirely? I'd love to hear about your architecture choices.*
