require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const serviceRoutes = require('./routes/services');
const appointmentRoutes = require('./routes/appointments');
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/business');
const { startReminderCron } = require('./utils/reminders');
const { sanitizeBody } = require('./utils/sanitize');

const app = express();

// ─── Security headers ───────────────────────────────────────────────────────
// Helmet sets a bunch of HTTP headers that protect against common attacks
// like clickjacking, MIME sniffing, and cross-site scripting.
app.use(helmet());

// ─── CORS ───────────────────────────────────────────────────────────────────
// Only allow requests from your actual frontend domains.
// Add localhost for local dev, and your Vercel URL for production.
const allowedOrigins = [
  'http://localhost:5173',
  'https://nudge-booking.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman during dev)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} is not allowed`));
    }
  },
  credentials: true,
}));

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Reject suspiciously large payloads

// ─── MongoDB injection sanitization ─────────────────────────────────────────
// express-mongo-sanitize strips $ and . from req.body, req.query, req.params
// which prevents MongoDB operator injection attacks.
app.use(mongoSanitize());
app.use(sanitizeBody); // belt-and-suspenders: our own sanitizer too

// ─── Rate limiting ───────────────────────────────────────────────────────────
// Global limiter — all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down and try again in 15 minutes.' },
});

// Strict limiter — auth routes only (prevents brute-force password attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 login/register attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts — try again in 15 minutes.' },
});

app.use(globalLimiter);

// ─── Connect DB ──────────────────────────────────────────────────────────────
connectDB();

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/business', authLimiter, businessRoutes); // strict rate limit on auth
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Nudge API is running.' }));

// ─── Global error handler ────────────────────────────────────────────────────
// Catches anything that falls through with next(err)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  startReminderCron();
});