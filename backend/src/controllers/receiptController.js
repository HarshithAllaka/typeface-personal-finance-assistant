const path = require('path');
const pdfParse = require('pdf-parse');
const { parseAmountAndDate } = require('../utils/parseReceipt');
const { runOcr } = require('../services/ocr'); // your existing tesseract wrapper
const { extractTextWithPdfjs } = require('../services/pdfx');

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const rel = `/uploads/${path.basename(req.file.path)}`;
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const mimetype = (req.file.mimetype || '').toLowerCase();

    let rawText = '';
    let warning;

    const isPdf = ext === '.pdf' || mimetype.includes('pdf');
    const isImage =
      mimetype.startsWith('image/') ||
      ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);

    if (isPdf) {
      // 1) try pdf-parse
      try {
        const data = await pdfParse(req.file.buffer ?? req.file.path);
        rawText = (data.text || '').trim();
      } catch (e1) {
        // 2) fallback to pdfjs-dist
        try {
          rawText = await extractTextWithPdfjs(req.file.path);
        } catch (e2) {
          warning = `Unsupported/corrupt PDF (${e1.message}).`;
        }
      }
    } else if (isImage) {
      // images → OCR
      rawText = await runOcr(req.file.path);
    } else {
      warning = 'Unsupported file type. Please upload an image or PDF.';
    }

    // Suggestions (only if we have some text)
    let suggestions = null;
    if (rawText && rawText.trim()) {
      const { amount, date } = parseAmountAndDate(rawText);
      suggestions = {
        type: 'expense',
        amount: amount ?? null,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        category: 'General',
      };
    }

    return res.status(200).json({
      message: 'Uploaded',
      file: rel,
      suggestions,
      rawText,
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};
