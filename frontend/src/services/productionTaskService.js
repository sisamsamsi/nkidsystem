import api from '../lib/axios';

export const productionTaskService = {
  getAll: async (params = {}) => {
    const response = await api.get('/production-tasks', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/production-tasks/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/production-tasks/${id}`, data);
    return response.data;
  },

  logWork: async (id, data) => {
    const response = await api.post(`/production-tasks/${id}/log-work`, data);
    return response.data;
  }
};

export default productionTaskService;
