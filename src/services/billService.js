import api from './api';

export const billService = {
  createBill: async (billData) => {
    const response = await api.post('/bills', billData);
    return response.data;
  },
  
  getBills: async (params = {}) => {
    const response = await api.get('/bills', { params });
    return response.data;
  },
  
  getBillById: async (id) => {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },
  
  getCustomers: async () => {
    const response = await api.get('/bills/customers');
    return response.data;
  },
  
  getStores: async () => {
    const response = await api.get('/bills/stores');
    return response.data;
  }
};