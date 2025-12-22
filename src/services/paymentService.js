import api from './api';

export const paymentService = {
  createPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },
  
  getPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },
  
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  }
};