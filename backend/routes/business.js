const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const generateToken = require('../utils/generateToken');
const requireAdmin = require('../utils/requireAdmin');

// POST /api/business/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, slug, phone } = req.body;

    if (!name || !email || !password || !slug) {
      return res.status(400).json({ error: 'Name, email, password and slug are required' });
    }

    const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const exists = await Business.findOne({ $or: [{ email }, { slug: slugClean }] });
    if (exists) {
      return res.status(409).json({ error: 'Email or slug already taken' });
    }

    const business = new Business({ name, email, password, slug: slugClean, phone });
    await business.save();

    res.status(201).json({
      _id: business._id,
      name: business.name,
      email: business.email,
      slug: business.slug,
      token: generateToken(business._id),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/business/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const business = await Business.findOne({ email });

    if (!business || !(await business.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block suspended accounts from logging in
    if (business.suspended) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    res.json({
      _id: business._id,
      name: business.name,
      email: business.email,
      slug: business.slug,
      token: generateToken(business._id),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/business/me
router.get('/me', requireAdmin, async (req, res) => {
  res.json(req.business);
});

// PATCH /api/business/me
router.patch('/me', requireAdmin, async (req, res) => {
  try {
    const { name, phone, openHour, closeHour, slotLengthMinutes } = req.body;
    const business = req.business;

    if (name) business.name = name;
    if (phone) business.phone = phone;
    if (openHour !== undefined) business.openHour = openHour;
    if (closeHour !== undefined) business.closeHour = closeHour;
    if (slotLengthMinutes !== undefined) business.slotLengthMinutes = slotLengthMinutes;

    await business.save();
    res.json(business);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;