const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const requireSuperAdmin = require('../utils/requireSuperAdmin');

// All routes in this file require the super admin key
router.use(requireSuperAdmin);

// GET /api/superadmin/stats — platform-wide overview
router.get('/stats', async (req, res) => {
  try {
    const [totalBusinesses, totalAppointments, activeBusinesses] = await Promise.all([
      Business.countDocuments(),
      Appointment.countDocuments(),
      Business.countDocuments({ suspended: false }),
    ]);

    res.json({
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses: totalBusinesses - activeBusinesses,
      totalAppointments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/superadmin/businesses — list all businesses with stats
router.get('/businesses', async (req, res) => {
  try {
    const businesses = await Business.find()
      .select('-password')
      .sort({ createdAt: -1 });

    // Attach appointment count to each business
    const withStats = await Promise.all(
      businesses.map(async (b) => {
        const appointmentCount = await Appointment.countDocuments({ business: b._id });
        const serviceCount = await Service.countDocuments({ business: b._id });
        return {
          ...b.toObject(),
          appointmentCount,
          serviceCount,
        };
      })
    );

    res.json(withStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/superadmin/businesses/:id — single business detail
router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).select('-password');
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const appointments = await Appointment.find({ business: business._id })
      .populate('service')
      .sort({ date: -1 })
      .limit(20);

    const services = await Service.find({ business: business._id });

    res.json({ business, appointments, services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/superadmin/businesses/:id/suspend — suspend a business
router.patch('/businesses/:id/suspend', async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { suspended: true },
      { new: true }
    ).select('-password');
    res.json({ message: `${business.name} has been suspended.`, business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/superadmin/businesses/:id/reactivate — reactivate a suspended business
router.patch('/businesses/:id/reactivate', async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { suspended: false },
      { new: true }
    ).select('-password');
    res.json({ message: `${business.name} has been reactivated.`, business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/superadmin/businesses/:id — permanently delete a business and all its data
router.delete('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });

    // Delete everything tied to this business
    await Promise.all([
      Appointment.deleteMany({ business: business._id }),
      Service.deleteMany({ business: business._id }),
      Business.findByIdAndDelete(business._id),
    ]);

    res.json({ message: `${business.name} and all its data has been permanently deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;