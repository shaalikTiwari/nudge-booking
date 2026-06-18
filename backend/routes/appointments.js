const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const requireAdmin = require('../utils/requireAdmin');
const { sendWhatsAppMessage } = require('../utils/whatsapp');
const { generateDaySlots } = require('../utils/slots');
const business = require('../config/business');

router.get('/available-slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param is required' });

  const allSlots = generateDaySlots();
  const booked = await Appointment.find({ date, status: 'booked' }).select('time');
  const bookedTimes = new Set(booked.map((b) => b.time));

  const available = allSlots.filter((slot) => !bookedTimes.has(slot));
  res.json({ available, businessName: business.businessName });
});

router.get('/', requireAdmin, async (req, res) => {
  const appointments = await Appointment.find().populate('service').sort({ date: 1, time: 1 });
  res.json(appointments);
});

router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, service, date, time } = req.body;

    if (!customerName || !customerPhone || !service || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const clash = await Appointment.findOne({ date, time, status: 'booked' });
    if (clash) {
      return res.status(409).json({ error: 'That slot was just booked by someone else. Pick another.' });
    }

    const appointment = new Appointment({ customerName, customerPhone, service, date, time });
    await appointment.save();
    await appointment.populate('service');

    const serviceName = appointment.service ? appointment.service.name : 'your service';
    const confirmationText = `Hi ${customerName}! Your ${serviceName} appointment is confirmed for ${date} at ${time}. See you then 🎉`;

    sendWhatsAppMessage(customerPhone, confirmationText);

    res.status(201).json({ appointment, confirmationText });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['booked', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('service');
  res.json(appointment);
});

module.exports = router;