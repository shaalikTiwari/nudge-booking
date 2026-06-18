const business = require('../config/business');

function generateDaySlots() {
  const slots = [];
  const { openHour, closeHour, slotLengthMinutes } = business;
  let totalMinutes = openHour * 60;
  const endMinutes = closeHour * 60;

  while (totalMinutes < endMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    totalMinutes += slotLengthMinutes;
  }
  return slots;
}

module.exports = { generateDaySlots };