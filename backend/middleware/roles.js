const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

const compliance = (req, res, next) => {
  if (req.user.role !== 'compliance' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Compliance or admin role required.' });
  }
  next();
};

const investigator = (req, res, next) => {
  if (req.user.role !== 'investigator' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Investigator or admin role required.' });
  }
  next();
};

const auditor = (req, res, next) => {
  if (req.user.role !== 'auditor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Auditor or admin role required.' });
  }
  next();
};

// Allow any authenticated user (for general endpoints)
const anyRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
};

module.exports = {
  admin,
  compliance,
  investigator,
  auditor,
  anyRole
}; 