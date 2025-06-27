const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Get all alerts
router.get('/', auth, alertController.getAll);

// Get alert statistics (must come before /:id route)
router.get('/stats', auth, requireRole(['admin', 'compliance']), alertController.getStats);

// Get alert by ID
router.get('/:id', auth, alertController.getById);

// Resolve alert (Compliance)
router.put('/:id/resolve', auth, requireRole(['admin', 'compliance']), alertController.resolve);

// Delete alert (Admin)
router.delete('/:id', auth, requireRole(['admin']), alertController.deleteAlert);

module.exports = router; 