const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/roles');

// Register a new user (Admin only)
router.post('/register', auth, admin, userController.register);

// Login user
router.post('/login', userController.login);

// Send custom email to user (Admin only) - Must be before parameterized routes
router.post('/send-email', auth, admin, userController.sendEmail);

// Get current user
router.get('/me', auth, userController.getMe);

// Get all users (Admin only)
router.get('/', auth, admin, userController.getAll);

// Get users by role (Admin and Compliance can access)
router.get('/by-role/:role', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'compliance') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin or compliance role required.' });
  }
}, userController.getByRole);

// Update user role (Admin only)
router.put('/:id/role', auth, admin, userController.updateRole);

// Delete user (Admin only)
router.delete('/:id', auth, admin, userController.deleteUser);

module.exports = router; 