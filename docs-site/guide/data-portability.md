# Data Portability

Your data should never be held hostage. DonFlow is designed so you can **leave at any time** and take everything with you.

## Export Formats

DonFlow supports multiple export formats:

| Format | What's Included | Opens In |
|--------|----------------|----------|
| **JSON** | Full backup (plans, transactions, categories, settings) | Any text editor, any JSON tool |
| **CSV** | Transactions with categories and amounts | Excel, Google Sheets, LibreOffice, Numbers |
| **XLSX** | Transactions in spreadsheet format | Excel, Google Sheets, LibreOffice |

## How to Export

1. Open DonFlow
2. Go to **Data Input** tab
3. Click **Export** → choose your format
4. File downloads to your machine instantly

No server involved. The export happens entirely in your browser using [SheetJS](https://sheetjs.com/).

## Will My Data Work in 10 Years?

Yes. Here's why:

### JSON is Forever
JSON is a plain text format defined in [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259). It's been stable since 2006 and is readable by virtually every programming language. Your DonFlow JSON export will be readable by any text editor, today and decades from now.

### CSV is Even More Forever
CSV predates the internet. It's the lowest common denominator of data exchange. Every spreadsheet app since the 1980s can read CSV files.

### No Proprietary Lock-in
DonFlow doesn't use any proprietary data format. There's no `.donflow` file extension. There's no binary blob that only our app can read. Everything is human-readable text.

## What About IndexedDB?

DonFlow stores your active data in [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), a browser-native database. This means:

- **Your data lives in your browser** — not on our servers (we don't have servers)
- **Clearing browser data deletes your DonFlow data** — so export regularly
- **IndexedDB is per-origin** — only `maxmini0214.github.io/donflow` can access it

### Important: Export is Your Backup

Since there's no cloud sync, **your exports are your backups**. We recommend:

- Export JSON after making significant changes
- Keep exports in a folder you already back up (iCloud, Google Drive, Dropbox, etc.)
- The JSON export can be re-imported to restore everything

## Moving to Another Tool

If you decide DonFlow isn't for you:

1. **Export as CSV** — works in any spreadsheet app
2. **Import into your new tool** — most budget apps accept CSV
3. **Delete browser data** if you want — `Settings → Clear Site Data`

You're never locked in. That's the point.

## Self-Hosting

DonFlow is MIT-licensed open source. You can:

- Fork the [GitHub repo](https://github.com/maxmini0214/donflow)
- Host on any static file server (Netlify, Vercel, your own nginx)
- Modify anything you want
- Your data stays in *your* browser on *your* domain

Even if GitHub Pages disappears tomorrow, DonFlow keeps working wherever you host it.

## The DonFlow Promise

> **We will never hold your data hostage.** There is no premium tier that unlocks exports. There is no "please don't leave" popup. There is no data format that only we can read. Your financial data is yours — we just help you see it clearly.
