const jwt = require('jsonwebtoken');
const Business = require('../models/Business');

async function requireAdmin(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.business = await Business.findById(decoded.id).select('-password');
    if (!req.business) return res.status(401).json({ error: 'Business not found' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAdmin;