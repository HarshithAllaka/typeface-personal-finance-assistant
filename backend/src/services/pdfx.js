const fs = require('fs');

// Use the legacy build in Node
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractTextWithPdfjs(filePath, maxPages = 5) {
  const data = new Uint8Array(fs.readFileSync(filePath));

  // Point worker to the packaged legacy worker (avoids warnings)
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      require('pdfjs-dist/legacy/build/pdf.worker.js');
  } catch (_) {}

  const doc = await pdfjsLib.getDocument({ data }).promise;

  const pages = Math.min(doc.numPages, maxPages);
  let fullText = '';

  for (let p = 1; p <= pages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map(i => i.str);
    fullText += strings.join(' ') + '\n';
  }

  return fullText.trim();
}

module.exports = { extractTextWithPdfjs };
