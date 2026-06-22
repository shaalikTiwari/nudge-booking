function requireSuperAdmin(req, res, next) {
    const key = req.header('x-super-admin-key');
    if (!key || key !== process.env.SUPER_ADMIN_KEY) {
      // Return a 404 instead of 401 so it doesn't even hint
      // that this route exists to someone probing the API
      return res.status(404).json({ error: 'Not found' });
    }
    next();
  }
  
  module.exports = requireSuperAdmin;