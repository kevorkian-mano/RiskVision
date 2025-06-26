const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const auth = require('../middleware/auth');
const { admin, compliance } = require('../middleware/roles');

// Get all alerts (Any authenticated user can view)
router.get('/', auth, alertController.getAll);

// Get alert by ID (Any authenticated user can view)
router.get('/:id', auth, alertController.getById);

// Resolve alert (Compliance only)
router.put('/:id/resolve', auth, compliance, alertController.resolve);

// Delete alert (Admin only)
router.delete('/:id', auth, admin, alertController.deleteAlert);

module.exports = router; 