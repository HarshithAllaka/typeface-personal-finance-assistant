const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');
const { parseAmountAndDate } = require('../utils/parseReceipt');

let runOcr = null;
let extractTextWithPdfjs = null;
// Lazy-load optional helpers; don't crash if they don't exist.
try { ({ runOcr } = require('../services/ocr')); } catch (_) {}
try { ({ extractTextWithPdfjs } = require('../services/pdfx')); } catch (_) {}

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field "file")' });

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const type = (req.file.mimetype || '').toLowerCase();
    const isPdf = ext === '.pdf' || type.includes('pdf');
    const isImage = type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);

    let rawText = '';
    let warning;

    if (isPdf) {
      // 1) Try pdf-parse with a Buffer
      try {
        const buf = await fs.readFile(req.file.path);
        const data = await pdfParse(buf);
        rawText = (data.text || '').trim();
      } catch (e1) {
        console.error('[receipts.upload] pdf-parse failed:', e1);
        // 2) Fallback to pdfjs if available
        if (extractTextWithPdfjs) {
          try {
            rawText = await extractTextWithPdfjs(req.file.path);
          } catch (e2) {
            console.error('[receipts.upload] pdfjs fallback failed:', e2);
            warning = `PDF parsing failed (${e1.message}).`;
          }
        } else {
          warning = `PDF parsing failed (${e1.message}). pdfjs helper not installed.`;
        }
      }
    } else if (isImage) {
      if (runOcr) {
        try {
          rawText = await runOcr(req.file.path);
        } catch (e) {
          console.error('[receipts.upload] OCR failed:', e);
          warning = `OCR failed (${e.message}).`;
        }
      } else {
        warning = 'OCR helper not installed. Upload a PDF or add OCR service.';
      }
    } else {
      warning = 'Unsupported file type. Please upload a PDF or image.';
    }

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

    // If nothing worked, still return 200 with warning so UI can show preview/issues
    return res.status(200).json({
      message: 'Uploaded',
      file: req.file.filename,
      suggestions,
      rawText,
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    console.error('[receipts.upload] unhandled error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};
