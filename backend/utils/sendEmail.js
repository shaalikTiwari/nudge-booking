const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"Nudge" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`✓ Email sent to ${to}`);
  } catch (err) {
    console.error('✗ Email send failed:', err.message);
  }
}

module.exports = { sendEmail };