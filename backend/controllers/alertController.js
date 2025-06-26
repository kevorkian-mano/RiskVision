const Alert = require('../models/Alert');
const Transaction = require('../models/Transaction');

// Get all alerts
exports.getAll = async (req, res) => {
  try {
    const alerts = await Alert.find().populate({
      path: 'transactionId',
      populate: { path: 'userId', select: 'name email' }
    });
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
    const alert = await Alert.findByIdAndUpdate(req.params.id, { resolved: true }, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
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
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 