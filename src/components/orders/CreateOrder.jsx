import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { billService } from '../../services/billService';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CreateOrder = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);

  const canCreateForOthers = hasPermission('canCreateOrderForOthers');

  const [formData, setFormData] = useState({
    user_id: user?.id, // default to current user
    store_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    remarks: '',
    items: [{ product_id: '', quantity: 1, rate: 0, unit_value: 1.0 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.user_id) {
      fetchProductsWithPricing();
    }
  }, [formData.user_id]);

  const fetchData = async () => {
    try {
      const [customersRes, storesRes] = await Promise.all([
        billService.getCustomers(),
        billService.getStores()
      ]);
      if (customersRes.success) setCustomers(customersRes.data);
      if (storesRes.success) setStores(storesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchProductsWithPricing = async () => {
    try {
      const response = await orderService.getProductsWithPricing(formData.user_id);
      if (response.success) setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, rate: 0, unit_value: 1.0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].rate = product.product_price;
        newItems[index].unit_value = product.unit_value;
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await orderService.createOrder(formData);
      if (response.success) {
        alert('Order created successfully!');
        navigate('/orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-5 h-5" />
        Back to Orders
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Order</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer dropdown always visible */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer * <span className="text-xs text-gray-500">(Search by typing)</span>
              </label>
              <select
                value={formData.user_id}
                onChange={(e) => canCreateForOthers && setFormData({ ...formData, user_id: e.target.value })}
                disabled={!canCreateForOthers} // editable only if allowed
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canCreateForOthers ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.contact} ({c.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Store *</label>
              <select
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Order Date *</label>
              <input
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Delivery</label>
              <input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {formData.user_id && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Order Items</h2>
                  <button type="button" onClick={addItem} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Product *</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - Rs. {product.product_price}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Rate</label>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                            disabled={formData.items.length === 1}
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-right">
                        <span className="text-sm text-gray-600">Line Total: </span>
                        <span className="font-semibold text-gray-800">
                          Rs. {(item.quantity * item.rate).toLocaleString('en-NP')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks (Optional)</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Add any special instructions..."
                />
              </div>

              <div className="bg-gray-100 p-6 rounded-lg mb-6 mt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">Rs. {calculateTotal().toLocaleString('en-NP')}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-4">
            <button type="submit" disabled={loading || !formData.user_id} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
              {loading ? 'Creating Order...' : 'Create Order'}
            </button>
            <button type="button" onClick={() => navigate('/orders')} className="px-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
