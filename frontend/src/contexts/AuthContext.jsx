import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api.jsx';
import socketService from '../services/socket.jsx';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      
      // Connect to WebSocket and authenticate
      socketService.connect();
      socketService.authenticate(response.data._id, response.data.role);
      
      // Subscribe to relevant streams based on role
      socketService.subscribeToTransactions();
      if (['admin', 'compliance'].includes(response.data.role)) {
        socketService.subscribeToAlerts();
      }
      if (['admin', 'compliance', 'investigator'].includes(response.data.role)) {
        socketService.subscribeToCases();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token and user data
      localStorage.removeItem('token');
      setUser(null);
      socketService.disconnect();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      await checkAuthStatus();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    socketService.disconnect();
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const clearError = () => {
    setError(null);
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  const isAdmin = () => hasRole('admin');
  const isCompliance = () => hasRole(['admin', 'compliance']);
  const isInvestigator = () => hasRole(['admin', 'compliance', 'investigator']);
  const isAuditor = () => hasRole(['admin', 'auditor']);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateUser,
    clearError,
    hasRole,
    isAdmin,
    isCompliance,
    isInvestigator,
    isAuditor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 