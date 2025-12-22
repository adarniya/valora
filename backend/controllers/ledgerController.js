const pool = require('../config/database');
const { ROLES } = require('../config/roles');

// Get Ledger for a user
exports.getLedger = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { start_date, end_date } = req.query;
    const userRoleId = req.user.role_id;
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      if (parseInt(user_id) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own ledger.'
        });
      }
    }
    
    let query = `
      SELECT 
        l.id,
        l.created_at as date,
        l.entry_type,
        l.amount,
        l.balance_after,
        l.remarks,
        l.reference_id,
        CASE 
          WHEN l.entry_type = 'Debit' THEN b.bill_number
          ELSE NULL
        END AS bill_number
      FROM ledger l
      LEFT JOIN bills b ON l.entry_type = 'Debit' AND l.reference_id = b.id
      WHERE l.user_id = ? AND l.business_id = ?
    `;
    
    const params = [user_id, req.user.business_id];
    
    if (start_date) {
      query += ' AND l.created_at >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND l.created_at <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY l.created_at ASC, l.id ASC';
    
    const [ledgerEntries] = await pool.query(query, params);
    
    const [userInfo] = await pool.query(
      'SELECT id, name, contact, address, opening_balance FROM users WHERE id = ?',
      [user_id]
    );
    
    res.json({
      success: true,
      data: {
        customer: userInfo[0],
        ledger: ledgerEntries
      }
    });
    
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ledger',
      error: error.message
    });
  }
};

// Get current balance for a user
exports.getBalance = async (req, res) => {
  try {
    const { user_id } = req.params;
    const userRoleId = req.user.role_id;
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      if (parseInt(user_id) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own balance.'
        });
      }
    }
    
    const [rows] = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.contact,
        u.opening_balance,
        COALESCE(MAX(l.balance_after), u.opening_balance) AS current_balance,
        (
          SELECT COUNT(*) 
          FROM bills b 
          WHERE b.user_id = u.id
        ) AS total_bills,
        (
          SELECT COUNT(*) 
          FROM payments p 
          WHERE p.payer_user_id = u.id
        ) AS total_payments,
        (
          SELECT SUM(b.total_amount)
          FROM bills b
          WHERE b.user_id = u.id
        ) AS total_billed,
        (
          SELECT SUM(p.amount_paid)
          FROM payments p
          WHERE p.payer_user_id = u.id
        ) AS total_paid
      FROM users u
      LEFT JOIN ledger l ON u.id = l.user_id
      WHERE u.id = ? AND u.business_id = ?
      GROUP BY u.id, u.name, u.contact, u.opening_balance`,
      [user_id, req.user.business_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance',
      error: error.message
    });
  }
};

// Get all customers with balances
exports.getAllCustomerBalances = async (req, res) => {
  try {
    const userRoleId = req.user.role_id;
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const [customers] = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.contact,
        r.role_name,
        COALESCE(MAX(l.balance_after), u.opening_balance) AS current_balance,
        (
          SELECT COUNT(*) 
          FROM bills b 
          WHERE b.user_id = u.id
        ) AS total_bills
      FROM users u
      LEFT JOIN ledger l ON u.id = l.user_id
      JOIN roles r ON u.role_id = r.id
      WHERE u.business_id = ? AND u.role_id IN (5, 6)
      GROUP BY u.id, u.name, u.contact, r.role_name, u.opening_balance
      HAVING current_balance > 0 OR total_bills > 0
      ORDER BY current_balance DESC`,
      [req.user.business_id]
    );
    
    res.json({
      success: true,
      data: customers
    });
    
  } catch (error) {
    console.error('Error fetching customer balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer balances',
      error: error.message
    });
  }
};