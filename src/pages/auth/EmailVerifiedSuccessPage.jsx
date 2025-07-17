// src/pages/auth/EmailVerifiedSuccessPage.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const EmailVerifiedSuccessPage = () => {
  const navigate = useNavigate();

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
      <Typography variant="h4" gutterBottom>
        Email Verified Successfully! ✅
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Your email address has been successfully verified. You can now log in to your account.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/login')}>
        Go to Login
      </Button>
    </Box>
  );
};

export default EmailVerifiedSuccessPage;