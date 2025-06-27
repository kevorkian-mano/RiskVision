const Alert = require('../models/Alert');
const Transaction = require('../models/Transaction');
const socketService = require('../services/socketService');

// Get all alerts
exports.getAll = async (req, res) => {
  try {
    const alerts = await Alert.find().populate({
      path: 'transactionId',
      populate: { path: 'userId', select: 'name email' }
    }).sort({ createdAt: -1 }); // Most recent first
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get alert by ID
exports.getById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate({
      path: 'transactionId',
      populate: { path: 'userId', select: 'name email' }
    });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resolve alert
exports.resolve = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id, 
      { resolved: true, resolvedAt: new Date(), resolvedBy: req.user.id }, 
      { new: true }
    ).populate({
      path: 'transactionId',
      populate: { path: 'userId', select: 'name email' }
    });
    
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    // Broadcast alert resolution
    socketService.broadcastAlert(alert);
    
    res.json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete alert (Admin only)
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    // Broadcast alert deletion
    socketService.broadcastSystemMessage(
      `Alert ${alert._id} has been deleted`,
      'admin'
    );
    
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get alert statistics
exports.getStats = async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          resolvedAlerts: { $sum: { $cond: ['$resolved', 1, 0] } },
          avgRiskScore: { $avg: '$riskScore' },
          maxRiskScore: { $max: '$riskScore' }
        }
      }
    ]);
    
    // Get recent alerts count (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await Alert.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    
    const result = {
      ...stats[0],
      recentAlerts24h: recentCount,
      unresolvedAlerts: stats[0]?.totalAlerts - stats[0]?.resolvedAlerts || 0
    };
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 