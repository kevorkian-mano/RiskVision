const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/roles');

// Get current user's points
router.get('/my-points', auth, pointsController.getMyPoints);

// Get leaderboard
router.get('/leaderboard', auth, pointsController.getLeaderboard);

// Admin only routes
router.get('/stats', auth, admin, pointsController.getPointsStats);
router.get('/user/:userId', auth, admin, pointsController.getUserPoints);
router.post('/award', auth, admin, pointsController.awardPoints);

// New admin routes for comprehensive points management
router.get('/all-users', auth, admin, pointsController.getAllUsersPoints);
router.post('/bonus', auth, admin, pointsController.awardBonusPoints);
router.get('/history/:userId', auth, admin, pointsController.getPointsHistory);

module.exports = router; 