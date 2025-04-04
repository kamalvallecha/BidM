const isDevelopment = import.meta.env.MODE === 'development';

export const config = {
    // API Configuration
    API_BASE_URL: isDevelopment 
        ? import.meta.env.VITE_API_URL || 'http://localhost:5000/api' 
        : import.meta.env.VITE_PROD_API_URL || 'https://your-production-api.com/api',
    
    // App Configuration
    APP_URL: isDevelopment 
        ? import.meta.env.VITE_APP_URL || 'http://localhost:5173' 
        : import.meta.env.VITE_PROD_APP_URL || 'https://your-production-app.com',
    
    // Auth Configuration
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    
    // API Timeouts
    REQUEST_TIMEOUT: 30000, // 30 seconds
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Network error. Please check your connection.',
        UNAUTHORIZED: 'Unauthorized. Please login again.',
        SERVER_ERROR: 'Server error. Please try again later.',
        DEFAULT: 'Something went wrong. Please try again.'
    }
};