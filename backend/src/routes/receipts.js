const express = require('express');
const router = express.Router();
const path = require('path');
const os = require('os');
const fs = require('fs');
const multer = require('multer');
// const auth = require('../middleware/auth'); // re-enable later after debug
const receiptController = require('../controllers/receiptController');

// Safe writable dir on Render
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(os.tmpdir(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const base = (file.originalname || 'file').replace(/\s+/g, '_');
    const ext = path.extname(base) || '';
    cb(null, `${ts}_${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const type = (file.mimetype || '').toLowerCase();
    if (type === 'application/pdf' || name.endsWith('.pdf') || type.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only PDF or image files are allowed'));
  }
});

// NOTE: field name must be "file"
// router.post('/upload', auth, upload.single('file'), receiptController.upload);
router.post('/upload', upload.single('file'), receiptController.upload);

module.exports = router;
