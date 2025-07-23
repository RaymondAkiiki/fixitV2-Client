// src/pages/auth/EmailVerificationPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../../services/authService';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import Button from '../../components/common/Button.jsx';
import { Mail, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../utils/constants.js';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();

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
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Your email has been successfully verified!');
        
        // Show success message through the global alert system
        showSuccess('Email verified successfully! Redirecting to login...');
        
        // Navigate to login after a short delay
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error || 'Failed to verify email. The link might be invalid or expired.');
        showError('Email verification failed: ' + error);
        console.error('Email verification error:', error);
      }
    };

    handleVerification();
  }, [token, navigate, showSuccess, showError]);

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full text-center mx-auto">
      {status === 'verifying' && (
        <>
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Verifying your email...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your email address.</p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <CheckCircle className="w-16 h-16 mx-auto text-green-700 mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button 
            variant="primary" 
            className="w-full mt-4"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Go to Login
          </Button>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertTriangle className="w-16 h-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Back to Login
            </Button>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => navigate(ROUTES.RESEND_VERIFICATION)}
            >
              Resend Verification Email
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmailVerificationPage;