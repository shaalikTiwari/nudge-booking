const jwt = require('jsonwebtoken');
const Business = require('../models/Business');
const { isTrialActive } = require('./trial');

// Routes that should work even if subscription expired
// (so users can still log in and access billing page)
const BILLING_EXEMPT_PATHS = [
  '/api/business/login',
  '/api/business/register',
  '/api/business/me',
  '/api/billing/status',
  '/api/billing/create-order',
  '/api/billing/verify',
  '/api/password-reset',
];

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

    // Check if account is suspended by super admin
    if (req.business.suspended) {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    // Check billing access — skip for exempt paths
    const isExempt = BILLING_EXEMPT_PATHS.some((path) => req.originalUrl.startsWith(path));
    if (!isExempt) {
      const trialActive = isTrialActive(req.business.createdAt);
      const subActive = req.business.subscriptionStatus === 'active';

      if (!trialActive && !subActive) {
        return res.status(402).json({
          error: 'Subscription required',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAdmin;