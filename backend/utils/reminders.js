const cron = require('node-cron');
const dayjs = require('dayjs');
const Appointment = require('../models/Appointment');
const { sendWhatsAppMessage } = require('./whatsapp');

async function sendReminders() {
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

  const appointments = await Appointment.find({
    date: tomorrow,
    status: 'booked',
    reminderSent: false,
  }).populate('service');

  for (const appt of appointments) {
    const serviceName = appt.service ? appt.service.name : 'your appointment';
    const body = `Hi ${appt.customerName}! Reminder: you have a ${serviceName} appointment tomorrow at ${appt.time}. See you then 👋`;

    const sent = await sendWhatsAppMessage(appt.customerPhone, body);
    if (sent) {
      appt.reminderSent = true;
      await appt.save();
    }
  }

  console.log(`Reminder job ran for ${tomorrow}: ${appointments.length} reminder(s) processed.`);
}

function startReminderCron() {
  cron.schedule('0 18 * * *', () => {
    sendReminders().catch((err) => console.error('Reminder cron error:', err.message));
  });
  console.log('✓ Reminder cron scheduled (daily at 18:00)');
}

module.exports = { startReminderCron, sendReminders };