import api from './api';

export const ledgerService = {
  getLedger: async (userId, params = {}) => {
    const response = await api.get(`/ledger/user/${userId}`, { params });
    return response.data;
  },
  
  getBalance: async (userId) => {
    const response = await api.get(`/ledger/balance/${userId}`);
    return response.data;
  },
  
  getAllCustomerBalances: async () => {
    const response = await api.get('/ledger/customers');
    return response.data;
  }
};