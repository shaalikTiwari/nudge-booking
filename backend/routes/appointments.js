const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const requireAdmin = require('../utils/requireAdmin');
const { sendWhatsAppMessage } = require('../utils/whatsapp');
const { generateDaySlots } = require('../utils/slots');
const { sendEmail } = require('../utils/sendEmail');

// Rate limiter specific to public booking endpoint
// Max 10 booking attempts per IP per hour
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many booking attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation helper
function validateLength(value, fieldName, max) {
  if (typeof value === 'string' && value.length > max) {
    throw new Error(`${fieldName} must be ${max} characters or less`);
  }
}

// GET /api/appointments/available-slots?date=YYYY-MM-DD&slug=business-slug — public
router.get('/available-slots', async (req, res) => {
  const { date, slug } = req.query;
  if (!date || !slug) return res.status(400).json({ error: 'date and slug are required' });

  const business = await Business.findOne({ slug });
  if (!business) return res.status(404).json({ error: 'Business not found' });

  if (business.blockedDates && business.blockedDates.includes(date)) {
    return res.json({ available: [], businessName: business.name, blocked: true });
  }

  const allSlots = generateDaySlots(business.openHour, business.closeHour, business.slotLengthMinutes);
  const booked = await Appointment.find({ business: business._id, date, status: 'booked' }).select('time');
  const bookedTimes = new Set(booked.map((b) => b.time));

  const available = allSlots.filter((slot) => !bookedTimes.has(slot));
  res.json({ available, businessName: business.name, blocked: false });
});

// GET /api/appointments — admin only
router.get('/', requireAdmin, async (req, res) => {
  const appointments = await Appointment.find({ business: req.business._id })
    .populate('service')
    .sort({ date: 1, time: 1 });
  res.json(appointments);
});

// POST /api/appointments — public booking with rate limiting
router.post('/', bookingLimiter, async (req, res) => {
  try {
    const { customerName, customerPhone, service, date, time, slug } = req.body;

    if (!customerName || !customerPhone || !service || !date || !time || !slug) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Input length validation
    validateLength(customerName, 'Customer name', 100);
    validateLength(customerPhone, 'Phone number', 20);
    validateLength(slug, 'Slug', 60);

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

    // Send WhatsApp to customer
    sendWhatsAppMessage(customerPhone.replace(/\s+/g, ''), confirmationText);

    // Send email notification to business owner
    if (business.email) {
      const convert24to12 = (t) => {
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
      };

      sendEmail({
        to: business.email,
        subject: `New booking — ${customerName} on ${date}`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #0F4C42; font-size: 20px; margin-bottom: 4px;">New appointment booked</h2>
            <p style="color: #888; font-size: 13px; margin-bottom: 24px;">${business.name}</p>
            <div style="background: #F1F7F3; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px; font-size: 15px;"><strong>Customer:</strong> ${customerName}</p>
              <p style="margin: 0 0 8px; font-size: 15px;"><strong>Phone:</strong> ${customerPhone}</p>
              <p style="margin: 0 0 8px; font-size: 15px;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 0 0 8px; font-size: 15px;"><strong>Date:</strong> ${date}</p>
              <p style="margin: 0; font-size: 15px;"><strong>Time:</strong> ${convert24to12(time)}</p>
            </div>
            <a href="${process.env.FRONTEND_URL}/dashboard"
              style="display: inline-block; background: #0F4C42; color: white; padding: 12px 24px;
              border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View dashboard →
            </a>
            <p style="color: #ccc; font-size: 12px; margin-top: 24px;">Nudge — Appointment booking for small businesses</p>
          </div>
        `,
      });
    }

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