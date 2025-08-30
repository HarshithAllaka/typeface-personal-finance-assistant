const path = require('path');
const fs = require('fs');
const { extractTextFromImage } = require('../services/ocr');
const { extractTextFromPdf } = require('../services/pdfx');
const { parseAmountAndDate } = require('../utils/parseReceipt');

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.filename).toLowerCase();
    let text = '';
    if (ext === '.pdf') text = await extractTextFromPdf(req.file.path);
    else text = await extractTextFromImage(req.file.path);

    const { amount, date } = parseAmountAndDate(text);

    res.status(201).json({
      message: 'Uploaded',
      file: `/uploads/${req.file.filename}`,
      suggestions: { type: 'expense', amount, date, category: 'General' },
      rawText: text.slice(0, 5000)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const file = path.join(__dirname, '../../uploads', req.params.filename);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
