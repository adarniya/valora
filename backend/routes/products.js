const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/roleCheck');

router.get('/', authenticateToken, productController.getProducts);
router.post('/', authenticateToken, requirePermission('canManageProducts'), productController.createProduct);

module.exports = router;