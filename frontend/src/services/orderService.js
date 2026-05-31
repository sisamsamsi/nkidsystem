import api from '../lib/axios';

export const orderService = {
  getAll: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  import: async (data) => {
    const response = await api.post('/orders/import', data);
    return response.data;
  },

  recalculate: async (id) => {
    const response = await api.post(`/orders/${id}/recalculate`);
    return response.data;
  },

  // Public tracking
  track: async (poNumber) => {
    const response = await api.get(`/track/${poNumber}`);
    return response.data;
  }
};

export default orderService;
