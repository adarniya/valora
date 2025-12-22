const generateBillNumber = async (connection, business_id, store_id) => {
  // Get current year
  const currentYear = new Date().getFullYear();
  
  // Get FULL store name from database
  const [storeRows] = await connection.query(
    'SELECT name FROM stores WHERE id = ?',
    [store_id]
  );
  
  const storeName = storeRows[0]?.name || 'STORE';
  
  // Get the last bill number for this store and year
  const [rows] = await connection.query(
    `SELECT bill_number FROM bills 
     WHERE business_id = ? AND store_id = ? AND YEAR(bill_date) = ?
     ORDER BY created_at DESC LIMIT 1`,
    [business_id, store_id, currentYear]
  );
  
  let billNumber = 1;
  
  if (rows.length > 0) {
    const lastBillNumber = rows[0].bill_number;
    // Extract number from last part after last dash
    const parts = lastBillNumber.split('-');
    const lastNumber = parseInt(parts[parts.length - 1]) || 0;
    billNumber = lastNumber + 1;
  }
  
  // Format: STORENAME-2025-00001
  return `${storeName}-${currentYear}-${String(billNumber).padStart(5, '0')}`;
};

module.exports = { generateBillNumber };