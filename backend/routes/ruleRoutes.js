const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/roles');

router.post('/', auth, admin, ruleController.addRule);
router.put('/:id', auth, admin, ruleController.editRule);
router.get('/', auth, admin, ruleController.getAll);
router.delete('/:id', auth, admin, ruleController.deleteRule);

module.exports = router; 