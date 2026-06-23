const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    openHour: { type: Number, default: 10 },
    closeHour: { type: Number, default: 19 },
    slotLengthMinutes: { type: Number, default: 30 },
    suspended: { type: Boolean, default: false },
    blockedDates: [{ type: String }],
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

businessSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

businessSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Business', businessSchema);