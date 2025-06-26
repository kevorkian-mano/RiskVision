const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  name: String,
  condition: String, // e.g. 'amount > 10000'
  threshold: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rule', ruleSchema); 