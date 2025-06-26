const Log = require('../models/Log');

// Get all logs
exports.getAll = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Filter logs by user, date range, and action
exports.filter = async (req, res) => {
  try {
    const { user, from, to, action } = req.query;
    const filter = {};
    
    if (user) filter.userId = user;
    if (action) filter.action = action;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    
    const logs = await Log.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export logs (placeholder for PDF/CSV export)
exports.exportLogs = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const logs = await Log.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      // Simple CSV export
      const csv = logs.map(log => 
        `${log.createdAt},${log.userId?.name || 'Unknown'},${log.action},${JSON.stringify(log.details)}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
      res.send(csv);
    } else {
      // JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
      res.json(logs);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 