const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String }, // optional
  dateTime: { type: Date, required: true }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
