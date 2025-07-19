import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';

const AdminCalendar = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [arrivedStatus, setArrivedStatus] = useState({}); // Track arrival status

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get('https://client-1-1-kwwd.onrender.com/api/bookings');
      setBookings(res.data);

      const initialStatus = {};
      res.data.forEach(b => {
        initialStatus[b._id] = b.arrived || false;
      });
      setArrivedStatus(initialStatus);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const markAsArrived = async (bookingId) => {
    try {
      await axios.post(`https://client-1-1-kwwd.onrender.com/api/mark-arrived/${bookingId}`);
      setArrivedStatus(prev => ({ ...prev, [bookingId]: true }));
    } catch (err) {
      console.error('Error marking as arrived:', err);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(moment(date));
  };

  const getBookingsForDate = (date) => {
    return bookings.filter((b) => moment(b.datetime).isSame(date, 'day'));
  };

  const goToPreviousMonth = () => {
    setSelectedDate((prev) => moment(prev).subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setSelectedDate((prev) => moment(prev).add(1, 'month'));
  };

  const generateCalendar = () => {
    const startOfMonth = moment(selectedDate).startOf('month').startOf('week');
    const endOfMonth = moment(selectedDate).endOf('month').endOf('week');
    const calendar = [];
    let day = startOfMonth.clone();
    while (day.isBefore(endOfMonth, 'day')) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day.clone());
        day.add(1, 'day');
      }
      calendar.push(week);
    }
    return calendar;
  };

  const calendar = generateCalendar();

  return (
    <div style={{ minHeight: '100vh', background: '#5E786B', padding: '32px 24px' }}>
      <img
        src={process.env.PUBLIC_URL + '/Dental.png'}
        alt="Dental Logo"
        style={{ display: 'block', margin: '0 auto 24px auto', width: 120, height: 120 }}
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'rgba(255,255,255,0.97)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px #5E786B' }}>
        {/* Calendar Header */}
        <div style={{ background: 'linear-gradient(135deg, #5E786B 0%, #5E786B 100%)', color: '#ffffff', padding: '32px 40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700' }}>📅 Appointment Dashboard</h1>
          <p style={{ fontSize: '16px', opacity: '0.9' }}>Manage and view all scheduled appointments</p>
        </div>

        {/* Calendar Navigation */}
        <div style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <button style={{
              background: '#5E786B',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #5E786B'
            }} onClick={goToPreviousMonth}>⬅ Previous</button>
            <h2 style={{ color: '#06A3DA', fontWeight: 700 }}>{selectedDate.format('MMMM YYYY')}</h2>
            <button style={{
              background: '#5E786B',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(6,163,218,0.10)'
            }} onClick={goToNextMonth}>Next ➡</button>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
              <div key={day} style={{ fontWeight: 'bold', textAlign: 'center', color: '#06A3DA' }}>{day}</div>
            ))}
            {calendar.map((week, i) => (
              <React.Fragment key={i}>
                {week.map((day, idx) => {
                  const isCurrentMonth = moment(day).isSame(selectedDate, 'month');
                  const hasBookings = getBookingsForDate(day).length > 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleDateClick(day)}
                      style={{
                        padding: '12px',
                        backgroundColor: isCurrentMonth ? (hasBookings ? '#e0f7ff' : '#f0faff') : '#e3e8f0',
                        borderRadius: '8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: isCurrentMonth && hasBookings ? '2px solid #06A3DA' : '1px solid #b6e6fa',
                        color: isCurrentMonth ? '#222' : '#b0b0b0',
                        fontWeight: hasBookings ? 700 : 400,
                        boxShadow: hasBookings ? '0 2px 8px rgba(6,163,218,0.10)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {day.format('D')}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Appointments for Selected Date */}
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ color: '#06A3DA', fontWeight: 700 }}>Appointments for {selectedDate.format('MMMM D, YYYY')}</h3>
            {getBookingsForDate(selectedDate).length === 0 ? (
              <p style={{ color: '#888' }}>No appointments.</p>
            ) : (
              getBookingsForDate(selectedDate).map((booking) => (
                <div key={booking._id} style={{ background: '#f0faff', border: '1.5px solid #06A3DA', borderRadius: '10px', padding: '16px', margin: '10px 0', boxShadow: '0 2px 8px rgba(6,163,218,0.10)' }}>
                  <p style={{ color: '#06A3DA', fontWeight: 600 }}><strong>Name:</strong> {booking.name}</p>
                  <p><strong>Email:</strong> {booking.email}</p>
                  <p><strong>Phone:</strong> {booking.phone}</p>
                  <p><strong>Time:</strong> {moment(booking.datetime).format('hh:mm A')}</p>
                  <button
                    onClick={() => markAsArrived(booking._id)}
                    disabled={arrivedStatus[booking._id]}
                    style={{
                      marginTop: '10px',
                      backgroundColor: arrivedStatus[booking._id] ? '#1ecb7c' : '#06A3DA',
                      color: '#fff',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: arrivedStatus[booking._id] ? 'default' : 'pointer',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(6,163,218,0.10)'
                    }}
                  >
                    {arrivedStatus[booking._id] ? '✅ Arrived' : '🚶 Mark as Arrived'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;
