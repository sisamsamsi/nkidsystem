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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login for unauthenticated requests
            try {
                // Clear any local auth tokens if present
                localStorage.removeItem('auth_token');
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
            } catch (e) {
                // ignore
            }
            
            if (window.location.pathname.startsWith('/station')) {
                window.location.href = '/station/login';
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
