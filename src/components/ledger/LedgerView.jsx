import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ledgerService } from '../../services/ledgerService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ArrowLeft, Printer } from 'lucide-react';

const LedgerView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLedger();
  }, [userId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const response = await ledgerService.getLedger(userId);
      if (response.success) {
        setLedgerData(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ledger');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-8">Loading ledger...</div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  }

  const customer = ledgerData?.customer;
  const ledger = ledgerData?.ledger || [];
  const currentBalance = ledger.length > 0 ? ledger[ledger.length - 1].balance_after : customer?.opening_balance || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="no-print mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Ledger
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Customer Ledger</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Customer Name</p>
            <p className="text-lg font-semibold text-gray-800">{customer?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Contact</p>
            <p className="text-lg font-semibold text-gray-800">{customer?.contact}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="text-lg font-semibold text-gray-800">{customer?.address || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(currentBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Remarks</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Debit</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Credit</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                ledger.map((entry) => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDateTime(entry.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        entry.entry_type === 'Debit' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.entry_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.remarks}
                      {entry.bill_number && ` (${entry.bill_number})`}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {entry.entry_type === 'Debit' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {entry.entry_type === 'Credit' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      {formatCurrency(entry.balance_after)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {ledger.length > 0 && (
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right">Current Balance:</td>
                  <td colSpan="3" className={`px-4 py-3 text-right text-lg ${
                    currentBalance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(currentBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default LedgerView;