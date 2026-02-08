const generateBillNumber = async (connection, business_id, store_id) => {
  const currentYear = new Date().getFullYear();
  
  const [storeRows] = await connection.query(
    'SELECT name FROM stores WHERE id = ?',
    [store_id]
  );
  
  const storeName = storeRows[0]?.name || 'STORE';
  
  console.log('🔍 DEBUG: Searching for bills with:');
  console.log('   business_id:', business_id);
  console.log('   store_id:', store_id);
  console.log('   currentYear:', currentYear);
  
  // Changed: Look for bill numbers that contain the current year instead of filtering by bill_date
  const [rows] = await connection.query(
    `SELECT bill_number FROM bills 
     WHERE business_id = ? AND store_id = ? AND bill_number LIKE ?
     ORDER BY bill_number DESC LIMIT 1`,
    [business_id, store_id, `%-${currentYear}-%`]
  );
  
  console.log('📋 DEBUG: Query returned:', rows.length, 'rows');
  if (rows.length > 0) {
    console.log('   Found bill:', rows[0].bill_number);
  } else {
    console.log('   No bills found for year', currentYear);
  }
  
  let billNumber = 1;
  
  if (rows.length > 0) {
    const lastBillNumber = rows[0].bill_number;
    const parts = lastBillNumber.split('-');
    const lastNumber = parseInt(parts[parts.length - 1]) || 0;
    
    console.log('🔢 DEBUG: Extracted number:', lastNumber);
    console.log('   Next number will be:', lastNumber + 1);
    
    billNumber = lastNumber + 1;
  }
  
  const newBillNumber = `${storeName}-${currentYear}-${String(billNumber).padStart(5, '0')}`;
  console.log('✨ DEBUG: Generated bill number:', newBillNumber);
  
  return newBillNumber;
};

module.exports = { generateBillNumber };