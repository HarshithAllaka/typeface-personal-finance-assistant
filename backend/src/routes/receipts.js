// backend/src/routes/receipts.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const receiptController = require('../controllers/receiptController');

// Use memory storage so we don't rely on ephemeral disk on Render
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const type = (file.mimetype || '').toLowerCase();
    if (type === 'application/pdf' || name.endsWith('.pdf') || type.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only PDF or image files are allowed'));
  },
});

// field name must be "file"
router.post('/upload', upload.single('file'), receiptController.upload);

module.exports = router;
