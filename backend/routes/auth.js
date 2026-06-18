const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { passcode } = req.body;
  if (passcode && passcode === process.env.ADMIN_PASSCODE) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: 'Incorrect passcode' });
});

module.exports = router;