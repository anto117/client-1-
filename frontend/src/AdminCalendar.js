import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';

const AdminCalendar = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [arrivedStatus, setArrivedStatus] = useState({});

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get('https://client-1-mfoh.onrender.com/api/bookings');
      setBookings(res.data);

      const statusMap = {};
      res.data.forEach(b => {
        statusMap[b._id] = b.arrived || false;
      });
      setArrivedStatus(statusMap);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const markAsArrived = async (id) => {
    try {
      await axios.post(`https://client-1-mfoh.onrender.com/api/mark-arrived/${id}`);
      setArrivedStatus(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error('Error marking as arrived:', err);
    }
  };

  const getBookingsForDate = (date) => {
    return bookings.filter((b) =>
      moment(b.datetime).isSame(moment(date), 'day')
    );
  };

  const generateCalendar = () => {
    const start = moment(selectedDate).startOf('month').startOf('week');
    const end = moment(selectedDate).endOf('month').endOf('week');
    const calendar = [];

    let day = start.clone();
    while (day.isBefore(end, 'day')) {
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
      <img src="/Dental.png" alt="Logo" style={{ display: 'block', margin: '0 auto', width: 100 }} />
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', color: '#06A3DA' }}>📅 Admin Dashboard</h1>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
          <button onClick={() => setSelectedDate(prev => moment(prev).subtract(1, 'month'))}>⬅ Previous</button>
          <h2>{selectedDate.format('MMMM YYYY')}</h2>
          <button onClick={() => setSelectedDate(prev => moment(prev).add(1, 'month'))}>Next ➡</button>
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ fontWeight: 'bold', textAlign: 'center' }}>{day}</div>
          ))}
          {calendar.map((week, i) => (
            <React.Fragment key={i}>
              {week.map((day, idx) => {
                const isCurrentMonth = moment(day).isSame(selectedDate, 'month');
                const hasBookings = getBookingsForDate(day).length > 0;
                return (
                  <div key={idx}
                    onClick={() => setSelectedDate(day)}
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      textAlign: 'center',
                      backgroundColor: isCurrentMonth ? (hasBookings ? '#c8f5ff' : '#f5f8fa') : '#eee',
                      cursor: 'pointer',
                      fontWeight: hasBookings ? 'bold' : 'normal'
                    }}>
                    {day.format('D')}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Booking List */}
        <div style={{ marginTop: 30 }}>
          <h3>Appointments for {selectedDate.format('MMMM Do, YYYY')}</h3>
          {getBookingsForDate(selectedDate).length === 0 ? (
            <p>No appointments</p>
          ) : (
            getBookingsForDate(selectedDate).map(b => (
              <div key={b._id} style={{ padding: 16, border: '1px solid #06A3DA', borderRadius: 8, marginBottom: 10 }}>
                <p><strong>Name:</strong> {b.name}</p>
                <p><strong>Email:</strong> {b.email}</p>
                <p><strong>Phone:</strong> {b.phone}</p>
                <p><strong>Time:</strong> {moment(b.datetime).format('hh:mm A')}</p>
                <button
                  disabled={arrivedStatus[b._id]}
                  onClick={() => markAsArrived(b._id)}
                  style={{
                    backgroundColor: arrivedStatus[b._id] ? 'green' : '#06A3DA',
                    color: 'white',
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: 5,
                    cursor: arrivedStatus[b._id] ? 'not-allowed' : 'pointer'
                  }}
                >
                  {arrivedStatus[b._id] ? '✅ Arrived' : 'Mark as Arrived'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;
