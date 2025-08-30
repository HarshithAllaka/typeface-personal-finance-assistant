function parseAmountAndDate(text = '') {
  // pick the largest numeric-looking amount
  const amtRe = /(?:rs\.?|inr|₹)?\s*([0-9]{1,3}(?:[, ]?[0-9]{2,3})*(?:\.[0-9]{1,2})?)/gi;
  let max = 0, m;
  while ((m = amtRe.exec(text)) !== null) {
    const v = parseFloat(String(m[1]).replace(/[ ,]/g, ''));
    if (!isNaN(v) && v > max) max = v;
  }
  // quick date grab
  const dRe = /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})/;
  const dm = text.match(dRe);
  const dStr = dm ? dm[0] : null;
  const parsed = dStr ? new Date(dStr.replace(/-/g,'/').replace(/\./g,'/')) : new Date();
  return { amount: max || null, date: isNaN(parsed) ? new Date() : parsed };
}

module.exports = { parseAmountAndDate };
