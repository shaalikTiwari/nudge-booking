const cron = require('node-cron');
const dayjs = require('dayjs');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { sendWhatsAppMessage } = require('./whatsapp');
const { sendEmail } = require('./sendEmail');
const { daysLeftInTrial } = require('./trial');

async function sendReminders() {
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

  const appointments = await Appointment.find({
    date: tomorrow,
    status: 'booked',
    reminderSent: false,
  }).populate('service').populate('business');

  for (const appt of appointments) {
    const serviceName = appt.service?.name || 'your appointment';
    const businessName = appt.business?.name || 'us';
    const body = `Hi ${appt.customerName}! Reminder: you have a ${serviceName} appointment at ${businessName} tomorrow at ${appt.time}. See you then 👋`;

    const sent = await sendWhatsAppMessage(appt.customerPhone, body);
    if (sent) {
      appt.reminderSent = true;
      await appt.save();
    }
  }

  console.log(`Reminder job ran for ${tomorrow}: ${appointments.length} reminder(s) processed.`);
}

async function sendTrialExpiryWarnings() {
  // Find all businesses still on trial
  const businesses = await Business.find({ subscriptionStatus: 'trial' });

  for (const business of businesses) {
    const daysLeft = daysLeftInTrial(business.createdAt);

    // Send warning at exactly 3 days left
    if (daysLeft === 3) {
      await sendEmail({
        to: business.email,
        subject: 'Your Nudge trial ends in 3 days',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #0F4C42;">Your free trial ends in 3 days</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Hi ${business.name}, your Nudge free trial ends in 3 days.
              To keep receiving bookings and automated WhatsApp reminders, subscribe before your trial ends.
            </p>
            <a href="${process.env.FRONTEND_URL}/billing"
              style="display: inline-block; margin: 24px 0; background: #FF6B4A; color: white;
              padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Subscribe now — ₹1,499/month →
            </a>
            <p style="color: #888; font-size: 13px;">
              After your trial ends, you'll still be able to log in and subscribe from your billing page.
              Your data and booking history are never deleted.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #ccc; font-size: 12px;">Nudge — Appointment booking for small businesses</p>
          </div>
        `,
      });
      console.log(`✓ Trial expiry warning sent to ${business.email}`);
    }

    // Send final warning at exactly 1 day left
    if (daysLeft === 1) {
      await sendEmail({
        to: business.email,
        subject: '⚠️ Your Nudge trial expires tomorrow',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #E5512F;">Your trial expires tomorrow</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Hi ${business.name}, this is your last reminder — your Nudge free trial expires tomorrow.
              Subscribe today to avoid any interruption to your booking page and WhatsApp reminders.
            </p>
            <a href="${process.env.FRONTEND_URL}/billing"
              style="display: inline-block; margin: 24px 0; background: #FF6B4A; color: white;
              padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Subscribe now — ₹1,499/month →
            </a>
            <p style="color: #ccc; font-size: 12px; margin-top: 24px;">Nudge — Appointment booking for small businesses</p>
          </div>
        `,
      });
      console.log(`✓ Final trial warning sent to ${business.email}`);
    }
  }
}

function startReminderCron() {
  // Appointment reminders — daily at 6 PM
  cron.schedule('0 18 * * *', () => {
    sendReminders().catch((err) => console.error('Reminder cron error:', err.message));
  });

  // Trial expiry warnings — daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    sendTrialExpiryWarnings().catch((err) => console.error('Trial warning cron error:', err.message));
  });

  console.log('✓ Reminder cron scheduled (daily at 18:00)');
  console.log('✓ Trial warning cron scheduled (daily at 09:00)');
}

module.exports = { startReminderCron, sendReminders };