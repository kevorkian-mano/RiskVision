const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const auth = require('../middleware/auth');
const { admin, compliance, investigator } = require('../middleware/roles');

// Create a new case from transaction (Compliance only)
router.post('/from-transaction', auth, compliance, caseController.createCaseFromTransaction);

// Create a new case from alert (Compliance only)
router.post('/from-alert', auth, compliance, caseController.createCaseFromAlert);

// Get case statistics
router.get('/stats', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'compliance' || req.user.role === 'investigator') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin, compliance, or investigator role required.' });
  }
}, caseController.getStats);

// Get available cases (Investigator only)
router.get('/available', auth, investigator, caseController.getAvailable);

// Get all cases (Admin, Compliance, Investigator can view)
router.get('/', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'compliance' || req.user.role === 'investigator') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin, compliance, or investigator role required.' });
  }
}, caseController.getAll);

// Get cases by user ID (Admin, Compliance, Investigator can view their own cases)
router.get('/user/:userId', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'compliance' || req.user.role === 'investigator') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin, compliance, or investigator role required.' });
  }
}, caseController.getByUser);

// Get case by ID (Admin, Compliance, Investigator can view)
router.get('/:id', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'compliance' || req.user.role === 'investigator') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin, compliance, or investigator role required.' });
  }
}, caseController.getById);

// Assign investigator (Compliance only)
router.put('/:id/assign', auth, compliance, caseController.assignInvestigator);

// Assign case to self (Investigator only)
router.put('/:id/assign-self', auth, investigator, caseController.assignToSelf);

// Update case status (Investigator only - for their assigned cases)
router.put('/:id/status', auth, investigator, caseController.updateStatus);

// Add comment (Admin, Compliance, Investigator can add comments)
router.post('/:id/comment', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'compliance' || req.user.role === 'investigator') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin, compliance, or investigator role required.' });
  }
}, caseController.addComment);

// Upload evidence (Investigator only)
router.post('/:id/evidence', auth, investigator, caseController.uploadEvidence);

// Close case (Compliance only)
router.put('/:id/close', auth, compliance, caseController.closeCase);

// Delete case (Admin only)
router.delete('/:id', auth, admin, caseController.deleteCase);

module.exports = router; 