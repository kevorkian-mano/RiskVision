const Rule = require('../models/Rule');

// Add a new risk rule
exports.addRule = async (req, res) => {
  try {
    const { name, condition, threshold, description } = req.body;
    
    // Basic validation
    if (!name || !condition || threshold === undefined) {
      return res.status(400).json({ error: 'Name, condition, and threshold are required' });
    }
    
    // Check if rule with same name already exists
    const existingRule = await Rule.findOne({ name });
    if (existingRule) {
      return res.status(400).json({ error: 'Rule with this name already exists' });
    }
    
    const rule = await Rule.create({
      name,
      condition,
      threshold,
      description
    });
    
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit a risk rule
exports.editRule = async (req, res) => {
  try {
    const { name, condition, threshold, description } = req.body;
    
    // Basic validation
    if (!name || !condition || threshold === undefined) {
      return res.status(400).json({ error: 'Name, condition, and threshold are required' });
    }
    
    // Check if rule with same name already exists (excluding current rule)
    const existingRule = await Rule.findOne({ name, _id: { $ne: req.params.id } });
    if (existingRule) {
      return res.status(400).json({ error: 'Rule with this name already exists' });
    }
    
    const rule = await Rule.findByIdAndUpdate(
      req.params.id,
      { name, condition, threshold, description },
      { new: true }
    );
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all rules
exports.getAll = async (req, res) => {
  try {
    const rules = await Rule.find().sort({ createdAt: -1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a rule
exports.deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json({ message: 'Rule deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 