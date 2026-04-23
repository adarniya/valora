const pool = require('../config/database');

// GET all permissions grouped by role
exports.getRolePermissions = async (req, res) => {
  try {
    const [permissions] = await pool.query(`SELECT permission_id, permission_name FROM permissions ORDER BY permission_id`);
    const [roles] = await pool.query(`SELECT id as role_id, role_name FROM roles ORDER BY id`);
    const [rolePerms] = await pool.query(`SELECT role_id, permission_id FROM role_permissions`);

    // Build map: role_id -> Set of permission_ids
    const map = {};
    rolePerms.forEach(({ role_id, permission_id }) => {
      if (!map[role_id]) map[role_id] = new Set();
      map[role_id].add(permission_id);
    });

    const result = roles.map(role => ({
      ...role,
      permissions: permissions.map(p => ({
        ...p,
        granted: map[role.role_id]?.has(p.permission_id) ?? false
      }))
    }));

    res.json({ success: true, data: { permissions, roles: result } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update permissions for a role
exports.updateRolePermissions = async (req, res) => {
  const { role_id } = req.params;
  const { permission_ids } = req.body; // array of granted permission_ids

  // Protect super admin (role_id = 1)
  if (parseInt(role_id) === 1) {
    return res.status(403).json({ success: false, message: 'Cannot modify Super Admin permissions' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM role_permissions WHERE role_id = ?`, [role_id]);
    if (permission_ids && permission_ids.length > 0) {
      const values = permission_ids.map(pid => [parseInt(role_id), pid]);
      await conn.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ?`, [values]);
    }
    await conn.commit();
    res.json({ success: true, message: 'Permissions updated' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};