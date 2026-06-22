const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const requireAdmin = require('../utils/requireAdmin');

// GET /api/services/:slug — public, for the booking page
router.get('/:slug', async (req, res) => {
  const Business = require('../models/Business');
  const business = await Business.findOne({ slug: req.params.slug });
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const services = await Service.find({ business: business._id }).sort({ name: 1 });
  res.json(services);
});

// POST /api/services — admin only
router.post('/', requireAdmin, async (req, res) => {
  try {
    const service = new Service({ ...req.body, business: req.business._id });
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/services/:id — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, business: req.business._id });
  if (!service) return res.status(404).json({ error: 'Not found' });
  await service.deleteOne();
  res.json({ success: true });
});

module.exports = router;