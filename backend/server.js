require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
const server = http.createServer(app);

// ✅ Allow both localhost and deployed frontend
const allowedOrigins = [
  'http://localhost:3000',
  'https://client-1-1-2ord.onrender.com'
];

// ✅ Parse JSON first (important!)
app.use(express.json());

// ✅ Apply CORS next
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

// ✅ Webhook-specific JSON parser
app.use('/api/webhook', express.json({ type: 'application/json' }));

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Google Calendar Setup
const credentials = {
  type: process.env.GOOGLE_TYPE,
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
};

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});
const calendar = google.calendar('v3');

// ✅ Booking Schema
const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  datetime: {
    type: Date,
    required: true
  },
  arrived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d',
  },
});
const Booking = mongoose.model('Booking', bookingSchema);

// ✅ Routes
app.get('/', (req, res) => res.send('API is running'));

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

  const existing = await Booking.findOne({ datetime: new Date(datetime) });
  if (existing) {
    return res.status(409).json({ message: 'Time slot is already booked' });
  }

  const booking = new Booking({ name, email, phone, datetime: new Date(datetime) });
  await booking.save();

  io.emit('bookingConfirmed', { name, datetime, phone });

  // ✅ Cal.com API
  try {
    const calRes = await axios.post(
      'https://api.cal.com/v1/bookings',
      {
        event: parseInt(process.env.CAL_EVENT_ID),
        title: `Appointment with ${name}`,
        startTime: new Date(datetime).toISOString(),
        attendees: [{ name, email }],
      },
      {
        headers: {
          apiKey: process.env.CAL_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('📆 Booked on Cal.com:', calRes.data);
  } catch (err) {
    console.error('❌ Cal.com error:', err.response?.data || err.message);
  }

  // ✅ Google Calendar
  try {
    const authClient = await auth.getClient();
    const calendarId = 'madukkakuzhydental1@gmail.com';

    const event = {
      summary: `Appointment - ${name}`,
      description: `Phone: ${phone}, Email: ${email}`,
      start: {
        dateTime: new Date(datetime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(new Date(datetime).getTime() + 30 * 60000).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
    };

    await calendar.events.insert({
      auth: authClient,
      calendarId,
      resource: event,
    });

    console.log('📅 Google Calendar event added');
  } catch (error) {
    console.error('❌ Google Calendar error:', error.message);
  }

  // ✅ Send Email
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
      console.log(`📧 Email sent to ${email}`);
    } catch (error) {
      console.error('❌ Email send error:', error);
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

app.post('/api/webhook', async (req, res) => {
  try {
    const event = req.body.type || req.body.event;
    const payload = req.body.payload || req.body;

    console.log('📩 Webhook received:', event);

    if (event === 'booking.created' || event === 'Booking Created') {
      const name = payload?.attendees?.[0]?.name || 'Unknown';
      const email = payload?.attendees?.[0]?.email || '';
      const datetime = payload?.startTime;

      const exists = await Booking.findOne({ datetime: new Date(datetime) });
      if (!exists) {
        const booking = new Booking({ name, email, phone: 'N/A', datetime: new Date(datetime) });
        await booking.save();
        console.log('✅ Saved booking from webhook');
      } else {
        console.log('ℹ️ Booking already exists');
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).send('Error processing webhook');
  }
});

// ✅ WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});
io.on('connection', (socket) => {
  console.log('🟢 WebSocket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
