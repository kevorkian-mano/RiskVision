const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  reason: String,
  riskScore: Number,
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
