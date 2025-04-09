import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored token and user data
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                const parsedUserData = JSON.parse(userData);
                console.log('Loaded user from localStorage:', parsedUserData);
                setUser(parsedUserData);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const response = await axios.post('/api/login', credentials);
            // Save token and user data to localStorage
            console.log('Login response user data:', response.data.user);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setUser(response.data.user);
            setIsAuthenticated(true);
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
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
};

export const useAuth = () => useContext(AuthContext); 