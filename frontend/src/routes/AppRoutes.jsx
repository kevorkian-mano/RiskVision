import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../components/Login.jsx';
import Dashboard from '../components/Dashboard.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes; 