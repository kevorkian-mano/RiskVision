const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');

// Placeholder risk rule engine
async function riskRuleEngine(transaction) {
  // Example: trigger alert if amount > 10000
  if (transaction.amount > 10000) {
    await Alert.create({
      transactionId: transaction._id,
      reason: 'Amount exceeds threshold',
      riskScore: 90
    });
  }
}

// Add new transaction
exports.addTransaction = async (req, res) => {
  try {
    const { amount, country } = req.body;
    const userId = req.user.id; // Assume req.user is set by auth middleware
    const transaction = await Transaction.create({ userId, amount, country });
    await riskRuleEngine(transaction);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all transactions
exports.getAll = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('userId', 'name email');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get transactions by user
exports.getByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    const transactions = await Transaction.find({ userId }).populate('userId', 'name email');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 