// src/pages/auth/EmailVerifiedSuccessPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import { CheckCircle } from 'lucide-react';
import { ROUTES } from '../../utils/constants.js';

const EmailVerifiedSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full text-center mx-auto">
      <CheckCircle className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Email Verified Successfully!</h2>
      <p className="text-gray-600 mb-6">
        Your email address has been successfully verified. You can now log in to your account.
      </p>
      <Button 
        variant="primary" 
        className="w-full"
        onClick={() => navigate(ROUTES.LOGIN)}
      >
        Go to Login
      </Button>
    </div>
  );
};

export default EmailVerifiedSuccessPage;