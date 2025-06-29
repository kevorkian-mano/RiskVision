const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  action: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userRole: String,
  details: String
});

const caseSchema = new mongoose.Schema({
  // Support both alert-based and transaction-based cases
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  
  // Case creation info
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Compliance officer
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Investigator
  
  // Case details
  title: { type: String, required: true },
  description: { type: String, required: true },
  riskScore: { type: Number, required: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'In Review', 'Escalated', 'Closed', 'Confirmed Fraud', 'Dismissed', 'Account Frozen', 'Transaction Reversed', 'Reported to Compliance', 'Added to Watchlist', 'Customer Verification Requested'],
    default: 'Open'
  },
  
  // Case metadata
  timeline: [timelineSchema],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Update the updatedAt field on save
caseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Case', caseSchema); 