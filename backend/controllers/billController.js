const pool = require('../config/database');
const { hasPermission, ROLES } = require('../config/roles');
const { generateBillNumber } = require('../utils/generateBillNumber');

// Create Bill
exports.createBill = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      user_id,
      bill_date,
      items,
      vat_percentage = 13
    } = req.body;
    
    const business_id = req.user.business_id;
    const store_id = req.user.store_id;
    const sales_by = req.user.id; // Person who created the bill
    
    if (!user_id || !bill_date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    let sub_total = 0;
    let total_quantity = 0;
    let total_items = 0;
    
    const billItems = items.map(item => {
      const line_total = item.quantity * item.rate;
      const base_unit_qty = item.quantity * item.unit_value;
      
      sub_total += line_total;
      total_quantity += base_unit_qty;
      total_items += item.quantity;
      
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        base_unit_qty,
        rate: item.rate,
        line_total
      };
    });
    
    const vat_total = 0;
    const total_amount = sub_total ;
    
    const bill_number = await generateBillNumber(connection, business_id, store_id);
    
    const [billResult] = await connection.query(
      `INSERT INTO bills (
        business_id, store_id, user_id, bill_number, bill_date,
        sub_total, vat_total, total_amount, total_quantity, total_items, sales_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [business_id, store_id, user_id, bill_number, bill_date,
       sub_total, vat_total, total_amount, total_quantity, total_items, sales_by]
    );
    
    const bill_id = billResult.insertId;
    
    for (const item of billItems) {
      await connection.query(
        `INSERT INTO bill_items (
          bill_id, product_id, quantity, base_unit_qty, rate, line_total
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [bill_id, item.product_id, item.quantity, item.base_unit_qty, item.rate, item.line_total]
      );
    }
    
    const [userRows] = await connection.query(
      'SELECT name FROM users WHERE id = ?',
      [user_id]
    );
    const user_name = userRows[0].name;
    
    const [ledgerRows] = await connection.query(
      `SELECT balance_after FROM ledger 
       WHERE user_id = ? 
       ORDER BY created_at DESC, id DESC 
       LIMIT 1`,
      [user_id]
    );
    
    const previous_balance = ledgerRows.length > 0 ? ledgerRows[0].balance_after : 0;
    const new_balance = previous_balance + total_amount;
    
    await connection.query(
      `INSERT INTO ledger (
        business_id, store_id, user_id, user_name, reference_id,
        entry_type, amount, balance_after, remarks
      ) VALUES (?, ?, ?, ?, ?, 'Debit', ?, ?, ?)`,
      [business_id, store_id, user_id, user_name, bill_id,
       total_amount, new_balance, `Bill ${bill_number}`]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: {
        bill_id,
        bill_number,
        total_amount,
        new_balance
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get Bills
exports.getBills = async (req, res) => {
  try {
    const { user_id, start_date, end_date, store_id } = req.query;
    const userRoleId = req.user.role_id;
    
    let query = `
      SELECT 
        b.id, b.bill_number, b.bill_date, b.sub_total, b.vat_total,
        b.total_amount, b.total_quantity, b.total_items,
        u.name as customer_name, u.id as customer_id,
        s.name as store_name,
        sales.name as sales_person
      FROM bills b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN stores s ON b.store_id = s.id
      LEFT JOIN users sales ON b.sales_by = sales.id
      WHERE b.business_id = ?
    `;
    
    const params = [req.user.business_id];
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      query += ' AND b.user_id = ?';
      params.push(req.user.id);
    } else if (user_id) {
      query += ' AND b.user_id = ?';
      params.push(user_id);
    }
    
    if (store_id) {
      query += ' AND b.store_id = ?';
      params.push(store_id);
    }
    
    if (start_date) {
      query += ' AND b.bill_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND b.bill_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY b.bill_date DESC, b.created_at DESC';
    
    const [bills] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: bills
    });
    
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

// Get Single Bill
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRoleId = req.user.role_id;
    
    let query = `
      SELECT 
        b.*, 
        u.name as customer_name, u.contact as customer_contact,
        u.address as customer_address,
        s.name as store_name, s.address as store_address,
        sales.name as sales_person,
        bus.name as business_name, bus.vat_number
      FROM bills b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN stores s ON b.store_id = s.id
      LEFT JOIN users sales ON b.sales_by = sales.id
      LEFT JOIN businesses bus ON b.business_id = bus.id
      WHERE b.id = ? AND b.business_id = ?
    `;
    
    const params = [id, req.user.business_id];
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      query += ' AND b.user_id = ?';
      params.push(req.user.id);
    }
    
    const [bills] = await pool.query(query, params);
    
    if (bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found or access denied'
      });
    }
    
    const [items] = await pool.query(
      `SELECT 
        bi.*, p.name as product_name, p.unit
      FROM bill_items bi
      JOIN products p ON bi.product_id = p.id
      WHERE bi.bill_id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...bills[0],
        items
      }
    });
    
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
};

// Get customers for dropdown
exports.getCustomers = async (req, res) => {
  try {
    const [customers] = await pool.query(
      `SELECT id, name, username, contact 
       FROM users 
       WHERE business_id = ? AND role_id IN (5, 6)
       ORDER BY name`,
      [req.user.business_id]
    );
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get stores for dropdown
exports.getStores = async (req, res) => {
  try {
    const [stores] = await pool.query(
      `SELECT id, name, address 
       FROM stores 
       WHERE business_id = ?
       ORDER BY name`,
      [req.user.business_id]
    );
    
    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};