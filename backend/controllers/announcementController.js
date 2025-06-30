const Announcement = require('../models/Announcement');
const User = require('../models/User');
const socketService = require('../services/socketService');

// Create new announcement (Admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, type, priority, targetRoles, expiresAt } = req.body;
    
    const announcement = await Announcement.create({
      title,
      content,
      type,
      priority,
      targetRoles,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id
    });
    
    // Populate creator info
    await announcement.populate('createdBy', 'name email role');
    
    // Broadcast to target roles via WebSocket
    socketService.broadcastAnnouncement(announcement, targetRoles);
    
    // Send system message to target roles
    socketService.broadcastSystemMessage(
      `📢 New announcement: ${title}`,
      targetRoles
    );
    
    res.status(201).json(announcement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all announcements for a user (based on their role)
exports.getAnnouncements = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    
    const announcements = await Announcement.find({
      isActive: true,
      targetRoles: userRole,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .populate('createdBy', 'name email role')
    .populate('readBy.userId', 'name email')
    .sort({ priority: -1, createdAt: -1 });
    
    // Mark announcements as read by this user
    const unreadAnnouncements = announcements.filter(announcement => 
      !announcement.readBy.some(read => read.userId._id.toString() === userId.toString())
    );
    
    if (unreadAnnouncements.length > 0) {
      await Promise.all(unreadAnnouncements.map(announcement => 
        Announcement.findByIdAndUpdate(announcement._id, {
          $push: { readBy: { userId, readAt: new Date() } }
        })
      ));
    }
    
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all announcements (Admin only)
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email role')
      .populate('readBy.userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update announcement (Admin only)
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, priority, targetRoles, isActive, expiresAt } = req.body;
    
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        title,
        content,
        type,
        priority,
        targetRoles,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      { new: true }
    ).populate('createdBy', 'name email role');
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    // Broadcast update to target roles
    if (announcement.isActive) {
      socketService.broadcastAnnouncement(announcement, announcement.targetRoles);
    }
    
    res.json(announcement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete announcement (Admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    // Broadcast deletion to target roles
    socketService.broadcastAnnouncementDeletion(id, announcement.targetRoles);
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark announcement as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        $addToSet: { readBy: { userId, readAt: new Date() } }
      },
      { new: true }
    ).populate('createdBy', 'name email role');
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get announcement statistics (Admin only)
exports.getStats = async (req, res) => {
  try {
    const stats = await Announcement.aggregate([
      {
        $group: {
          _id: null,
          totalAnnouncements: { $sum: 1 },
          activeAnnouncements: { $sum: { $cond: ['$isActive', 1, 0] } },
          urgentAnnouncements: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          highPriorityAnnouncements: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
        }
      }
    ]);
    
    // Get recent announcements (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = await Announcement.countDocuments({
      createdAt: { $gte: last7Days }
    });
    
    const result = {
      ...stats[0],
      recentAnnouncements7d: recentCount
    };
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 