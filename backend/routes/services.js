const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const requireAdmin = require('../utils/requireAdmin');

router.get('/', async (req, res) => {
  const services = await Service.find().sort({ name: 1 });
  res.json(services);
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;