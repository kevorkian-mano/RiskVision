const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/roles');

// Register a new user (Admin only)
router.post('/register', auth, admin, userController.register);

// Login user
router.post('/login', userController.login);

// Get current user
router.get('/me', auth, userController.getMe);

// Get all users (Admin only)
router.get('/', auth, admin, userController.getAll);

// Update user role (Admin only)
router.put('/:id/role', auth, admin, userController.updateRole);

// Delete user (Admin only)
router.delete('/:id', auth, admin, userController.deleteUser);



module.exports = router; 