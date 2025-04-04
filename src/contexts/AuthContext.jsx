import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const { callApi } = useApi();

    useEffect(() => {
        // Check for stored token and user data
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            console.log('Sending credentials:', credentials);
            const response = await callApi('/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            if (response.token) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                
                setUser(response.user);
                setIsAuthenticated(true);
                
                return response;
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login error details:', error);
            setIsAuthenticated(false);
            throw error.message || 'Invalid credentials';
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    if (loading) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated,
            login, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext); 