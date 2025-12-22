import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { Package, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ProductList = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'piece',
    unit_value: 1,
    product_price: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await productService.createProduct(formData);
      if (response.success) {
        alert('Product added successfully!');
        setShowAddForm(false);
        setFormData({ name: '', sku: '', unit: 'piece', unit_value: 1, product_price: 0 });
        fetchProducts();
      }
    } catch (err) {
      alert('Failed to add product');
    }
  };

  if (loading) return <div className="text-center py-8">Loading products...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        {hasPermission('canManageProducts') && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Product</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">SKU *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="piece">Piece</option>
                <option value="liter">Liter</option>
                <option value="kg">KG</option>
                <option value="meter">Meter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Unit Value *</label>
              <input
                type="number"
                value={formData.unit_value}
                onChange={(e) => setFormData({ ...formData, unit_value: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Price *</label>
              <input
                type="number"
                value={formData.product_price}
                onChange={(e) => setFormData({ ...formData, product_price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                step="0.01"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
                Add Product
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Product Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Unit</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Unit Value</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No products found. Add your first product!
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{product.sku}</td>
                  <td className="px-6 py-4 text-gray-700">{product.unit}</td>
                  <td className="px-6 py-4 text-right text-gray-700">{product.unit_value}</td>
                  <td className="px-6 py-4 text-right font-semibold">{formatCurrency(product.product_price)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;