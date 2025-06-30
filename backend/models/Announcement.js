const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['meeting', 'alert', 'update', 'reminder', 'general'], 
    default: 'general' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetRoles: [{ 
    type: String, 
    enum: ['admin', 'compliance', 'investigator', 'auditor'],
    default: ['compliance', 'investigator', 'auditor']
  }],
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  readBy: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
announcementSchema.index({ isActive: 1, targetRoles: 1, expiresAt: 1 });

module.exports = mongoose.model('Announcement', announcementSchema); 