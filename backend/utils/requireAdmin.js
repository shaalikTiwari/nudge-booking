function requireAdmin(req, res, next) {
    const passcode = req.header('x-admin-passcode');
    if (!passcode || passcode !== process.env.ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }
  
  module.exports = requireAdmin;