const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Helper: fetch permissions array from DB for a role
const getRolePermissions = async (role_id) => {
  const [rows] = await pool.query(
    `SELECT p.permission_name 
     FROM role_permissions rp
     JOIN permissions p ON rp.permission_id = p.permission_id
     WHERE rp.role_id = ?`,
    [role_id]
  );
  return rows.map(r => r.permission_name);
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const [users] = await pool.query(
      `SELECT u.id, u.username, u.password, u.name, u.email, u.role_id,
              u.business_id, u.store_id, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = users[0];

    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role_id: user.role_id, business_id: user.business_id, store_id: user.store_id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Super admin (role_id=1) gets ALL permissions hardcoded
    let permissions;
    if (user.role_id === 1) {
      const [allPerms] = await pool.query(`SELECT permission_name FROM permissions`);
      permissions = allPerms.map(r => r.permission_name);
    } else {
      permissions = await getRolePermissions(user.role_id);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role_name,
          business_id: user.business_id,
          store_id: user.store_id,
          permissions // array: ['create_bills', 'view_all_payments', ...]
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// Get current user info
exports.getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.role_id, u.contact,
              u.business_id, u.store_id, r.role_name, b.name as business_name,
              s.name as store_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN businesses b ON u.business_id = b.id
       LEFT JOIN stores s ON u.store_id = s.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    let permissions;
    if (user.role_id === 1) {
      const [allPerms] = await pool.query(`SELECT permission_name FROM permissions`);
      permissions = allPerms.map(r => r.permission_name);
    } else {
      permissions = await getRolePermissions(user.role_id);
    }

    res.json({ success: true, data: { ...user, permissions } });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user info', error: error.message });
  }
};