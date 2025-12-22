const pool = require('../config/database');
const { ROLES } = require('../config/roles');

// Create Payment (with automatic ledger entry)
exports.createPayment = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      payer_user_id,
      payment_date,
      amount_paid,
      payment_method,
      transaction_id = null,
      remarks = ''
    } = req.body;
    
    const received_by = req.user.id;
    
    if (!payer_user_id || !payment_date || !amount_paid || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const [paymentResult] = await connection.query(
      `INSERT INTO payments (
        payer_user_id, payment_date, amount_paid, payment_method,
        transaction_id, received_by, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [payer_user_id, payment_date, amount_paid, payment_method, transaction_id, received_by, remarks]
    );
    
    const payment_id = paymentResult.insertId;
    
    const [userRows] = await connection.query(
      'SELECT name, business_id, store_id FROM users WHERE id = ?',
      [payer_user_id]
    );
    
    if (userRows.length === 0) {
      throw new Error('User not found');
    }
    
    const { name: user_name, business_id, store_id } = userRows[0];
    
    const [ledgerRows] = await connection.query(
      `SELECT balance_after FROM ledger 
       WHERE user_id = ? 
       ORDER BY created_at DESC, id DESC 
       LIMIT 1`,
      [payer_user_id]
    );
    
    const previous_balance = ledgerRows.length > 0 ? ledgerRows[0].balance_after : 0;
    const new_balance = previous_balance - amount_paid;
    
    await connection.query(
      `INSERT INTO ledger (
        business_id, store_id, user_id, user_name, reference_id,
        entry_type, amount, balance_after, remarks
      ) VALUES (?, ?, ?, ?, ?, 'Credit', ?, ?, ?)`,
      [business_id, store_id || req.user.store_id, payer_user_id, user_name, payment_id,
       amount_paid, new_balance, remarks || 'Payment received']
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment_id,
        amount_paid,
        new_balance,
        previous_balance
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get Payments
exports.getPayments = async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;
    const userRoleId = req.user.role_id;
    
    let query = `
      SELECT 
        p.id, p.payment_date, p.amount_paid, p.payment_method,
        p.transaction_id, p.remarks,
        payer.name as payer_name, payer.id as payer_id,
        receiver.name as received_by_name
      FROM payments p
      JOIN users payer ON p.payer_user_id = payer.id
      LEFT JOIN users receiver ON p.received_by = receiver.id
      WHERE payer.business_id = ?
    `;
    
    const params = [req.user.business_id];
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      query += ' AND p.payer_user_id = ?';
      params.push(req.user.id);
    } else if (user_id) {
      query += ' AND p.payer_user_id = ?';
      params.push(user_id);
    }
    
    if (start_date) {
      query += ' AND p.payment_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND p.payment_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY p.payment_date DESC, p.created_at DESC';
    
    const [payments] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: payments
    });
    
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

// Get Payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRoleId = req.user.role_id;
    
    let query = `
      SELECT 
        p.*,
        payer.name as payer_name, payer.contact as payer_contact,
        payer.address as payer_address,
        receiver.name as received_by_name
      FROM payments p
      JOIN users payer ON p.payer_user_id = payer.id
      LEFT JOIN users receiver ON p.received_by = receiver.id
      WHERE p.id = ? AND payer.business_id = ?
    `;
    
    const params = [id, req.user.business_id];
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      query += ' AND p.payer_user_id = ?';
      params.push(req.user.id);
    }
    
    const [payments] = await pool.query(query, params);
    
    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or access denied'
      });
    }
    
    res.json({
      success: true,
      data: payments[0]
    });
    
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      error: error.message
    });
  }
};