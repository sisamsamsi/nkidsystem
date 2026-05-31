import api from '../lib/axios';

export const stationService = {
  // Station PIN auth
  authenticate: async (stationId, pinCode) => {
    const response = await api.post('/station/auth', {
      station_id: stationId,
      pin_code: pinCode
    });
    if (response.data.token) {
      localStorage.setItem('station_token', response.data.token);
      localStorage.setItem('station', JSON.stringify(response.data.station));
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  },

  // Get available tasks (backend handles division filtering)
  getTasks: async (params = {}) => {
    const response = await api.get('/station/tasks', { params });
    return response.data;
  },

  // Get single task details
  getTask: async (taskId) => {
    const response = await api.get(`/station/tasks/${taskId}`);
    return response.data;
  },

  // Log work
  logWork: async (taskId, { operatorId, pinCode, quantity, notes }) => {
    const response = await api.post(`/station/tasks/${taskId}/log`, {
      operator_id: operatorId,
      pin_code: pinCode,
      quantity,
      notes
    });
    return response.data;
  },

  // Station logout
  logout: () => {
    localStorage.removeItem('station_token');
    localStorage.removeItem('station');
    delete api.defaults.headers.common['Authorization'];
  },

  // Get stored station
  getStoredStation: () => {
    const station = localStorage.getItem('station');
    return station ? JSON.parse(station) : null;
  },

  // Check if station authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('station_token');
  },

  // Initialize station auth
  initAuth: () => {
    const token = localStorage.getItem('station_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

export default stationService;
