const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Business = require('../models/Business');
const { sendEmail } = require('../utils/sendEmail');

// POST /api/password-reset/request
// Business owner submits their email, gets a reset link
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const business = await Business.findOne({ email });

    // Always return success even if email not found — prevents email enumeration
    if (!business) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    business.resetToken = token;
    business.resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await business.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: business.email,
      subject: 'Reset your Nudge password',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #0F4C42; font-size: 22px; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Hi ${business.name}, someone requested a password reset for your Nudge account.
            If this was you, click the button below. The link expires in 1 hour.
          </p>
          <a href="${resetUrl}"
            style="display: inline-block; margin: 24px 0; background: #FF6B4A; color: white;
            padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Reset password →
          </a>
          <p style="color: #999; font-size: 13px;">
            If you didn't request this, ignore this email — your password won't change.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #ccc; font-size: 12px;">Nudge — Appointment booking for small businesses</p>
        </div>
      `,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/password-reset/reset
// Business owner submits token + new password
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const business = await Business.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // token must not be expired
    });

    if (!business) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    business.password = password;
    business.resetToken = undefined;
    business.resetTokenExpiry = undefined;
    await business.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;