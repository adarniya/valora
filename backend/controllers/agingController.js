const db = require('../config/database');

const getAgingReport = async (req, res) => {
  try {
    const { user } = req;
    const isCustomer = user.role_name === 'Retailer' || user.role_name === 'Customer';

    // Build WHERE clause based on role
    // Customers can only see their own data; admins/accountants see all
    const customerFilter = isCustomer ? `WHERE b.user_id = ?` : '';
    const queryParams = isCustomer ? [user.id] : [];

    const billsQuery = `
      SELECT
        b.id,
        b.bill_number,
        b.bill_date,
        b.total_amount,
        b.user_id,
        u.name        AS customer_name,
        u.username    AS customer_username,
        COALESCE(SUM(p.amount_paid), 0) AS total_paid,
        (b.total_amount - COALESCE(SUM(p.amount_paid), 0)) AS balance,
        DATEDIFF(CURDATE(), b.bill_date) AS days_outstanding
      FROM bills b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN payments p ON p.payer_user_id = b.user_id
        AND p.payment_date >= b.bill_date
      ${customerFilter}
      GROUP BY b.id, b.bill_number, b.bill_date, b.total_amount, b.user_id,
               u.name, u.username
      HAVING balance > 0
      ORDER BY u.name, b.bill_date ASC
    `;

    const [rows] = await db.execute(billsQuery, queryParams);

    // Group bills by customer
    const customersMap = {};
    for (const row of rows) {
      const key = row.user_id;
      if (!customersMap[key]) {
        customersMap[key] = {
          user_id:           row.user_id,
          customer_name:     row.customer_name,
          customer_username: row.customer_username,
          bills:             [],
          total_invoice:     0,
          total_paid:        0,
          total_balance:     0,
        };
      }
      const days   = row.days_outstanding;
      let   status = 'active';
      if (days > 45)  status = 'suspended';
      else if (days > 30) status = 'overaging';

      customersMap[key].bills.push({
        id:              row.id,
        bill_number:     row.bill_number,
        bill_date:       row.bill_date,
        invoice_amount:  parseFloat(row.total_amount),
        total_paid:      parseFloat(row.total_paid),
        balance:         parseFloat(row.balance),
        days_outstanding: days,
        status,
      });

      customersMap[key].total_invoice += parseFloat(row.total_amount);
      customersMap[key].total_paid    += parseFloat(row.total_paid);
      customersMap[key].total_balance += parseFloat(row.balance);
    }

    // Determine each customer's worst status
    const customers = Object.values(customersMap).map((c) => {
      const statuses = c.bills.map((b) => b.status);
      let   worstStatus = 'active';
      if (statuses.includes('suspended'))  worstStatus = 'suspended';
      else if (statuses.includes('overaging')) worstStatus = 'overaging';
      return { ...c, status: worstStatus };
    });

    return res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Aging report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch aging report' });
  }
};

module.exports = { getAgingReport };