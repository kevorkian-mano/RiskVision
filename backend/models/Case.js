const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  action: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const caseSchema = new mongoose.Schema({
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Open', 'In Review', 'Escalated', 'Closed', 'Confirmed Fraud', 'Dismissed'],
    default: 'Open'
  },
  description: String,
  timeline: [timelineSchema],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Case', caseSchema); 