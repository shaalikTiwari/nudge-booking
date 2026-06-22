const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const requireAdmin = require('../utils/requireAdmin');
const { sendWhatsAppMessage } = require('../utils/whatsapp');
const { generateDaySlots } = require('../utils/slots');

// GET /api/appointments/available-slots?date=YYYY-MM-DD&slug=business-slug — public
router.get('/available-slots', async (req, res) => {
  const { date, slug } = req.query;
  if (!date || !slug) return res.status(400).json({ error: 'date and slug are required' });

  const business = await Business.findOne({ slug });
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const allSlots = generateDaySlots(business.openHour, business.closeHour, business.slotLengthMinutes);
  const booked = await Appointment.find({ business: business._id, date, status: 'booked' }).select('time');
  const bookedTimes = new Set(booked.map((b) => b.time));

  const available = allSlots.filter((slot) => !bookedTimes.has(slot));
  res.json({ available, businessName: business.name });
});

// GET /api/appointments — admin only, own business appointments
router.get('/', requireAdmin, async (req, res) => {
  const appointments = await Appointment.find({ business: req.business._id })
    .populate('service')
    .sort({ date: 1, time: 1 });
  res.json(appointments);
});

// POST /api/appointments — public booking
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, service, date, time, slug } = req.body;

    if (!customerName || !customerPhone || !service || !date || !time || !slug) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const business = await Business.findOne({ slug });
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const clash = await Appointment.findOne({ business: business._id, date, time, status: 'booked' });
    if (clash) return res.status(409).json({ error: 'That slot was just booked. Pick another.' });

    const appointment = new Appointment({
      business: business._id,
      customerName,
      customerPhone: customerPhone.replace(/\s+/g, ''),
      service,
      date,
      time,
    });

    await appointment.save();
    await appointment.populate('service');

    const serviceName = appointment.service?.name || 'your service';
    const confirmationText = `Hi ${customerName}! Your ${serviceName} appointment at ${business.name} is confirmed for ${date} at ${time}. See you then 🎉`;

    sendWhatsAppMessage(customerPhone.replace(/\s+/g, ''), confirmationText);

    res.status(201).json({ appointment, confirmationText });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/appointments/:id — admin only
router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['booked', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, business: req.business._id },
    { status },
    { new: true }
  ).populate('service');
  res.json(appointment);
});

module.exports = router;