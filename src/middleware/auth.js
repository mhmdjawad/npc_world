function adminAuth(req, res, next) {
  const token = req.headers['authorization'];
  const adminToken = process.env.ADMIN_TOKEN || 'your_secure_admin_token_here';

  if (!token || token !== `Bearer ${adminToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = { adminAuth };
