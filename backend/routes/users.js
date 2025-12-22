const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');

router.get('/sales', authenticateToken, userController.getSalesUsers);
router.get('/customers', authenticateToken, userController.getCustomers);

module.exports = router;