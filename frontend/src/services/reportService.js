import api from '../lib/axios';

export const reportService = {
  getEmployeePerformance: async (params = {}) => {
    const response = await api.get('/reports/employee-performance', { params });
    return response.data;
  },

  getProductionSummary: async (params = {}) => {
    const response = await api.get('/reports/production-summary', { params });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  }
};

export default reportService;
