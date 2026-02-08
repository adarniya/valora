const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/roleCheck');

// Create order - Both users and allowed roles can create for others
router.post('/', authenticateToken, orderController.createOrder);

// Get orders - Everyone can view their own
router.get('/', authenticateToken, orderController.getOrders);

// Get single order
router.get('/:id', authenticateToken, orderController.getOrderById);

// Update order status - Only sales/admin/accountant
router.patch('/:id/status', authenticateToken, requirePermission('canViewReports'), orderController.updateOrderStatus);

// Get products with role-based pricing
router.get('/products/pricing', authenticateToken, orderController.getProductsWithPrice);

module.exports = router;
