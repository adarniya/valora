const pool = require('../config/database');
const { ROLES } = require('../config/roles');

// Generate order number
const generateOrderNumber = async (connection, business_id, store_id) => {
  const currentYear = new Date().getFullYear();
  
  const [storeRows] = await connection.query(
    'SELECT name FROM stores WHERE id = ?',
    [store_id]
  );
  
  const storeName = storeRows[0]?.name || 'STORE';
  
  const [rows] = await connection.query(
    `SELECT order_number FROM orders 
     WHERE business_id = ? AND store_id = ? AND YEAR(order_date) = ?
     ORDER BY created_at DESC LIMIT 1`,
    [business_id, store_id, currentYear]
  );
  
  let orderNumber = 1;
  
  if (rows.length > 0) {
    const lastOrderNumber = rows[0].order_number;
    const parts = lastOrderNumber.split('-');
    const lastNumber = parseInt(parts[parts.length - 1]) || 0;
    orderNumber = lastNumber + 1;
  }
  
  return `${storeName}-ORD-${currentYear}-${String(orderNumber).padStart(5, '0')}`;
};

// Create Order
// Create Order
exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      user_id,
      store_id,
      order_date,
      expected_delivery_date,
      items,
      remarks
    } = req.body;

    const business_id = req.user.business_id;
    const created_by = req.user.id;

    if (!user_id || !store_id || !order_date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // --- NEW PERMISSION CHECK ---
    const targetUserId = parseInt(user_id);
    const canCreateForOthers = hasPermission(req.user.role_id, 'canCreateOrderForOthers');

    if (!canCreateForOthers && targetUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create orders for yourself.'
      });
    }

    let sub_total = 0;
    let total_quantity = 0;
    let total_items = 0;

    const orderItems = items.map(item => {
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

    const total_amount = sub_total;
    const order_number = await generateOrderNumber(connection, business_id, store_id);

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        business_id, store_id, user_id, order_number, order_date,
        expected_delivery_date, sub_total, total_amount, total_quantity, 
        total_items, created_by, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [business_id, store_id, user_id, order_number, order_date,
       expected_delivery_date, sub_total, total_amount, total_quantity, 
       total_items, created_by, remarks]
    );

    const order_id = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, base_unit_qty, rate, line_total
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, item.product_id, item.quantity, item.base_unit_qty, item.rate, item.line_total]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order_id,
        order_number,
        total_amount
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  } finally {
    connection.release();
  }
};


// Get Orders
exports.getOrders = async (req, res) => {
  try {
    const { user_id, status } = req.query;
    const userRoleId = req.user.role_id;
    
    let query = `
      SELECT 
        o.id, o.order_number, o.order_date, o.expected_delivery_date,
        o.status, o.total_amount, o.total_quantity, o.total_items,
        u.name as customer_name, u.id as customer_id,
        s.name as store_name,
        creator.name as created_by_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN users creator ON o.created_by = creator.id
      WHERE o.business_id = ?
    `;
    
    const params = [req.user.business_id];
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      query += ' AND o.user_id = ?';
      params.push(req.user.id);
    } else if (user_id) {
      query += ' AND o.user_id = ?';
      params.push(user_id);
    }
    
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.order_date DESC, o.created_at DESC';
    
    const [orders] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: orders
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get Single Order
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRoleId = req.user.role_id;
    
    let query = `
      SELECT 
        o.*, 
        u.name as customer_name, u.contact as customer_contact,
        u.address as customer_address, u.role_id as customer_role_id,
        s.name as store_name, s.address as store_address,
        creator.name as created_by_name,
        bus.name as business_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN users creator ON o.created_by = creator.id
      LEFT JOIN businesses bus ON o.business_id = bus.id
      WHERE o.id = ? AND o.business_id = ?
    `;
    
    const params = [id, req.user.business_id];
    
    if ([ROLES.RETAILER, ROLES.WORKSHOP].includes(userRoleId)) {
      query += ' AND o.user_id = ?';
      params.push(req.user.id);
    }
    
    const [orders] = await pool.query(query, params);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }
    
    const [items] = await pool.query(
      `SELECT 
        oi.*, p.name as product_name, p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...orders[0],
        items
      }
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update Order Status
exports.updateOrderStatus = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status, remarks } = req.body;
    const updated_by = req.user.id;
    
    if (!['Pending', 'Processing', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Update order status
    await connection.query(
      `UPDATE orders 
       SET status = ?, remarks = CONCAT(IFNULL(remarks, ''), '\n[', NOW(), '] Status changed to ', ?, ' by user ID ', ?, IF(? != '', CONCAT(' - ', ?), ''))
       WHERE id = ? AND business_id = ?`,
      [status, status, updated_by, remarks || '', remarks || '', id, req.user.business_id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get products with role-based pricing
exports.getProductsWithPrice = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }
    
    // Get user role
    const [userRows] = await pool.query(
      'SELECT role_id FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userRole = userRows[0].role_id;
    
    // Get products with appropriate pricing
    const [products] = await pool.query(
      `SELECT 
        id, name, sku, unit, unit_value,
        CASE 
          WHEN ? = 5 THEN retail_price
          WHEN ? = 6 THEN workshop_price
          ELSE product_price
        END as product_price
      FROM products 
      WHERE business_id = ? 
      ORDER BY name`,
      [userRole, userRole, req.user.business_id]
    );
    
    res.json({
      success: true,
      data: products
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Fixed export statement - includes all 5 functions
module.exports = { 
  createOrder: exports.createOrder,
  getOrders: exports.getOrders, 
  getOrderById: exports.getOrderById,
  updateOrderStatus: exports.updateOrderStatus,
  getProductsWithPrice: exports.getProductsWithPrice
};