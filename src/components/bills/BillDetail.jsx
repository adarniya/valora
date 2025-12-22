import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billService } from '../../services/billService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ArrowLeft, Printer } from 'lucide-react';

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const response = await billService.getBillById(id);
      if (response.success) {
        setBill(response.data);
      }
    } catch (err) {
      setError('Failed to fetch bill details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-8">Loading bill details...</div>;
  if (error || !bill)
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error || 'Bill not found'}
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="no-print mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/bills')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Bills
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Printer className="w-4 h-4" />
          Print Bill
        </button>
      </div>

      {/* PRINT AREA */}
      <div className="print-area bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="border-b pb-6 mb-6 flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">{bill.business_name}</h1>
            <p>{bill.store_name}</p>
            <p>{bill.store_address}</p>
            <p>VAT No: {bill.vat_number}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">INVOICE</h2>
            <p>#{bill.bill_number}</p>
            <p>Date: {formatDate(bill.bill_date)}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold">BILL TO</h3>
          <p className="text-lg font-semibold">{bill.customer_name}</p>
          <p>{bill.customer_contact}</p>
          <p>{bill.customer_address}</p>
        </div>

        {/* Items */}
        <table className="w-full border-collapse mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-center">Qty</th>
              <th className="px-4 py-2 text-right">Rate</th>
              <th className="px-4 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2">{item.product_name}</td>
                <td className="px-4 py-2 text-center">{item.quantity}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-2 text-right font-semibold">
                  {formatCurrency(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>Sub Total:</span>
              <span>{formatCurrency(bill.sub_total)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (13%):</span>
              <span>{formatCurrency(bill.vat_total)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Total:</span>
              <span>{formatCurrency(bill.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm">
          <p>Thank you for your business!</p>
          {bill.sales_person && <p>Sold by: {bill.sales_person}</p>}
        </div>
      </div>
    </div>
  );
};

export default BillDetail;
