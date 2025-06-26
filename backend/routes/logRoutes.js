const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');
const { admin, auditor } = require('../middleware/roles');

// Get all logs (Admin and Auditor)
router.get('/', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'auditor') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin or auditor role required.' });
  }
}, logController.getAll);

// Filter logs (Admin and Auditor)
router.get('/filter', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'auditor') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin or auditor role required.' });
  }
}, logController.filter);

// Export logs (Admin and Auditor)
router.get('/export', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'auditor') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin or auditor role required.' });
  }
}, logController.exportLogs);

module.exports = router; 