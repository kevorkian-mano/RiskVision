const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');
const socketService = require('../services/socketService');

// Calculate risk score based on transaction characteristics
function calculateRiskScore(amount, country, timestamp) {
  let score = 0;
  
  // Amount-based risk
  if (amount > 10000) score += 30;
  if (amount > 50000) score += 20;
  if (amount < 20) score += 25; // Micro-transactions
  
  // Country-based risk
  const suspiciousCountries = ['nigeria', 'russia', 'ukraine', 'belarus', 'iran', 'syria', 'north korea'];
  if (suspiciousCountries.includes(country.toLowerCase())) {
    score += 40;
  }
  
  // Time-based risk (late night transactions)
  const hour = new Date(timestamp).getHours();
  if (hour >= 23 || hour <= 5) {
    score += 15;
  }
  
  // Random variation to make it more realistic
  score += Math.floor(Math.random() * 20) - 10;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Placeholder risk rule engine
async function riskRuleEngine(transaction) {
  let alertCreated = null;
  
  // Calculate risk score for the transaction
  const riskScore = calculateRiskScore(transaction.amount, transaction.country, transaction.timestamp);
  
  // Update transaction with risk score
  transaction.riskScore = riskScore;
  await transaction.save();
  
  // Generate alert if risk score is high
  if (riskScore > 70) {
    let reason = 'High risk transaction';
    if (transaction.amount > 10000) reason = 'Amount exceeds threshold';
    else if (['nigeria', 'russia', 'ukraine', 'belarus'].includes(transaction.country.toLowerCase())) {
      reason = `Suspicious country: ${transaction.country}`;
    }
    else if (new Date(transaction.timestamp).getHours() >= 23 || new Date(transaction.timestamp).getHours() <= 5) {
      reason = 'Late night transaction';
    }
    
    alertCreated = await Alert.create({
      transactionId: transaction._id,
      reason: reason,
      riskScore: riskScore
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

// Delete transaction by ID
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Broadcast deletion to WebSocket subscribers
    socketService.broadcastTransactionDeletion(transaction._id);
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete old transactions (keep only last N transactions)
exports.deleteOldTransactions = async (req, res) => {
  try {
    const { keepCount = 20 } = req.body;
    
    // Get total count of transactions
    const totalCount = await Transaction.countDocuments();
    
    if (totalCount <= keepCount) {
      return res.json({ 
        message: 'No transactions to delete', 
        deletedCount: 0,
        remainingCount: totalCount 
      });
    }
    
    // Find the cutoff date by getting the timestamp of the Nth most recent transaction
    const cutoffTransaction = await Transaction.find()
      .sort({ timestamp: -1 })
      .skip(keepCount - 1)
      .limit(1)
      .select('timestamp');
    
    if (cutoffTransaction.length === 0) {
      return res.json({ 
        message: 'No transactions to delete', 
        deletedCount: 0,
        remainingCount: totalCount 
      });
    }
    
    const cutoffDate = cutoffTransaction[0].timestamp;
    
    // Delete transactions older than the cutoff date
    const deleteResult = await Transaction.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    // Broadcast cleanup to WebSocket subscribers
    socketService.broadcastTransactionCleanup(deleteResult.deletedCount);
    
    res.json({
      message: `Deleted ${deleteResult.deletedCount} old transactions`,
      deletedCount: deleteResult.deletedCount,
      remainingCount: totalCount - deleteResult.deletedCount,
      cutoffDate: cutoffDate
    });
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
          minAmount: { $min: '$amount' },
          avgRiskScore: { $avg: '$riskScore' },
          highRiskCount: { $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] } }
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