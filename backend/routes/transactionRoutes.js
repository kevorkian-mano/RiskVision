const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

// Add a new transaction    

router.post('/', auth, transactionController.addTransaction);

// Get all transactions
router.get('/', auth, transactionController.getAll);

// Get transactions by user
router.get('/user/:id', auth, transactionController.getByUser);

// Get transaction statistics
router.get('/stats', auth, transactionController.getStats);

module.exports = router; 