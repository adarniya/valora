const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/roleCheck');

router.post('/', authenticateToken, requirePermission('canCreateBills'), billController.createBill);
router.get('/', authenticateToken, billController.getBills);
router.get('/customers', authenticateToken, billController.getCustomers);
router.get('/stores', authenticateToken, billController.getStores);
router.get('/:id', authenticateToken, billController.getBillById);

module.exports = router;