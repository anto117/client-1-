require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ✅ Use correct client URL
const CLIENT_URL = 'https://client-1-4.onrender.com';

// ✅ Allow frontend to access this API
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Booking schema
const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  datetime: String,
  arrived: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d',
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

// ✅ Routes
app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/api/bookings', async (req, res) => {
  const bookings = await Booking.find().sort({ datetime: 1 });
  res.json(bookings);
});

app.post('/api/book', async (req, res) => {
  const { name, email, phone, datetime } = req.body;
  console.log('📥 Booking Request:', req.body);

  if (!name?.trim() || !datetime?.trim() || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Name, valid phone, and Date/Time are required' });
  }

  const existing = await Booking.findOne({ datetime });
  if (existing) {
    return res.status(409).json({ message: 'Time slot is already booked' });
  }

  const booking = new Booking({ name, email, phone, datetime });
  await booking.save();

  io.emit('bookingConfirmed', { name, datetime, phone });

  if (email?.trim()) {
    try {
      await transporter.sendMail({
        from: `"Appointment Scheduler" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Appointment Confirmation',
        html: `
          <p>Hello ${name},</p>
          <p>Your appointment has been successfully booked.</p>
          <p><strong>Date & Time:</strong> ${datetime}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p>Thank you!</p>
        `,
      });
      console.log(`📧 Confirmation email sent to ${email}`);
    } catch (error) {
      console.error('❌ Email send failed:', error);
    }
  }

  res.json({ message: 'Appointment booked successfully' });
});

app.post('/api/mark-arrived/:id', async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { arrived: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Marked as arrived', booking: updated });
  } catch (err) {
    console.error('❌ Error marking as arrived:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Setup WebSocket server
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('🟢 WebSocket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
