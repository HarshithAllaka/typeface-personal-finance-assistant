const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/transactionController');

router.use(auth);

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/analytics', ctrl.analytics);

module.exports = router;
