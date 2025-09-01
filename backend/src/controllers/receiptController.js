// backend/src/controllers/receiptController.js
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const pdfParse = require('pdf-parse');
const { parseAmountAndDate } = require('../utils/parseReceipt');

// lazy-load helpers if present
let runOcr = null;
let extractTextWithPdfjs = null;
try { ({ runOcr } = require('../services/ocr')); } catch (_) {}
try { ({ extractTextWithPdfjs } = require('../services/pdfx')); } catch (_) {}

async function writeTemp(buffer, ext = '') {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'finsight-'));
  const filePath = path.join(dir, `upload${ext}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field "file")' });

    const { buffer, mimetype = '', originalname = '' } = req.file;
    const ext = path.extname(originalname).toLowerCase();
    const type = mimetype.toLowerCase();

    const isPdf = ext === '.pdf' || type.includes('pdf');
    const isImage =
      type.startsWith('image/') ||
      ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'].includes(ext);

    let rawText = '';
    let warning;

    if (isPdf) {
      // parse PDF directly from buffer
      try {
        const data = await pdfParse(buffer);
        rawText = (data.text || '').trim();
      } catch (e1) {
        // optional fallback if you have a PDF.js helper that takes a path
        if (extractTextWithPdfjs) {
          let tmp;
          try {
            tmp = await writeTemp(buffer, '.pdf');
            rawText = await extractTextWithPdfjs(tmp);
          } catch (e2) {
            warning = `PDF parsing failed (${e1.message}).`;
          } finally {
            if (tmp) try { await fs.rm(path.dirname(tmp), { recursive: true, force: true }); } catch {}
          }
        } else {
          warning = `PDF parsing failed (${e1.message}).`;
        }
      }
    } else if (isImage) {
      if (!runOcr) {
        warning = 'OCR helper not installed. Upload a PDF or add OCR service.';
      } else {
        let tmp;
        try {
          tmp = await writeTemp(buffer, ext || '.png');
          rawText = await runOcr(tmp);
        } catch (e) {
          warning = `OCR failed (${e.message}).`;
        } finally {
          if (tmp) try { await fs.rm(path.dirname(tmp), { recursive: true, force: true }); } catch {}
        }
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

    return res.status(200).json({
      message: 'Uploaded',
      suggestions,
      rawText,
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    console.error('[receipts.upload] unhandled error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};
