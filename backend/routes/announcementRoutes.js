const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/roles');

// Get announcements for current user (based on role)
router.get('/', auth, announcementController.getAnnouncements);

// Mark announcement as read
router.post('/:id/read', auth, announcementController.markAsRead);

// Admin only routes
router.get('/admin/all', auth, admin, announcementController.getAllAnnouncements);
router.get('/admin/stats', auth, admin, announcementController.getStats);
router.post('/', auth, admin, announcementController.createAnnouncement);
router.put('/:id', auth, admin, announcementController.updateAnnouncement);
router.delete('/:id', auth, admin, announcementController.deleteAnnouncement);

module.exports = router; 