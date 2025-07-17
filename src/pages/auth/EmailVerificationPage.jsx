// src/pages/auth/EmailVerificationPage.jsx (or components/EmailVerification.jsx)
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Assuming you're using React Router
import { verifyEmail } from '../../services/authService'; // Your frontend auth service
import { CircularProgress, Alert, AlertTitle, Box, Typography, Button } from '@mui/material'; // Or your preferred UI library

const EmailVerificationPage = () => {
  const { token } = useParams(); // Get the token from the URL
  const navigate = useNavigate(); // For redirection after verification

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token found in the URL.');
        return;
      }

      try {
        // Call your frontend auth service to hit the backend /api/auth/verify-email/:token
        // Your backend already redirects, so this `verifyEmail` in frontend service
        // will ideally just resolve if the redirect was successful (status 200/3xx).
        // If the backend throws an error before redirect, this catch block will handle it.
        await verifyEmail(token); // This service function makes the actual API call
        setStatus('success');
        setMessage('Your email has been successfully verified!');
        // Backend's redirect to /email-verified-success should handle the final display,
        // but it's good to have a fallback here or for initial processing.
        // Navigate to a success page or login after a short delay
        setTimeout(() => {
          navigate('/email-verified-success'); // Navigate to a success page
        }, 3000); // Redirect after 3 seconds
      } catch (error) {
        setStatus('error');
        setMessage(error || 'Failed to verify email. The link might be invalid or expired.');
        console.error('Email verification error:', error);
      }
    };

    handleVerification();
  }, [token, navigate]); // Re-run if token or navigate changes

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: 2,
        textAlign: 'center'
      }}
    >
      {status === 'verifying' && (
        <>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h5">Verifying your email...</Typography>
        </>
      )}
      {status === 'success' && (
        <Alert severity="success" sx={{ maxWidth: 500 }}>
          <AlertTitle>Success! 🎉</AlertTitle>
          {message}
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Alert>
      )}
      {status === 'error' && (
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <AlertTitle>Verification Failed! 😟</AlertTitle>
          {message}
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/login')}>
            Back to Login
          </Button>
          <Button variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/resend-verification')}>
            Resend Verification Email
          </Button>
        </Alert>
      )}
    </Box>
  );
};

export default EmailVerificationPage;