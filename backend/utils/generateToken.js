const jwt = require('jsonwebtoken');

function generateToken(businessId) {
  return jwt.sign({ id: businessId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

module.exports = generateToken;