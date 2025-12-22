const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/roleCheck');

router.post('/', authenticateToken, requirePermission('canRecordPayments'), paymentController.createPayment);
router.get('/', authenticateToken, paymentController.getPayments);
router.get('/:id', authenticateToken, paymentController.getPaymentById);

module.exports = router;