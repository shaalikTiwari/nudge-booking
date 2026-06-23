const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Business = require('../models/Business');
const requireAdmin = require('../utils/requireAdmin');
const { isTrialActive, daysLeftInTrial } = require('../utils/trial');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// GET /api/billing/status — get current billing status for logged-in business
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const business = req.business;
    const trialActive = isTrialActive(business.createdAt);
    const daysLeft = daysLeftInTrial(business.createdAt);

    res.json({
      subscriptionStatus: business.subscriptionStatus,
      trialActive,
      daysLeft,
      currentPeriodEnd: business.currentPeriodEnd,
      hasAccess:
        trialActive ||
        business.subscriptionStatus === 'active',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/create-order — create a Razorpay order for one month
router.post('/create-order', requireAdmin, async (req, res) => {
    try {
      const amount = parseInt(process.env.MONTHLY_PRICE) || 149900;
  
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `n_${req.business._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
        notes: {
          businessId: req.business._id.toString(),
          businessName: req.business.name,
        },
      });
  
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        businessName: req.business.name,
        businessEmail: req.business.email,
      });
    } catch (err) {
      console.error('create-order CAUGHT ERROR:', err);
      res.status(500).json({ error: err.message });
    }
  });

// POST /api/billing/verify — verify payment signature and activate subscription
router.post('/verify', requireAdmin, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify the payment signature — this is critical for security
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Activate subscription for 30 days
    const business = req.business;
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    business.subscriptionStatus = 'active';
    business.currentPeriodEnd = periodEnd;
    await business.save();

    res.json({
      success: true,
      message: 'Payment verified. Your subscription is now active.',
      currentPeriodEnd: periodEnd,
    });
    } catch (err) {
        console.error('Billing create-order error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;