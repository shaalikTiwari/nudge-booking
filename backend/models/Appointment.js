const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

appointmentSchema.index({ date: 1, time: 1 }, { unique: false });

module.exports = mongoose.model('Appointment', appointmentSchema);