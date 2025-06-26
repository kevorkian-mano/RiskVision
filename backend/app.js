const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/rules', require('./routes/ruleRoutes'));

module.exports = app;
