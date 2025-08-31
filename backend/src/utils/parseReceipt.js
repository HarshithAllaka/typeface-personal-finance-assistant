// backend/src/utils/parseReceipt.js

function pickAmountFromLine(s) {
  const m = s.match(/(?:rs\.?|inr|₹)\s*([0-9]{1,3}(?:[, ]?[0-9]{2,3})*(?:\.\d{1,2})?)/i);
  if (!m) return null;
  return parseFloat(m[1].replace(/[ ,]/g, ""));
}

function parseAmount(text = "") {
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);

  // 1) Prefer explicit "Total" line
  for (const ln of lines) {
    if (/total/i.test(ln) && !/subtotal/i.test(ln) && !/total\s*price/i.test(ln)) {
      const v = pickAmountFromLine(ln);
      if (v != null) return v;
    }
  }

  // 2) Otherwise, grab all currency amounts and take the LAST one
  const matches = [...text.matchAll(/(?:rs\.?|inr|₹)\s*([0-9]{1,3}(?:[, ]?[0-9]{2,3})*(?:\.\d{1,2})?)/gi)];
  if (matches.length) {
    const last = matches[matches.length - 1];
    return parseFloat(last[1].replace(/[ ,]/g, ""));
  }

  return null;
}

function parseDate(text = "") {
  const dRe = /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})/;
  const dm = text.match(dRe);
  const dStr = dm ? dm[0] : null;
  const parsed = dStr ? new Date(dStr.replace(/[-.]/g, "/")) : new Date();
  return isNaN(parsed) ? new Date() : parsed;
}

function parseAmountAndDate(text = "") {
  const amount = parseAmount(text);
  const date = parseDate(text);
  return { amount, date };
}

module.exports = { parseAmountAndDate };
