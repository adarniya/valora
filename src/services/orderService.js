import api from './api';

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  updateOrderStatus: async (id, statusData) => {
    const response = await api.patch(`/orders/${id}/status`, statusData);
    return response.data;
  },
  
  getProductsWithPricing: async (userId) => {
    const response = await api.get('/orders/products/pricing', { params: { user_id: userId } });
    return response.data;
  }
};