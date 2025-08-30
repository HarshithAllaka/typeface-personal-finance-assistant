const Tesseract = require('tesseract.js');

async function extractTextFromImage(filePath) {
  const { data } = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
  return data.text || '';
}

module.exports = { extractTextFromImage };
