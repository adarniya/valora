const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { PERMISSIONS } = require('../config/roles');

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Get user from database
    const [users] = await pool.query(
      `SELECT 
        u.id, u.username, u.password, u.name, u.email, u.role_id,
        u.business_id, u.store_id, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = users[0];

    // Verify password
   if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        business_id: user.business_id,
        store_id: user.store_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get user permissions
    const permissions = PERMISSIONS[user.role_id];

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
          permissions
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user info
exports.getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT 
        u.id, u.username, u.name, u.email, u.role_id, u.contact,
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
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    const permissions = PERMISSIONS[user.role_id];

    res.json({
      success: true,
      data: {
        ...user,
        permissions
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user info',
      error: error.message
    });
  }
};