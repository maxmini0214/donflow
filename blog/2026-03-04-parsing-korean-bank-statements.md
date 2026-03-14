---
title: "Parsing Korean Bank & Card Statements in the Browser With SheetJS"
published: false
description: "How I built a universal parser that handles 14+ Korean card companies' CSV/XLSX exports — all client-side, zero uploads."
tags: javascript, webdev, fintech, parsing
series: "Building a Finance App With No Server"
---

Korean card companies export transaction data in wildly different formats. Some give you CSV with EUC-KR encoding. Others spit out XLSX with merged cells. A few use semicolons as delimiters because why not.

I needed to parse all of them — **in the browser, with no server**.

## The Challenge

Here's what 14 Korean card issuers (삼성, 신한, 현대, KB, 롯데, 하나, 우리, BC, NH, 씨티, 카카오뱅크, 토스, IBK, 광주) throw at you:

| Format | Encoding | Delimiter | Header Rows | Merged Cells |
|--------|----------|-----------|-------------|-------------|
| CSV | EUC-KR or UTF-8 | comma or tab | 0-3 rows | N/A |
| XLSX | N/A | N/A | 1-4 rows | Yes, sometimes |
| XLS (legacy) | N/A | N/A | varies | Yes |

No two card companies agree on column names. "거래일자", "이용일", "결제일", "사용일" — all mean the same thing.

## Architecture: The Universal Parser

```
File Drop → Encoding Detection → SheetJS Parse → Header Detection → Column Mapping → Normalized Output
```

### Step 1: Encoding Detection

Korean financial files love EUC-KR. The browser's `FileReader` defaults to UTF-8, which turns Korean text into mojibake (문자깨짐).

```javascript
async function detectAndRead(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Check for UTF-8 BOM
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(buffer);
  }
  
  // Try UTF-8 first
  const utf8 = new TextDecoder('utf-8', { fatal: true });
  try {
    return utf8.decode(buffer);
  } catch {
    // Fallback to EUC-KR
    return new TextDecoder('euc-kr').decode(buffer);
  }
}
```

### Step 2: SheetJS Does the Heavy Lifting

[SheetJS (xlsx)](https://sheetjs.com/) handles the binary formats. The key insight: read everything as an array of arrays first, then figure out the structure.

```javascript
import * as XLSX from 'xlsx';

function parseFile(file, rawText) {
  if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
    return XLSX.read(rawText, { type: 'string' });
  }
  return XLSX.read(await file.arrayBuffer(), { type: 'array' });
}
```

### Step 3: Smart Header Detection

The hardest part. Some files start with metadata rows ("카드번호: ****-****-****-1234") before the actual data header.

```javascript
const DATE_PATTERNS = ['거래일자', '이용일', '결제일', '사용일', '거래일', '일자'];
const AMOUNT_PATTERNS = ['거래금액', '이용금액', '결제금액', '금액', '사용금액'];
const MERCHANT_PATTERNS = ['가맹점명', '이용가맹점', '거래처', '사용처', '가맹점'];

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i].map(cell => String(cell || '').trim());
    const hasDate = row.some(c => DATE_PATTERNS.some(p => c.includes(p)));
    const hasAmount = row.some(c => AMOUNT_PATTERNS.some(p => c.includes(p)));
    
    if (hasDate && hasAmount) return i;
  }
  return 0; // fallback
}
```

### Step 4: Column Mapping

Once we find the header, we map each card company's column names to our normalized schema:

```javascript
const NORMALIZED_SCHEMA = {
  date: null,      // ISO date string
  amount: null,    // number (positive = expense)
  merchant: null,  // string
  category: null,  // string (if provided)
  memo: null       // string (if provided)
};

function mapColumns(headerRow) {
  const mapping = {};
  headerRow.forEach((col, idx) => {
    const clean = String(col).trim();
    if (DATE_PATTERNS.some(p => clean.includes(p))) mapping.date = idx;
    if (AMOUNT_PATTERNS.some(p => clean.includes(p))) mapping.amount = idx;
    if (MERCHANT_PATTERNS.some(p => clean.includes(p))) mapping.merchant = idx;
  });
  return mapping;
}
```

### Step 5: Merchant Recognition (200+ Patterns)

Korean merchants appear differently across card companies. "스타벅스코리아", "STARBUCKS", "스타벅스 강남점" — all the same brand.

```javascript
const MERCHANT_DB = [
  { canonical: '스타벅스', patterns: ['스타벅스', 'STARBUCKS', 'starbucks'] },
  { canonical: '쿠팡', patterns: ['쿠팡', 'COUPANG', '로켓배송'] },
  { canonical: '배달의민족', patterns: ['배달의민족', '배민', 'BAEMIN', '우아한형제들'] },
  // ... 200+ entries
];

function normalizeMerchant(raw) {
  const lower = raw.toLowerCase();
  for (const entry of MERCHANT_DB) {
    if (entry.patterns.some(p => lower.includes(p.toLowerCase()))) {
      return entry.canonical;
    }
  }
  return raw; // unknown merchant, keep original
}
```

## Date Parsing: The Hidden Nightmare

Korean date formats I've encountered:

- `2026-03-04` (ISO, rare)
- `2026.03.04` (most common)
- `20260304` (compact)
- `03/04` (month/day only, year from file context)
- `2026년 03월 04일` (full Korean)

```javascript
function parseKoreanDate(raw, contextYear = new Date().getFullYear()) {
  const s = String(raw).trim();
  
  // 2026.03.04 or 2026-03-04
  let m = s.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  
  // 20260304
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  
  // 03/04 (no year)
  m = s.match(/^(\d{1,2})[/.](\d{1,2})$/);
  if (m) return `${contextYear}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  
  // 2026년 03월 04일
  m = s.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  
  return null;
}
```

## Amount Parsing: Commas and Signs

Korean financial exports love comma-separated numbers and sometimes use parentheses for negative amounts:

```javascript
function parseAmount(raw) {
  let s = String(raw).trim();
  
  // (1,234,567) → -1234567
  const isNegative = s.startsWith('(') && s.endsWith(')') || s.startsWith('-');
  s = s.replace(/[(),₩원\s]/g, '');
  
  const num = parseFloat(s.replace(/,/g, ''));
  return isNaN(num) ? 0 : (isNegative ? -Math.abs(num) : num);
}
```

## Putting It All Together

The full pipeline runs in ~50ms for a typical month of transactions (200-400 rows). No server round-trip. No data leaving the browser.

```javascript
async function importTransactions(file) {
  const raw = await detectAndRead(file);
  const workbook = parseFile(file, raw);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const headerIdx = findHeaderRow(rows);
  const mapping = mapColumns(rows[headerIdx]);
  
  return rows.slice(headerIdx + 1)
    .filter(row => row[mapping.date]) // skip empty rows
    .map(row => ({
      date: parseKoreanDate(row[mapping.date]),
      amount: parseAmount(row[mapping.amount]),
      merchant: normalizeMerchant(String(row[mapping.merchant] || '')),
      raw: row // keep original for debugging
    }));
}
```

## What I Learned

1. **EUC-KR isn't dead.** Korean financial institutions still default to it. Always try UTF-8 first, catch the error, fall back.

2. **Header detection > column index hardcoding.** Card companies change their export format without warning. Pattern matching survives format changes.

3. **Merchant normalization is an 80/20 game.** 200 patterns cover ~80% of common merchants. The long tail doesn't matter for budgeting — "unknown" is fine.

4. **SheetJS handles the binary nightmare.** Don't try to parse XLS/XLSX yourself. Let SheetJS convert everything to arrays, then apply your logic.

5. **Client-side parsing is fast enough.** I expected performance issues. A year of transactions (5,000 rows) parses in under 200ms on a mid-range phone.

---

*This is part 2 of the "Building a Finance App With No Server" series. [Part 1](/p/indexeddb-financial-app) covers the IndexedDB architecture.*

*DonFlow is a browser-only financial planning tool. All your data stays on your device. [Try it →](https://maxmini0214.github.io/donflow/)*
