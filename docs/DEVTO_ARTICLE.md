---
title: "I Built a Budget App With Zero AI, Zero Backend, Zero Tracking — Here's Why"
published: false
description: "Why I chose boring tech, local-first storage, and no AI for a personal finance tool — and why more developers should consider it."
tags: webdev, javascript, privacy, showdev
---

# I Built a Budget App With Zero AI, Zero Backend, Zero Tracking — Here's Why

Every few months, I'd build a new budget spreadsheet. Income allocations, category targets, savings goals — the whole thing. It looked great for about two weeks. Then life happened, I stopped updating it, and three months later the plan and reality had completely diverged.

Fixing a spreadsheet is tedious enough that most people just… don't.

So I built [DonFlow](https://maxmini0214.github.io/donflow/) — a budget planner that compares what you *planned* to spend versus what you *actually* spent. And I made three deliberate choices that go against every current trend.

## Choice 1: Zero AI

I know. In 2025, not using AI in your app feels like refusing to use electricity. But here's the thing: **your financial data is the most sensitive data you have.** I didn't want it touching any API, any model, any third-party service.

More importantly, budget planning isn't an AI problem. It's a **discipline problem.** You don't need GPT to tell you that you overspent on dining out. You need a tool that shows you the drift between your plan and reality, clearly and immediately.

No AI. Just math and good UX.

## Choice 2: Zero Backend

DonFlow runs entirely in your browser. IndexedDB for storage, SheetJS for spreadsheet parsing, GitHub Pages for hosting. That's it.

Why? Because **every server is a liability.**

- A server means uptime monitoring, security patches, database migrations.
- A server means user accounts, password resets, GDPR compliance.
- A server means monthly costs that need monthly revenue to justify.
- A server means someday shutting it down and orphaning users.

DonFlow has none of those problems. Fork the repo and self-host on any static server. The deployed version will work as long as GitHub Pages exists. There's nothing to shut down because there's nothing running.

```
Network requests when using DonFlow: 0
(after initial page load)
```

Don't trust me? Open DevTools. Check the Network tab. You'll see zero requests while using the app. That's not a marketing claim — it's an architectural guarantee.

## Choice 3: Zero Tracking

No analytics. No telemetry. No cookies. No fingerprinting. No "anonymous usage data."

This means I have no idea how many people use DonFlow. I don't know which features they use most. I don't know their screen sizes, their browsers, their countries.

And honestly? That's fine. **I built this tool for myself first.** If others find it useful, great. But I didn't want to compromise the privacy promise for vanity metrics.

## What DonFlow Actually Does

The core loop is simple:

1. **Set your budget structure** — Define income, categories, and allocation percentages
2. **Upload transactions** — CSV or XLSX from your bank/card (auto-detects 14+ card formats)
3. **See the drift** — Progress bars show plan vs. actual per category
4. **Get warnings** — When spending diverges from your plan, you'll know
5. **Simulate changes** — What-if mode lets you test budget adjustments before committing

It's intentionally boring. No AI insights, no social features, no gamification. Just a clear picture of where your money goes versus where you said it should go.

## The Boring Tech Stack

- **React + TypeScript + Vite** — Fast, typed, well-documented
- **Dexie.js** — IndexedDB wrapper that makes client-side storage pleasant
- **SheetJS** — Parse any spreadsheet format without a server
- **GitHub Pages** — Free hosting, no infra to manage

I specifically avoided trendy choices. No Rust backend. No GraphQL. No microservices. No Docker. Every dependency is a maintenance burden, and I wanted the lowest possible maintenance burden.

## What I Learned

**1. Local-first is harder than it looks.** IndexedDB has quirks. Browser storage limits vary. Safari has its own opinions about everything. But the payoff — true data ownership — is worth the friction.

**2. "No backend" is a feature.** In a world where every app wants your email, your data, and your attention, "we literally can't see your data" is a differentiator.

**3. Spreadsheet refugees are a real market.** So many people have abandoned budget spreadsheets not because they don't work, but because maintaining them is tedious. The gap between "spreadsheet" and "full SaaS" is underserved.

**4. Constraints breed focus.** No backend meant I couldn't add "nice to have" features that require a server (sync, collaboration, notifications). That forced every feature to earn its place based on client-side feasibility alone.

## Try It

🔗 **[DonFlow](https://maxmini0214.github.io/donflow/)** — Click "Try Demo Data" to explore

📂 **[Source Code](https://github.com/maxmini0214/donflow)** — MIT licensed, every line auditable

If you're a Google Sheets refugee looking for something more structured but less invasive than YNAB, give it a shot. Your data stays on your device. Always.

---

*What's your approach to budget tracking? Spreadsheet? App? Pretending money doesn't exist? I'd love to hear in the comments.*
