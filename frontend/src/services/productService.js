import api from '../lib/axios';

export const productService = {
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  
  getProcessTemplates: async () => {
    const response = await api.get('/process-templates');
    return response.data;
  }
};

export const productVariantService = {
  getAll: async (params = {}) => {
    const response = await api.get('/product-variants', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/product-variants/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/product-variants', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/product-variants/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/product-variants/${id}`);
    return response.data;
  }
};

export default productService;
