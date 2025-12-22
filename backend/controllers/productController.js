const pool = require('../config/database');

exports.getProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT * FROM products WHERE business_id = ? ORDER BY name`,
      [req.user.business_id]
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

exports.createProduct = async (req, res) => {
  try {
    const { name, sku, unit, unit_value, product_price } = req.body;
    const business_id = req.user.business_id;
    
    const [result] = await pool.query(
      `INSERT INTO products (business_id, name, sku, unit, unit_value, product_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [business_id, name, sku, unit, unit_value, product_price]
    );
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};