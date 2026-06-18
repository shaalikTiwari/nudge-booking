require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const serviceRoutes = require('./routes/services');
const appointmentRoutes = require('./routes/appointments');
const authRoutes = require('./routes/auth');
const { startReminderCron } = require('./utils/reminders');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('Nudge booking API is running.'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  startReminderCron();
});