import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://nkidsystem.test/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
    withXSRFToken: true
});

api.interceptors.request.use(
    (config) => {
        const isStation = config.url && (
            config.url.startsWith('/station') || 
            config.url.startsWith('station') || 
            config.url.startsWith('/qc-reports') ||
            config.url.startsWith('qc-reports')
        );

        if (isStation) {
            const stationToken = localStorage.getItem('station_token');
            if (stationToken) {
                config.headers.Authorization = `Bearer ${stationToken}`;
            }
        } else {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login for unauthenticated requests
            try {
                // Clear all local auth tokens and structures
                localStorage.removeItem('token');
                localStorage.removeItem('station_token');
                localStorage.removeItem('user');
                localStorage.removeItem('station');
                delete api.defaults.headers.common['Authorization'];
            } catch (e) {
                // ignore
            }
            
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/station')) {
                if (currentPath !== '/station/login') {
                    window.location.href = '/station/login';
                }
            } else {
                if (currentPath !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
