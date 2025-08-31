// backend/src/services/parseTablePdf.js
const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * Robust parser for PDFs where header/columns may be concatenated.
 * Expected columns: Date, Type, Category, Description, Amount
 * Example line from extractor:
 * "2025-08-01incomeSalaryMonthly salary3000"
 */
async function extractTable(filePath) {
  try {
    const data = await pdf(fs.readFileSync(filePath));
    let text = (data.text || '')
      .replace(/\r/g, '')
      .replace(/\u00A0/g, ' ')      // non-breaking space to normal space
      .replace(/[ \t]+/g, ' ');     // collapse spaces

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // --- Find header line (very forgiving) ---
    // Accepts: "Date Type Category Description Amount"
    // or "DateTypeCategoryDescriptionAmount"
    const headerIdx = lines.findIndex(L => {
      const norm = L.replace(/[,|]/g, ' ').replace(/\s+/g, ' ').toLowerCase();
      if (/(^|\s)date(\s|$)/.test(norm) &&
          /( ^|\s)type(\s|$)/.test(norm) &&
          /( ^|\s)category(\s|$)/.test(norm) &&
          /( ^|\s)description(\s|$)/.test(norm) &&
          /( ^|\s)amount(\s|$)/.test(norm)) return true;

      const joined = L.replace(/\s+/g, '').toLowerCase();
      return joined === 'datetypecategorydescriptionamount';
    });

    if (headerIdx === -1) {
      return { rows: [], error: 'Could not find a header row with Date/Type/Category/Description/Amount' };
    }

    const rows = [];

    // --- Parse rows after header ---
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw) continue;
      if (/^total\b/i.test(raw)) continue;

      // 1) Match start: date (10 chars) then (income|expense) possibly glued
      const m = raw.match(/^(\d{4}-\d{2}-\d{2})(income|expense)(.*)$/i);
      if (!m) continue;

      const dateStr = m[1];
      const type = m[2].toLowerCase();
      let tail = (m[3] || '').trim();

      // 2) Last token must be amount (allow 1,234.56 or -123.45)
      const amountMatch = tail.match(/(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?|\d+)$/);
      if (!amountMatch) continue;
      const amountStr = amountMatch[0].replace(/,/g, '');
      const amount = Number(amountStr);
      if (Number.isNaN(amount)) continue;

      // Remove trailing amount from tail
      tail = tail.slice(0, tail.length - amountMatch[0].length).trim();

      // 3) The first token of tail is category (letters/words); rest is description
      const tailParts = tail.split(/\s+/).filter(Boolean);
      if (!tailParts.length) continue;

      const category = titleCase(tailParts[0]);
      const description = tailParts.slice(1).join(' ').trim();

      rows.push({
        date: new Date(dateStr),
        type,
        category,
        description,
        amount,
        source: 'pdf',
      });
    }

    if (!rows.length) {
      return { rows: [], error: 'No valid rows found in PDF' };
    }
    return { rows, error: null };
  } catch (e) {
    return { rows: [], error: e.message };
  }
}

function titleCase(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

module.exports = { extractTable };
