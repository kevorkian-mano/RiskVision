const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

router.post('/', auth, transactionController.addTransaction);
router.get('/', auth, transactionController.getAll);
router.get('/user/:id', auth, transactionController.getByUser);

module.exports = router; 