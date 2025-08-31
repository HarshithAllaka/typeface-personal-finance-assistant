const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/transactionController');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

router.use(auth);

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/analytics', ctrl.analytics);
router.get('/summary', auth, ctrl.summary);

// Multer for PDF import
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/import-pdf', upload.single('file'), ctrl.importPdf);

module.exports = router;
