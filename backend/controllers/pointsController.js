const PointsService = require('../services/pointsService');

// Get current user's points
exports.getMyPoints = async (req, res) => {
  try {
    const pointsData = await PointsService.getUserPoints(req.user._id);
    res.json(pointsData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get points for a specific user (Admin only)
exports.getUserPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const pointsData = await PointsService.getUserPoints(userId);
    res.json(pointsData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { role } = req.query;
    const leaderboard = await PointsService.getLeaderboard(role);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get points statistics (Admin only)
exports.getPointsStats = async (req, res) => {
  try {
    const stats = await PointsService.getPointsStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Award points manually (Admin only)
exports.awardPoints = async (req, res) => {
  try {
    const { userId, action, points, description, relatedId } = req.body;
    
    if (!userId || !action || !points || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await PointsService.awardPoints(userId, action, points, description, relatedId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users' points (Admin only)
exports.getAllUsersPoints = async (req, res) => {
  try {
    const usersPoints = await PointsService.getAllUsersPoints();
    res.json(usersPoints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Award bonus points (Admin only)
exports.awardBonusPoints = async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    
    if (!userId || !points || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (points <= 0) {
      return res.status(400).json({ error: 'Points must be greater than 0' });
    }

    const result = await PointsService.awardBonusPoints(userId, points, reason, req.user._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get points history for a user (Admin only)
exports.getPointsHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await PointsService.getPointsHistory(userId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 