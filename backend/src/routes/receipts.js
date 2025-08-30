const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/receiptController');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(auth);
router.post('/upload', upload.single('file'), ctrl.upload);
router.delete('/:filename', ctrl.remove);

module.exports = router;
