const Case = require('../models/Case');
const Alert = require('../models/Alert');
const Transaction = require('../models/Transaction');
const Comment = require('../models/Comment');
const Evidence = require('../models/Evidence');
const User = require('../models/User');
const socketService = require('../services/socketService');
const PointsService = require('../services/pointsService');

// Create a fraud case from a transaction (compliance officer)
exports.createCaseFromTransaction = async (req, res) => {
  try {
    const { transactionId, title, description, priority } = req.body;
    
    // Validate transaction exists
    const transaction = await Transaction.findById(transactionId).populate('userId', 'name email');
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Create case
    const newCase = await Case.create({
      transactionId,
      createdBy: req.user._id,
      title,
      description,
      riskScore: transaction.riskScore,
      priority: priority || 'Medium',
      timeline: [{
        action: 'Case created from transaction',
        user: req.user._id,
        userRole: req.user.role,
        details: `Created by ${req.user.name} (${req.user.email})`
      }]
    });
    
    // Populate case with user info
    await newCase.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'transactionId', populate: { path: 'userId', select: 'name email' } }
    ]);
    
    // Broadcast new case to investigators
    socketService.broadcastCase(newCase, 'investigator');
    
    // Send notification to compliance team
    socketService.broadcastSystemMessage(
      `📋 New case created: ${title} (Risk: ${transaction.riskScore})`,
      'compliance'
    );
    
    // Award points to compliance officer for creating case
    try {
      await PointsService.awardCaseCreation(req.user._id, newCase._id);
    } catch (pointsError) {
      console.error('Error awarding points for case creation:', pointsError);
      // Don't fail the case creation if points awarding fails
    }
    
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create a fraud case from an alert
exports.createCaseFromAlert = async (req, res) => {
  try {
    const { alertId, title, description, priority } = req.body;
    const alert = await Alert.findById(alertId).populate('transactionId');
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    // Mark alert as resolved
    alert.resolved = true;
    await alert.save();
    
    const newCase = await Case.create({
      alertId,
      createdBy: req.user._id,
      title,
      description,
      riskScore: alert.riskScore,
      priority: priority || 'Medium',
      timeline: [{
        action: 'Case created from alert',
        user: req.user._id,
        userRole: req.user.role,
        details: `Created by ${req.user.name} (${req.user.email})`
      }]
    });
    
    await newCase.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'alertId', populate: { path: 'transactionId', populate: { path: 'userId', select: 'name email' } } }
    ]);
    
    // Broadcast new case to investigators
    socketService.broadcastCase(newCase, 'investigator');
    
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all cases (with role-based filtering)
exports.getAll = async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'compliance') {
      // Compliance officers see cases they created
      query.createdBy = req.user._id;
    } else if (req.user.role === 'investigator') {
      // Investigators see cases assigned to them individually or unassigned cases
      query.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null }
      ];
    }
    // Admins see all cases
    
    const cases = await Case.find(query)
      .populate('alertId')
      .populate('transactionId', 'amount country timestamp riskScore')
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('closedBy', 'name email role')
      .populate({ path: 'comments', populate: { path: 'userId', select: 'name email role' } })
      .populate('evidence')
      .sort({ createdAt: -1 });
    
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get case by ID
exports.getById = async (req, res) => {
  try {
    const c = await Case.findById(req.params.id)
      .populate('alertId')
      .populate('transactionId', 'amount country timestamp riskScore')
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('closedBy', 'name email role')
      .populate({ path: 'comments', populate: { path: 'userId', select: 'name email role' } })
      .populate('evidence');
    
    if (!c) return res.status(404).json({ error: 'Case not found' });
    
    // Check access permissions
    if (req.user.role === 'compliance' && c.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get cases by user ID
exports.getByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'compliance') {
      // Compliance officers can only see cases they created
      query.createdBy = userId;
      if (userId !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'investigator') {
      // Investigators can see cases assigned to them
      query.assignedTo = userId;
      if (userId !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    // Admins can see all cases
    
    const cases = await Case.find(query)
      .populate('alertId')
      .populate('transactionId', 'amount country timestamp riskScore')
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('closedBy', 'name email role')
      .populate({ path: 'comments', populate: { path: 'userId', select: 'name email role' } })
      .populate('evidence')
      .sort({ createdAt: -1 });
    
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign investigator
exports.assignInvestigator = async (req, res) => {
  try {
    const { investigatorId } = req.body;
    const user = await User.findById(investigatorId);
    if (!user || user.role !== 'investigator') {
      return res.status(400).json({ error: 'Invalid investigator' });
    }
    
    const c = await Case.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo: investigatorId, 
        assignedToGroup: null, // Clear group assignment when assigning individual
        status: 'Assigned',
        $push: { 
          timeline: { 
            action: 'Investigator assigned', 
            user: req.user._id,
            userRole: req.user.role,
            details: `Assigned to ${user.name} (${user.email})`
          } 
        } 
      },
      { new: true }
    ).populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
    
    if (!c) return res.status(404).json({ error: 'Case not found' });
    
    // Notify assigned investigator
    socketService.broadcastSystemMessage(
      `🔍 New case assigned: ${c.title}`,
      'investigator',
      investigatorId
    );
    
    // Notify compliance officer
    socketService.broadcastSystemMessage(
      `👤 Case assigned to investigator: ${user.name}`,
      'compliance',
      c.createdBy._id
    );
    
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Assign case to self (investigator)
exports.assignToSelf = async (req, res) => {
  try {
    const c = await Case.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo: req.user._id,
        status: 'Assigned',
        $push: { 
          timeline: { 
            action: 'Investigator self-assigned', 
            user: req.user._id,
            userRole: req.user.role,
            details: `Self-assigned by ${req.user.name} (${req.user.email})`
          } 
        } 
      },
      { new: true }
    ).populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
    
    if (!c) return res.status(404).json({ error: 'Case not found' });
    
    // Notify compliance officer
    if (c.createdBy._id.toString() !== req.user._id.toString()) {
      socketService.broadcastSystemMessage(
        `👤 Case self-assigned by investigator: ${req.user.name}`,
        'compliance',
        c.createdBy._id
      );
    }
    
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update case status
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updateData = { 
      status, 
      $push: { 
        timeline: { 
          action: `Status changed to ${status}`, 
          user: req.user._id,
          userRole: req.user.role,
          details: notes || ''
        } 
      }
    };
    
    // If closing the case, add closedAt and closedBy
    if (status === 'Closed') {
      updateData.closedAt = new Date();
      updateData.closedBy = req.user._id;
    }
    
    const c = await Case.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
    
    if (!c) return res.status(404).json({ error: 'Case not found' });
    
    // Award points based on status change
    try {
      if (status === 'Closed' && req.user.role === 'investigator') {
        // Investigator gets points for closing case
        await PointsService.awardCaseClose(req.user._id, c._id);
        
        // Compliance officer gets points when their case is closed
        if (c.createdBy._id.toString() !== req.user._id.toString()) {
          await PointsService.awardCaseClosed(c.createdBy._id, c._id);
        }
      } else if (['Confirmed Fraud', 'Account Frozen', 'Transaction Reversed', 'Reported to Compliance', 'Added to Watchlist', 'Escalated', 'Customer Verification Requested'].includes(status) && req.user.role === 'investigator') {
        // Investigator gets points for making a decision
        await PointsService.awardDecision(req.user._id, c._id, status);
      }
    } catch (pointsError) {
      console.error('Error awarding points for status update:', pointsError);
      // Don't fail the status update if points awarding fails
    }
    
    // Notify relevant parties
    if (c.createdBy._id.toString() !== req.user._id.toString()) {
      socketService.broadcastSystemMessage(
        `📊 Case status updated: ${c.title} - ${status}`,
        'compliance',
        c.createdBy._id
      );
    }
    
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add comment to case
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.create({
      caseId: req.params.id,
      userId: req.user._id,
      text
    });
    
    await Case.findByIdAndUpdate(req.params.id, { 
      $push: { 
        comments: comment._id,
        timeline: {
          action: 'Comment added',
          user: req.user._id,
          userRole: req.user.role,
          details: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        }
      } 
    });
    
    // Populate comment with user info
    await comment.populate('userId', 'name email role');
    
    // Notify other case participants
    const c = await Case.findById(req.params.id).populate('createdBy assignedTo');
    if (c.createdBy._id.toString() !== req.user._id.toString()) {
      socketService.broadcastSystemMessage(
        `💬 New comment on case: ${c.title}`,
        'compliance',
        c.createdBy._id
      );
    }
    if (c.assignedTo && c.assignedTo._id.toString() !== req.user._id.toString()) {
      socketService.broadcastSystemMessage(
        `💬 New comment on case: ${c.title}`,
        'investigator',
        c.assignedTo._id
      );
    }
    
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Upload evidence
exports.uploadEvidence = async (req, res) => {
  try {
    const { filename, fileUrl, description } = req.body;
    const evidence = await Evidence.create({
      caseId: req.params.id,
      filename,
      fileUrl,
      description,
      uploadedBy: req.user._id
    });
    
    await Case.findByIdAndUpdate(req.params.id, { 
      $push: { 
        evidence: evidence._id,
        timeline: {
          action: 'Evidence uploaded',
          user: req.user._id,
          userRole: req.user.role,
          details: filename
        }
      } 
    });
    
    res.status(201).json(evidence);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Close case (compliance officer)
exports.closeCase = async (req, res) => {
  try {
    const { resolution } = req.body;
    
    const c = await Case.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Closed', 
        closedAt: new Date(),
        closedBy: req.user._id,
        $push: { 
          timeline: { 
            action: 'Case closed', 
            user: req.user._id,
            userRole: req.user.role,
            details: resolution || 'Case resolved by compliance officer'
          } 
        } 
      },
      { new: true }
    ).populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
    
    if (!c) return res.status(404).json({ error: 'Case not found' });
    
    // Notify assigned investigator if different from closer
    if (c.assignedTo && c.assignedTo._id.toString() !== req.user._id.toString()) {
      socketService.broadcastSystemMessage(
        `✅ Case closed: ${c.title}`,
        'investigator',
        c.assignedTo._id
      );
    }
    
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get available cases (for investigators to self-assign)
exports.getAvailable = async (req, res) => {
  try {
    // Get cases that are not assigned to anyone or are assigned to the current user
    const cases = await Case.find({
      $or: [
        { assignedTo: null },
        { assignedTo: req.user._id }
      ],
      status: { $ne: 'Closed' }
    })
    .populate('alertId')
    .populate('transactionId', 'amount country timestamp riskScore')
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('closedBy', 'name email role')
    .populate({ path: 'comments', populate: { path: 'userId', select: 'name email role' } })
    .populate('evidence')
    .sort({ createdAt: -1 });
    
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get case statistics
exports.getStats = async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'compliance') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'investigator') {
      query.assignedTo = req.user._id;
    }
    
    const stats = await Case.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          openCases: { $sum: { $cond: [{ $ne: ['$status', 'Closed'] }, 1, 0] } },
          closedCases: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
          avgRiskScore: { $avg: '$riskScore' },
          highPriorityCases: { $sum: { $cond: [{ $in: ['$priority', ['High', 'Critical']] }, 1, 0] } }
        }
      }
    ]);
    
    res.json(stats[0] || {
      totalCases: 0,
      openCases: 0,
      closedCases: 0,
      avgRiskScore: 0,
      highPriorityCases: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete case
exports.deleteCase = async (req, res) => {
  try {
    const c = await Case.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json({ message: 'Case deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 