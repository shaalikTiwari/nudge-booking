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
const superadminRoutes = require('./routes/superadmin');
const { startReminderCron } = require('./utils/reminders');
const { sanitizeBody } = require('./utils/sanitize');

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'https://nudge-booking.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} is not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(sanitizeBody);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down and try again in 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts — try again in 15 minutes.' },
});

app.use(globalLimiter);

connectDB();

app.use('/api/business', authLimiter, businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Nudge API is running.' }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  startReminderCron();
});