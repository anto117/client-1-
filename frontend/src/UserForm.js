// import React, { useState } from 'react';
// import axios from 'axios';
// import confetti from 'canvas-confetti';
// import { motion } from 'framer-motion';

// function UserForm() {
//   const [form, setForm] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     datetime: '',
//   });

//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const launchConfetti = () => {
//     confetti({
//       particleCount: 100,
//       spread: 70,
//       origin: { y: 0.6 },
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!form.name.trim() || !form.datetime.trim()) {
//       setMessage('Name and Date/Time are required.');
//       return;
//     }

//     if (!/^\d{10}$/.test(form.phone)) {
//       setMessage('Please enter a valid 10-digit phone number.');
//       return;
//     }

//     const selectedDate = new Date(form.datetime);
//     const day = selectedDate.getDay(); // Sunday = 0

//     if (day === 0) {
//       setMessage('Bookings are not available on Sundays. Please select another day.');
//       return;
//     }

//     const hours = selectedDate.getHours();
//     if (hours < 9 || hours >= 17) {
//       setMessage('Please select a time between 9:00 AM and 5:00 PM.');
//       return;
//     }

//     setLoading(true);
//     setMessage('');

//     try {
//       const res = await axios.post('https://app-1-k69l.onrender.com', form);
//       setMessage(res.data.message);
//       launchConfetti();
//     } catch (err) {
//       setMessage(err.response?.data?.message || 'Something went wrong.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6 }}
//       style={containerStyle}
//     >
//       <form onSubmit={handleSubmit} style={formStyle}>
//         {['name', 'email', 'phone', 'datetime'].map((field, index) => (
//           <motion.input
//             key={field}
//             type={
//               field === 'email'
//                 ? 'email'
//                 : field === 'phone'
//                 ? 'tel'
//                 : field === 'datetime'
//                 ? 'datetime-local'
//                 : 'text'
//             }
//             name={field}
//             value={form[field]}
//             onChange={handleChange}
//             placeholder={
//               field === 'name'
//                 ? 'Your Name'
//                 : field === 'email'
//                 ? 'Your Email (optional)'
//                 : field === 'phone'
//                 ? 'Your Phone Number'
//                 : 'Date and Time'
//             }
//             required={field !== 'email'}
//             style={inputStyle}
//             whileFocus={{
//               scale: 1.02,
//               borderColor: '#007bff',
//               boxShadow: '0 0 8px rgba(0, 123, 255, 0.3)',
//             }}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ 
//               delay: index * 0.1, 
//               duration: 0.5,
//               type: 'spring', 
//               stiffness: 300, 
//               damping: 20 
//             }}
//           />
//         ))}

//         <motion.button
//           type="submit"
//           style={{
//             ...buttonStyle,
//             opacity: loading ? 0.7 : 1,
//             cursor: loading ? 'not-allowed' : 'pointer',
//           }}
//           disabled={loading}
//           whileTap={{ scale: 0.97 }}
//           whileHover={{ scale: loading ? 1 : 1.03 }}
//           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
//         >
//           {loading ? 'Booking...' : 'Book'}
//         </motion.button>

//         {message && (
//           <motion.p
//             style={{
//               ...messageStyle,
//               color:
//                 message.toLowerCase().includes('success') ||
//                 message.toLowerCase().includes('booked')
//                   ? 'green'
//                   : 'red',
//             }}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             {message}
//           </motion.p>
//         )}
//       </form>
//     </motion.div>
//   );
// }

// // Styles

// const containerStyle = {
//   width: '100%',
// };

// const formStyle = {
//   display: 'flex',
//   flexDirection: 'column',
//   gap: '15px',
// };

// const inputStyle = {
//   padding: '10px',
//   fontSize: '16px',
//   borderRadius: '6px',
//   border: '1px solid #ccc',
//   outline: 'none',
//   transition: 'all 0.3s ease',
// };

// const buttonStyle = {
//   padding: '12px',
//   fontSize: '16px',
//   borderRadius: '6px',
//   backgroundColor: '#007bff',
//   color: 'white',
//   border: 'none',
// };

// const messageStyle = {
//   marginTop: '10px',
//   textAlign: 'center',
// };

// export default UserForm;




import React, { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://client-1-1-kwwd.onrender.com'; // ✅ Local WebSocket URL

function UserForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    datetime: '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const SOCKET_URL = process.env.REACT_APP_API;

  const newSocket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // fallback added
});


  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('bookingConfirmed', (data) => {
      console.log('Booking Confirmed:', data);
      setMessage(`Booking Confirmed for ${data.name}`);
      launchConfetti();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const launchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.datetime.trim()) {
      setMessage('Name and Date/Time are required.');
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    const selectedDate = new Date(form.datetime);
    const day = selectedDate.getDay();

    if (day === 0) {
      setMessage('Bookings are not available on Sundays. Please select another day.');
      return;
    }

    const hours = selectedDate.getHours();
    if (hours < 9 || hours >= 17) {
      setMessage('Please select a time between 9:00 AM and 5:00 PM.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post('https://client-1-1-kwwd.onrender.com', form); // ✅ Local API
      setMessage(res.data.message);
      socket?.emit('newBooking', form);
      launchConfetti();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={containerStyle}
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {['name', 'email', 'phone', 'datetime'].map((field, index) => (
          <motion.input
            key={field}
            type={
              field === 'email'
                ? 'email'
                : field === 'phone'
                ? 'tel'
                : field === 'datetime'
                ? 'datetime-local'
                : 'text'
            }
            name={field}
            value={form[field]}
            onChange={handleChange}
            placeholder={
              field === 'name'
                ? 'Your Name'
                : field === 'email'
                ? 'Your Email (optional)'
                : field === 'phone'
                ? 'Your Phone Number'
                : 'Date and Time'
            }
            required={field !== 'email'}
            style={inputStyle}
            whileFocus={{
              scale: 1.02,
              borderColor: '#007bff',
              boxShadow: '0 0 8px rgba(0, 123, 255, 0.3)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.5,
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          />
        ))}

        <motion.button
          type="submit"
          style={{
            ...buttonStyle,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: loading ? 1 : 1.03 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {loading ? 'Booking...' : 'Book'}
        </motion.button>

        {message && (
          <motion.p
            style={{
              ...messageStyle,
              color:
                message.toLowerCase().includes('success') ||
                message.toLowerCase().includes('booked') ||
                message.toLowerCase().includes('confirmed')
                  ? 'green'
                  : 'red',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {message}
          </motion.p>
        )}
      </form>
    </motion.div>
  );
}

// Styles

const containerStyle = { width: '100%' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = {
  padding: '10px',
  fontSize: '16px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  outline: 'none',
  transition: 'all 0.3s ease',
};
const buttonStyle = {
  padding: '12px',
  fontSize: '16px',
  borderRadius: '6px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
};
const messageStyle = {
  marginTop: '10px',
  textAlign: 'center',
};

export default UserForm;
