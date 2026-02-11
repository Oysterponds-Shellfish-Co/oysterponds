import axios from 'axios';

// API base URL - uses environment variable or defaults to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor for logging/auth
api.interceptors.request.use(
    (config) => {
        // Add auth token if available (for future use)
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common errors
        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
            console.error('API Error:', message);

            // Handle specific status codes
            switch (error.response.status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    // But don't redirect if already on login page or on customer portal
                    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/order/')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }
                    break;
                case 404:
                    console.error('Resource not found');
                    break;
                case 500:
                    console.error('Server error');
                    break;
            }
        } else if (error.request) {
            // Request made but no response received
            console.error('Network error - no response received');
        } else {
            // Error in setting up request
            console.error('Request error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
