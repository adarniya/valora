import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(id);
      if (response.success) {
        setOrder(response.data);
        setNewStatus(response.data.status);
      }
    } catch (err) {
      setError('Failed to fetch order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === order.status) {
      alert('Status is the same. No changes made.');
      return;
    }

    try {
      setUpdating(true);
      const response = await orderService.updateOrderStatus(id, {
        status: newStatus,
        remarks: statusRemarks
      });
      
      if (response.success) {
        alert('Order status updated successfully!');
        fetchOrder();
        setStatusRemarks('');
      }
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Processing: 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error || 'Order not found'}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Orders
      </button>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="border-b pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{order.business_name}</h1>
              <p className="text-gray-600">{order.store_name}</p>
              <p className="text-gray-600">{order.store_address}</p>
              <p className="text-gray-600 font-semibold mt-2">Contact: +977 9704569900</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600">ORDER</h2>
              <p className="text-gray-600 mt-2">#{order.order_number}</p>
              <p className="text-gray-600">Date: {formatDate(order.order_date)}</p>
              {order.expected_delivery_date && (
                <p className="text-gray-600">Expected: {formatDate(order.expected_delivery_date)}</p>
              )}
              <div className="mt-3">
                <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">ORDER FOR:</h3>
          <p className="text-lg font-semibold text-gray-800">{order.customer_name}</p>
          <p className="text-gray-600">{order.customer_contact}</p>
          <p className="text-gray-600">{order.customer_address}</p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">Created by: <span className="font-semibold">{order.created_by_name}</span></p>
        </div>

        <div className="mb-6">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Quantity</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Unit</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Rate</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-3 text-gray-800">{item.product_name}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.base_unit_qty} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.rate)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    {formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between pt-2 border-t-2 border-gray-300">
              <span className="text-lg font-bold text-gray-800">Total:</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {order.remarks && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Remarks / History:</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{order.remarks}</p>
          </div>
        )}

        {hasPermission('canViewReports') && order.status !== 'Completed' && order.status !== 'Cancelled' && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Order Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks (Optional)</label>
                <input
                  type="text"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Add reason for status change..."
                />
              </div>
            </div>
            <button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === order.status}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;