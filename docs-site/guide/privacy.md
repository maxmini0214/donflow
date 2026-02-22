# Privacy

DonFlow was built with a simple premise: **your financial data should never leave your machine.**

This isn't a marketing claim. It's an architectural guarantee.

## Zero Network Requests

DonFlow makes **no API calls, no analytics pings, no telemetry**. After the initial page load (static HTML/JS/CSS from GitHub Pages), the application makes exactly zero network requests.

- No Google Analytics
- No Mixpanel, Amplitude, or Segment
- No error reporting (Sentry, Bugsnag)
- No feature flags (LaunchDarkly)
- No A/B testing
- No ad pixels

**Nothing.**

## No Accounts

- No signup
- No login
- No email collection
- No password to get breached
- No OAuth handshake
- No "Sign in with Google"

You open a URL. You start budgeting. That's it.

## Why No Server?

Most budget apps need a server for one or more of these:

| Reason | DonFlow's answer |
|--------|-----------------|
| User accounts | No accounts needed |
| Data sync across devices | Export/import JSON manually |
| Bank API integration | You upload CSV/XLSX yourself |
| Analytics & metrics | We don't track you |
| Monetization | It's free and open source |

Every "feature" that requires a server is a feature that requires your trust. DonFlow doesn't ask for your trust — it doesn't need it.

## Why No Tracking?

Because tracking financial data is one of the most invasive things a software company can do. Your spending habits reveal:

- Where you live (rent payments)
- What you eat (restaurant charges)
- Your health (pharmacy, doctor visits)
- Your relationships (gifts, shared expenses)
- Your financial anxiety (how often you check)

We built DonFlow so this data **never exists anywhere except your browser**.

## Verify It Yourself

Don't take our word for it. Verify:

### Method 1: Network Tab

1. Open [DonFlow](https://maxmini0214.github.io/donflow/)
2. Open DevTools (`F12` or `Cmd+Option+I`)
3. Go to the **Network** tab
4. Use DonFlow normally — add transactions, import files, run simulations
5. After the initial page load, you'll see **zero requests**

### Method 2: Read the Source

The entire codebase is open source: [github.com/maxmini0214/donflow](https://github.com/maxmini0214/donflow)

Search for:
- `fetch(` — only used for loading local demo data
- `XMLHttpRequest` — not present
- `navigator.sendBeacon` — not present
- Any analytics SDK — not present

### Method 3: Block All Network

1. Open DonFlow
2. Go to DevTools → Network → check **Offline**
3. Keep using DonFlow
4. Everything works. Because nothing needs a server.

## Data Lifecycle

```
You create data → IndexedDB (your browser)
You export data → JSON/CSV file (your disk)
You clear site data → Data is gone. Forever. We can't recover it.
```

There is no "account deletion" because there is no account. There is no "data request" because we don't have your data. There is no "privacy policy" because we don't collect anything to write a policy about.

## What About the Hosting?

DonFlow is hosted on GitHub Pages — a static file CDN. GitHub Pages serves HTML, CSS, and JavaScript files. It does not:

- Process any user data
- Store any user data
- Execute any server-side code

GitHub Pages access logs are managed by GitHub per their own privacy policy. DonFlow has no access to these logs and adds no additional tracking.
