import api from './api';

export const userService = {
  getSalesUsers: async () => {
    const response = await api.get('/users/sales');
    return response.data;
  },
  
  getCustomers: async () => {
    const response = await api.get('/users/customers');
    return response.data;
  }
};