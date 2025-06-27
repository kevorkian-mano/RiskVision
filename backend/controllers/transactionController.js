const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');
const socketService = require('../services/socketService');

// Placeholder risk rule engine
async function riskRuleEngine(transaction) {
  let alertCreated = null;
  
  // Example: trigger alert if amount > 10000
  if (transaction.amount > 10000) {
    alertCreated = await Alert.create({
      transactionId: transaction._id,
      reason: 'Amount exceeds threshold',
      riskScore: 90
    });
  }
  
  // Additional risk rules
  const suspiciousCountries = ['nigeria', 'russia', 'ukraine', 'belarus'];
  if (suspiciousCountries.includes(transaction.country.toLowerCase())) {
    alertCreated = await Alert.create({
      transactionId: transaction._id,
      reason: `Suspicious country: ${transaction.country}`,
      riskScore: 85
    });
  }
  
  // Late night transactions (between 11 PM and 5 AM)
  const hour = new Date(transaction.timestamp).getHours();
  if (hour >= 23 || hour <= 5) {
    alertCreated = await Alert.create({
      transactionId: transaction._id,
      reason: 'Late night transaction',
      riskScore: 70
    });
  }
  
  return alertCreated;
}

// Add new transaction
exports.addTransaction = async (req, res) => {
  try {
    const { amount, country } = req.body;
    const userId = req.user.id; // Assume req.user is set by auth middleware
    
    // Create transaction with timestamp
    const transaction = await Transaction.create({ 
      userId, 
      amount, 
      country,
      timestamp: new Date()
    });
    
    // Populate user info for broadcasting
    await transaction.populate('userId', 'name email');
    
    // Run risk assessment
    const alert = await riskRuleEngine(transaction);
    
    // Broadcast transaction to all subscribers
    socketService.broadcastTransaction({
      ...transaction.toObject(),
      alertGenerated: !!alert
    });
    
    // If alert was created, broadcast it too
    if (alert) {
      await alert.populate('transactionId');
      socketService.broadcastAlert(alert);
      
      // Send system message to compliance team
      socketService.broadcastSystemMessage(
        `🚨 New alert generated for transaction $${amount} from ${country}`,
        'compliance'
      );
    }
    
    res.status(201).json({
      transaction,
      alertGenerated: !!alert,
      alert: alert || null
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all transactions
exports.getAll = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 }); // Most recent first
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get transactions by user
exports.getByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const transactions = await Transaction.find({ userId })
      .populate('userId', 'name email')
      .sort({ timestamp: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get transaction statistics
exports.getStats = async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      }
    ]);
    
    // Get recent transactions count (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await Transaction.countDocuments({
      timestamp: { $gte: last24Hours }
    });
    
    const result = {
      ...stats[0],
      recentTransactions24h: recentCount,
      connectedUsers: socketService.getConnectedUsersCount()
    };
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 