const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { getRolePermissions, updateRolePermissions } = require('../controllers/permissionController');

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({ success: false, message: 'Super Admin only' });
  }
  next();
};

router.get('/', authenticateToken, requireSuperAdmin, getRolePermissions);
router.put('/role/:role_id', authenticateToken, requireSuperAdmin, updateRolePermissions);

module.exports = router;