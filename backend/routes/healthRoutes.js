const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health check endpoint
router.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  
  res.json(health);
});

// API info endpoint
router.get('/api-info', (req, res) => {
  const apiInfo = {
    name: 'RiskVision API',
    version: '1.0.0',
    description: 'Fraud Detection & Risk Management System',
    endpoints: {
      auth: '/api/users',
      transactions: '/api/transactions',
      alerts: '/api/alerts',
      cases: '/api/cases',
      logs: '/api/logs',
      rules: '/api/rules'
    },
    websocket: {
      enabled: true,
      events: ['new-transaction', 'new-alert', 'case-update', 'system-message']
    }
  };
  
  res.json(apiInfo);
});

module.exports = router; 