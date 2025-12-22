const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/roleCheck');

router.get('/customers', authenticateToken, requirePermission('canViewAllLedgers'), ledgerController.getAllCustomerBalances);
router.get('/user/:user_id', authenticateToken, ledgerController.getLedger);
router.get('/balance/:user_id', authenticateToken, ledgerController.getBalance);

module.exports = router;