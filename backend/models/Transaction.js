const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  amount: Number,
  country: String,
  timestamp: { type: Date, default: Date.now },
  riskScore: { type: Number, default: 0 },
  isFraud: { type: Boolean, default: false }
});

module.exports = mongoose.model('Transaction', transactionSchema);
