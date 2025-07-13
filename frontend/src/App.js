// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserForm from './UserForm';
import AdminCalendar from './AdminCalendar';
import { motion } from 'framer-motion';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background decoration */}
              <div
                style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-50%',
                  width: '100%',
                  height: '100%',
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  transform: 'rotate(15deg)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-50%',
                  left: '-50%',
                  width: '100%',
                  height: '100%',
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                  transform: 'rotate(-15deg)',
                }}
              />

              {/* Heading ABOVE the card */}
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#ffffff',
                  textAlign: 'center',
                  marginBottom: '30px',
                  letterSpacing: '0.5px',
                  zIndex: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                Madukkakuzhy Dental Care
              </motion.h1>

              {/* Glass Card */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '50px 40px',
                  maxWidth: '500px',
                  width: '100%',
                  boxShadow:
                    '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      background:
                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    }}
                  >
                    <span style={{ fontSize: '24px', color: 'white' }}>📅</span>
                  </div>
                  <h1
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#1a202c',
                      margin: '0 0 8px',
                      letterSpacing: '-0.025em',
                    }}
                  >
                    Book Your Appointment
                  </h1>
                  <p
                    style={{
                      fontSize: '16px',
                      color: '#64748b',
                      margin: '0',
                      lineHeight: '1.5',
                    }}
                  >
                    Schedule your session with ease
                  </p>
                </div>
                <UserForm />
              </div>
            </div>
          }
        />
        <Route path="/admin227" element={<AdminCalendar />} />
      </Routes>
    </Router>
  );
}

export default App;
