const Case = require('../models/Case');
const Alert = require('../models/Alert');
const Comment = require('../models/Comment');
const Evidence = require('../models/Evidence');
const User = require('../models/User');

// Create a fraud case from an alert
exports.createCase = async (req, res) => {
  try {
    const { alertId, description } = req.body;
    const alert = await Alert.findById(alertId);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    // Mark alert as resolved
    alert.resolved = true;
    await alert.save();
    const newCase = await Case.create({
      alertId,
      description,
      timeline: [{ action: 'Case created', user: req.user._id }]
    });
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all cases
exports.getAll = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate('alertId')
      .populate('assignedTo', 'name email')
      .populate('comments')
      .populate('evidence');
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
      .populate('assignedTo', 'name email')
      .populate({ path: 'comments', populate: { path: 'userId', select: 'name email' } })
      .populate('evidence');
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign investigator
exports.assignInvestigator = async (req, res) => {
  try {
    const { investigatorId } = req.body;
    const user = await User.findById(investigatorId);
    if (!user || user.role !== 'investigator') return res.status(400).json({ error: 'Invalid investigator' });
    const c = await Case.findByIdAndUpdate(
      req.params.id,
      { assignedTo: investigatorId, $push: { timeline: { action: 'Investigator assigned', user: req.user._id } } },
      { new: true }
    );
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update case status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const c = await Case.findByIdAndUpdate(
      req.params.id,
      { status, $push: { timeline: { action: `Status changed to ${status}`, user: req.user._id } }, updatedAt: new Date() },
      { new: true }
    );
    if (!c) return res.status(404).json({ error: 'Case not found' });
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
    await Case.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Upload evidence (assume fileUrl and filename in body for now)
exports.uploadEvidence = async (req, res) => {
  try {
    const { filename, fileUrl } = req.body;
    const evidence = await Evidence.create({
      caseId: req.params.id,
      filename,
      fileUrl,
      uploadedBy: req.user._id
    });
    await Case.findByIdAndUpdate(req.params.id, { $push: { evidence: evidence._id } });
    res.status(201).json(evidence);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Close case
exports.closeCase = async (req, res) => {
  try {
    const c = await Case.findByIdAndUpdate(
      req.params.id,
      { status: 'Closed', $push: { timeline: { action: 'Case closed', user: req.user._id } }, updatedAt: new Date() },
      { new: true }
    );
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
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