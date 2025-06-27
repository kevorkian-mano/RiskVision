const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/roles');

// Add a new rule (Admin only)
router.post('/', auth, admin, ruleController.addRule);

// Edit a rule (Admin only)
router.put('/:id', auth, admin, ruleController.editRule);

// Get all rules (Admin only)
router.get('/', auth, admin, ruleController.getAll);

// Delete a rule (Admin only)
router.delete('/:id', auth, admin, ruleController.deleteRule);

module.exports = router; 