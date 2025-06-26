const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  filename: String,
  fileUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Evidence', evidenceSchema); 