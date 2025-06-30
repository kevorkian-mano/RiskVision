const User = require('../models/User');

// Point values for different actions
const POINT_VALUES = {
  COMPLIANCE: {
    CREATE_CASE: 1,
    CASE_CLOSED: 1
  },
  INVESTIGATOR: {
    MAKE_DECISION: 2,
    CLOSE_CASE: 1
  }
};

// Action descriptions
const ACTION_DESCRIPTIONS = {
  CREATE_CASE: 'Created a new fraud case',
  CASE_CLOSED: 'Case was closed by investigator',
  MAKE_DECISION: 'Made an investigator decision',
  CLOSE_CASE: 'Closed a case'
};

class PointsService {
  // Award points to a user
  static async awardPoints(userId, action, points, description, relatedId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Add points to user's total
      user.points += points;

      // Add to points history
      user.pointsHistory.push({
        action,
        points,
        description,
        relatedId,
        earnedAt: new Date()
      });

      await user.save();

      console.log(`🎯 Awarded ${points} points to ${user.name} (${user.role}) for: ${description}`);

      return {
        success: true,
        newTotal: user.points,
        pointsAwarded: points,
        description
      };
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  // Award bonus points (Admin only)
  static async awardBonusPoints(userId, points, reason, awardedBy) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const admin = await User.findById(awardedBy);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Add points to user's total
      user.points += points;

      // Add to points history with bonus flag
      user.pointsHistory.push({
        action: 'BONUS_POINTS',
        points,
        description: `Bonus points: ${reason}`,
        relatedId: null,
        awardedBy: admin._id,
        awardedByName: admin.name,
        earnedAt: new Date()
      });

      await user.save();

      console.log(`🎁 Admin ${admin.name} awarded ${points} bonus points to ${user.name} (${user.role}) for: ${reason}`);

      return {
        success: true,
        newTotal: user.points,
        pointsAwarded: points,
        reason,
        awardedBy: admin.name
      };
    } catch (error) {
      console.error('Error awarding bonus points:', error);
      throw error;
    }
  }

  // Get all users' points (Admin only)
  static async getAllUsersPoints() {
    try {
      const users = await User.find({})
        .select('name email role points pointsHistory lastActive')
        .sort({ points: -1 });

      return users.map(user => {
        // Calculate points by action type
        const pointsByAction = {};
        user.pointsHistory.forEach(entry => {
          if (!pointsByAction[entry.action]) {
            pointsByAction[entry.action] = 0;
          }
          pointsByAction[entry.action] += entry.points;
        });

        // Get recent activity (last 5 entries)
        const recentActivity = user.pointsHistory
          .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
          .slice(0, 5);

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalPoints: user.points,
          pointsByAction,
          recentActivity,
          lastActive: user.lastActive
        };
      });
    } catch (error) {
      console.error('Error getting all users points:', error);
      throw error;
    }
  }

  // Get points history for a specific user (Admin only)
  static async getPointsHistory(userId) {
    try {
      const user = await User.findById(userId)
        .select('name email role points pointsHistory');

      if (!user) {
        throw new Error('User not found');
      }

      // Sort history by date (newest first)
      const sortedHistory = user.pointsHistory
        .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalPoints: user.points,
        history: sortedHistory
      };
    } catch (error) {
      console.error('Error getting points history:', error);
      throw error;
    }
  }

  // Award points for compliance creating a case
  static async awardCaseCreation(userId, caseId) {
    const points = POINT_VALUES.COMPLIANCE.CREATE_CASE;
    const description = ACTION_DESCRIPTIONS.CREATE_CASE;
    
    return await this.awardPoints(userId, 'CREATE_CASE', points, description, caseId);
  }

  // Award points for compliance when their case is closed
  static async awardCaseClosed(complianceUserId, caseId) {
    const points = POINT_VALUES.COMPLIANCE.CASE_CLOSED;
    const description = ACTION_DESCRIPTIONS.CASE_CLOSED;
    
    return await this.awardPoints(complianceUserId, 'CASE_CLOSED', points, description, caseId);
  }

  // Award points for investigator making a decision
  static async awardDecision(userId, caseId, decisionType) {
    const points = POINT_VALUES.INVESTIGATOR.MAKE_DECISION;
    const description = `${ACTION_DESCRIPTIONS.MAKE_DECISION}: ${decisionType}`;
    
    return await this.awardPoints(userId, 'MAKE_DECISION', points, description, caseId);
  }

  // Award points for investigator closing a case
  static async awardCaseClose(userId, caseId) {
    const points = POINT_VALUES.INVESTIGATOR.CLOSE_CASE;
    const description = ACTION_DESCRIPTIONS.CLOSE_CASE;
    
    return await this.awardPoints(userId, 'CLOSE_CASE', points, description, caseId);
  }

  // Get user's points summary
  static async getUserPoints(userId) {
    try {
      const user = await User.findById(userId).select('name role points pointsHistory');
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate points by action type
      const pointsByAction = {};
      user.pointsHistory.forEach(entry => {
        if (!pointsByAction[entry.action]) {
          pointsByAction[entry.action] = 0;
        }
        pointsByAction[entry.action] += entry.points;
      });

      return {
        userId: user._id,
        name: user.name,
        role: user.role,
        totalPoints: user.points,
        pointsByAction,
        recentActivity: user.pointsHistory
          .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
          .slice(0, 10) // Last 10 activities
      };
    } catch (error) {
      console.error('Error getting user points:', error);
      throw error;
    }
  }

  // Get leaderboard for a specific role
  static async getLeaderboard(role = null) {
    try {
      let query = {};
      if (role) {
        query.role = role;
      }

      const users = await User.find(query)
        .select('name role points')
        .sort({ points: -1 })
        .limit(20);

      return users.map((user, index) => ({
        rank: index + 1,
        userId: user._id,
        name: user.name,
        role: user.role,
        points: user.points
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Get points statistics
  static async getPointsStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            totalPoints: { $sum: '$points' },
            avgPoints: { $avg: '$points' },
            userCount: { $sum: 1 }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const totalPoints = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);

      return {
        byRole: stats,
        totalUsers,
        totalPoints: totalPoints[0]?.total || 0
      };
    } catch (error) {
      console.error('Error getting points stats:', error);
      throw error;
    }
  }
}

module.exports = PointsService; 