require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { google } = require('googleapis');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ✅ Deployed frontend URL (Render)
const CLIENT_URL = 'https://client-1-hwye.onrender.com';

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

// ✅ Google Calendar auth
const auth = new google.auth.GoogleAuth({
  credentials: require('./madukkakuzhy-calendar-6d25078c6f60.json'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});
const calendar = google.calendar({ version: 'v3', auth });

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

  // ✅ Add event to Google Calendar
  try {
    const calendarRes = await calendar.events.insert({
      calendarId: 'antosreju400@gmail.com',
      requestBody: {
        summary: `Appointment: ${name}`,
        description: `Phone: ${phone}\nEmail: ${email}`,
        start: {
          dateTime: new Date(datetime).toISOString(),
          timeZone: 'Asia/Kolkata'
        },
        end: {
          dateTime: new Date(new Date(datetime).getTime() + 30 * 60000).toISOString(),
          timeZone: 'Asia/Kolkata'
        },
      },
    });
    console.log('📅 Event added to Google Calendar:', calendarRes.data.htmlLink);
    console.log('✅ Full Calendar Event Response:', calendarRes.data);
  } catch (err) {
    console.error('❌ Failed to add to Google Calendar:', err);
  }

  // ✅ Send confirmation email
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

// ✅ WebSocket server
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
