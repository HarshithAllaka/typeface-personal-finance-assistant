const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const receiptController = require('../controllers/receiptController');

// disk storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const base = (file.originalname || 'file').replace(/\s+/g, '_');
    const ext = path.extname(base) || '';
    cb(null, `${ts}_${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/receipts/upload  -> multer.single('file') then controller
router.post('/upload', upload.single('file'), receiptController.upload);

module.exports = router;
