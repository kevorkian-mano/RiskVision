const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'compliance', 'investigator', 'auditor'] },
  lastActive: { type: Date, default: null },
  points: { type: Number, default: 0 },
  pointsHistory: [{
    action: { type: String, required: true },
    points: { type: Number, required: true },
    description: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of related case/transaction
    awardedBy: { type: mongoose.Schema.Types.ObjectId }, // ID of admin who awarded bonus points
    awardedByName: { type: String }, // Name of admin who awarded bonus points
    earnedAt: { type: Date, default: Date.now }
  }]
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
