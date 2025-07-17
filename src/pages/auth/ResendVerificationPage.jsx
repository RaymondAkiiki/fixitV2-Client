// src/pages/ResendVerificationPage.jsx (Example)
import React, { useState } from 'react';
import { sendVerificationEmail } from '../../services/authService'; // Your frontend auth service
import { Button, TextField, Typography, Box, Alert } from '@mui/material';

const ResendVerificationPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await sendVerificationEmail(); // This assumes your backend knows the user from the JWT
      setMessage(response.message || 'Verification email sent. Please check your inbox.');
    } catch (err) {
      setError(err || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Resend Email Verification
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 2 }}>
        If you haven't received your verification email or the link has expired, you can request a new one.
      </Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button
        variant="contained"
        onClick={handleResend}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Resend Verification Email'}
      </Button>
    </Box>
  );
};

export default ResendVerificationPage;

// Add this route to your App.js router:
// <Route path="/resend-verification" element={<ResendVerificationPage />} />