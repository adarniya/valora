import api from './api';

export const agingService = {
  getAgingReport: async (params = {}) => {
    const response = await api.get('/aging', { params });
    return response.data;
  },
};
