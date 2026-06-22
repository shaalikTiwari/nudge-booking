const express = require('express');
const router = express.Router();

// Auth is now handled by /api/business/login
// Keeping this file so the route mount in server.js doesn't break
router.get('/', (req, res) => res.json({ message: 'Use /api/business/login to authenticate' }));

module.exports = router;