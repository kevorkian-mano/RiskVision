const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check routes
app.use('/', require('./routes/healthRoutes'));


app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/rules', require('./routes/ruleRoutes'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
