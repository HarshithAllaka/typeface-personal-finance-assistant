const fs = require('fs');
const pdf = require('pdf-parse');

function normToken(s = '') {
  // lowercase, trim, and strip non-letters so "Amount", "AMOUNT", "Amt", "Amount:" all normalize
  return String(s).toLowerCase().trim().replace(/[^a-z]/g, '');
}

function splitRow(line) {
  // try tabs, then 2+ spaces, then commas
  if (/\t/.test(line)) return line.split('\t').map(s => s.trim());
  const bySpaces = line.trim().split(/\s{2,}/).map(s => s.trim());
  if (bySpaces.length > 1) return bySpaces;
  return line.split(',').map(s => s.trim());
}

function parseAmount(str) {
  if (!str) return null;
  const cleaned = String(str).replace(/[₹,\s]/g, '');
  const v = parseFloat(cleaned);
  return isNaN(v) ? null : v;
}

async function extractTable(filePath) {
  const buf = fs.readFileSync(filePath);
  const data = await pdf(buf);
  const text = (data.text || '').replace(/\r/g, '');
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

  // --- find a header row, flexibly ---
  let headerIdx = -1;
  let headersRaw = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    if (cols.length < 3) continue;

    const norm = cols.map(normToken);
    // allow synonyms like "amt" for amount, "desc" for description
    const set = new Set(norm);
    const hasDate = [...set].some(x => x === 'date');
    const hasType = [...set].some(x => x === 'type');
    const hasCategory = [...set].some(x => x === 'category' || x === 'cat');
    const hasDesc = [...set].some(x => x === 'description' || x === 'desc');
    const hasAmount = [...set].some(x => x === 'amount' || x === 'amt');

    if (hasDate && hasType && hasCategory && hasDesc && hasAmount) {
      headerIdx = i;
      headersRaw = cols; // keep original ordering to map columns
      break;
    }
  }

  if (headerIdx === -1) {
    return { rows: [], error: 'Could not find a header row with Date/Type/Category/Description/Amount' };
  }

  // map column names -> index using normalized tokens
  const nameToIdx = {};
  headersRaw.forEach((h, idx) => {
    const n = normToken(h);
    if (n === 'date') nameToIdx.date = idx;
    else if (n === 'type') nameToIdx.type = idx;
    else if (n === 'category' || n === 'cat') nameToIdx.category = idx;
    else if (n === 'description' || n === 'desc') nameToIdx.description = idx;
    else if (n === 'amount' || n === 'amt') nameToIdx.amount = idx;
  });

  const required = ['date', 'type', 'category', 'description', 'amount'];
  const missing = required.filter(k => !(k in nameToIdx));
  if (missing.length) {
    return { rows: [], error: `Missing columns: ${missing.join(', ')}` };
  }

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = splitRow(lines[i]);
    const dateStr = raw[nameToIdx.date];
    const typeStr = raw[nameToIdx.type];
    const catStr = raw[nameToIdx.category];
    const descStr = raw[nameToIdx.description];
    const amtStr = raw[nameToIdx.amount];

    if ([dateStr, typeStr, catStr, amtStr].some(v => v == null)) continue;

    const dt = new Date(String(dateStr).replace(/[-.]/g, '/'));
    const amount = parseAmount(amtStr);
    const tNorm = normToken(typeStr);
    const type =
      tNorm.includes('income') || tNorm === 'inc' ? 'income' :
      tNorm.includes('expense') || tNorm === 'exp' ? 'expense' : null;

    if (!amount || !type || isNaN(dt)) continue;

    rows.push({
      type,
      amount,
      category: catStr || 'General',
      description: descStr || '',
      date: dt,
      source: 'pdf'
    });
  }

  return { rows, error: null };
}

module.exports = { extractTable };
