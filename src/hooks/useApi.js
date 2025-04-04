import { config } from '../config';

export const useApi = () => {
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    const callApi = async (endpoint, options = {}) => {
        const url = `${config.API_BASE_URL}${endpoint}`;
        const token = getAuthToken();

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers,
                }
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || data.message || 'API call failed';
                const error = new Error(errorMessage);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    return { callApi };
}; 