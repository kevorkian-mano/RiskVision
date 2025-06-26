const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema); 