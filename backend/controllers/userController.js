const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendWelcomeEmail, sendCustomEmail } = require('../services/emailService');

// Register a new user (Admin only)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = new User({ name, email, password, role });
    await user.save();
    
    // Send welcome email to the new user
    try {
      const emailResult = await sendWelcomeEmail(user);
      if (emailResult.success) {
        console.log(`Welcome email sent successfully to ${user.email}`);
      } else {
        console.error(`Failed to send welcome email to ${user.email}:`, emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the user creation if email fails
    }
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      user: { id: user._id, name, email, role },
      emailSent: true
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    // Update lastActive
    user.lastActive = new Date();
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current user info
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users (Admin only)
exports.getAll = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get users by role (Admin and Compliance can access)
exports.getByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user role (Admin only)
exports.updateRole = async (req, res) => {
  try {
    // Prevent admin from changing their own role
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: "You cannot change your own role." });
    }
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Send custom email to user (Admin only)
exports.sendEmail = async (req, res) => {
  try {
    const { userId, subject, message } = req.body;
    
    // Get the user to send email to
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get admin info
    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Send the custom email
    const emailResult = await sendCustomEmail(user, subject, message, admin.name);
    
    if (emailResult.success) {
      res.json({ 
        message: `Email sent successfully to ${user.name} (${user.email})`,
        messageId: emailResult.messageId
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send email',
        details: emailResult.error
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 