function pickAmountFromLine(s) {
  const m = s.match(/(?:rs\.?|inr|₹)\s*([0-9]{1,3}(?:[, ]?[0-9]{2,3})*(?:\.[0-9]{1,2})?)/i);
  if (!m) return null;
  return parseFloat(m[1].replace(/[ ,]/g, ''));
}

function parseAmount(text = '') {
  // 1) Prefer line that mentions "amount"
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  for (const ln of lines) {
    if (/amount/i.test(ln)) {
      const v = pickAmountFromLine(ln);
      if (v != null) return v;
    }
  }
  // 2) Otherwise, pick any currency-prefixed number anywhere
  const cur = text.matchAll(/(?:rs\.?|inr|₹)\s*([0-9]{1,3}(?:[, ]?[0-9]{2,3})*(?:\.[0-9]{1,2})?)/gi);
  for (const m of cur) {
    const v = parseFloat(m[1].replace(/[ ,]/g, ''));
    if (!isNaN(v)) return v; // take the *first* currency-tagged amount
  }
  return null;
}

function parseDate(text = '') {
  const dRe = /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})/;
  const dm = text.match(dRe);
  const dStr = dm ? dm[0] : null;
  const parsed = dStr ? new Date(dStr.replace(/[-.]/g,'/')) : new Date();
  return isNaN(parsed) ? new Date() : parsed;
}

function parseAmountAndDate(text = '') {
  const amount = parseAmount(text);
  const date = parseDate(text);
  return { amount, date };
}

module.exports = { parseAmountAndDate };
