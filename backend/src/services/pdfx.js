const fs = require('fs');
const pdf = require('pdf-parse');

async function extractTextFromPdf(filePath) {
  const buf = fs.readFileSync(filePath);
  const data = await pdf(buf);
  return data.text || '';
}

module.exports = { extractTextFromPdf };
