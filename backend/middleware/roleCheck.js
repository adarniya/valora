const { hasPermission } = require('../config/roles');

const requirePermission = (permission) => {
  return (req, res, next) => {
    const userRoleId = req.user.role_id;
    if (!hasPermission(userRoleId, permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`
      });
    }
    next();
  };
};

const requireOwnDataOrPermission = (permission) => {
  return (req, res, next) => {
    const userRoleId = req.user.role_id;
    const requestedUserId = req.params.user_id || req.query.user_id || req.body.user_id;
    if (hasPermission(userRoleId, permission)) {
      return next();
    }
    if (requestedUserId && parseInt(requestedUserId) === req.user.id) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.'
    });
  };
};

module.exports = { requirePermission, requireOwnDataOrPermission };