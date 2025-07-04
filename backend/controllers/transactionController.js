const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');
const socketService = require('../services/socketService');
const { getFraudPrediction } = require('../services/mlService');

// Commented out: calculateRiskScore and riskRuleEngine (rule-based logic)
/*
function calculateRiskScore(amount, country, timestamp) {
  let score = 0;
  // ... rule-based logic ...
  return Math.min(100, Math.max(0, Math.round(score)));
}

async function riskRuleEngine(transaction) {
  let alertCreated = null;
  // ... rule-based alert logic ...
  return alertCreated;
}
*/

// Add new transaction
exports.addTransaction = async (req, res) => {
  try {
    // Use provided values, or default to high-risk for ML testing
    let { amount, country, customerName } = req.body;
    if (!amount) amount = 100000;
    if (!country) country = 'Nigeria';
    const userId = req.user.id; // Assume req.user is set by auth middleware
    
    // Create transaction with timestamp
    const transaction = await Transaction.create({ 
      userId, 
      customerName: customerName || 'Unknown Customer',
      amount, 
      country,
      timestamp: new Date()
    });
    
    // Populate user info for broadcasting
    await transaction.populate('userId', 'name email');
    
    // ML fraud prediction
    const prediction = await getFraudPrediction({ amount, country, timestamp: transaction.timestamp });
    transaction.isFraud = Boolean(prediction.isFraud);
    await transaction.save();
    
    // Create alert only if ML model flags as fraud
    let alert = null;
    if (transaction.isFraud) {
      alert = await Alert.create({
        transactionId: transaction._id,
        reason: 'ML model flagged as fraud',
        riskScore: transaction.riskScore // Optional: keep for reference
      });
      // Broadcast alert and system message
      await alert.populate('transactionId');
      socketService.broadcastAlert(alert);
      socketService.broadcastSystemMessage(
        `🚨 ML alert: Transaction $${amount} from ${country} flagged as fraud`,
        'compliance'
      );
    }
    
    // Broadcast transaction to all subscribers (include isFraud)
    socketService.broadcastTransaction({
      ...transaction.toObject(),
      alertGenerated: !!alert
    });
    
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
          // Commented out: Rule-based risk score stats (replaced by ML-based stats)
          // avgRiskScore: { $avg: '$riskScore' },
          // highRiskCount: { $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] } },
          // ML-based fraud stats
          fraudCount: { $sum: { $cond: ['$isFraud', 1, 0] } },
          fraudRate: { $avg: { $cond: ['$isFraud', 1, 0] } }
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