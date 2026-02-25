# Security Policy

## Architecture

DonFlow is a **100% client-side application** hosted as static files on GitHub Pages. There is no backend, no API server, no database, and no authentication system.

- **Zero network requests** for financial data — all data stays in your browser's IndexedDB
- **No telemetry, analytics, or tracking** of any kind
- **No third-party scripts** that process user data
- **No cookies** — DonFlow doesn't set any cookies
- External resources: Google Fonts (Pretendard) loaded from cdn.jsdelivr.net

## Threat Model

Since DonFlow has no server, the attack surface is limited to:

1. **Client-side XSS** — Mitigated by React's default escaping and no `dangerouslySetInnerHTML` usage
2. **Malicious CSV/XLSX uploads** — SheetJS parses files client-side; malformed files can't reach a server
3. **Supply chain** — Dependencies are pinned and minimal (React, Dexie.js, SheetJS, PapaParse, Radix UI)
4. **GitHub Pages compromise** — Outside our control; verify the source at [github.com/maxmini0214/donflow](https://github.com/maxmini0214/donflow)

## Reporting a Vulnerability

If you find a security issue:

1. **Do NOT open a public issue**
2. Email: **maxmini0214@gmail.com** with subject line `[DonFlow Security]`
3. Include steps to reproduce and potential impact
4. I'll acknowledge within 48 hours and aim to fix within 7 days

## Verification

You can verify DonFlow's privacy claims yourself:

1. Open DevTools → Network tab → reload the app
2. Confirm: zero requests to any server after initial static asset load
3. All financial data operations use `indexedDB` (visible in Application → Storage)
4. `localStorage` is used only for theme/language preferences — no financial data

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅        |

## Dependencies

DonFlow uses a minimal dependency set. Run `npm audit` on the source to verify:

```bash
git clone https://github.com/maxmini0214/donflow
cd donflow
npm install
npm audit
```
