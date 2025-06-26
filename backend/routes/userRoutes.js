const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/roles');

router.post('/register', auth, admin, userController.register);
router.post('/login', userController.login);
router.get('/me', auth, userController.getMe);
router.get('/', auth, admin, userController.getAll);
router.put('/:id/role', auth, admin, userController.updateRole);
router.delete('/:id', auth, admin, userController.deleteUser);

module.exports = router; 