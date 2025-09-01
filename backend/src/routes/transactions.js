// backend/src/routes/transactions.js
const router = require('express').Router();
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/transactionController');

router.use(auth);

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/analytics', ctrl.analytics);
router.get('/summary', ctrl.summary);

// For import-pdf we also use memory storage (no disk dependency)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

router.post('/import-pdf', upload.single('file'), ctrl.importPdf);

module.exports = router;
