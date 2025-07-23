// src/pages/auth/ResendVerificationPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendVerificationEmail } from '../../services/authService';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { Mail, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../utils/constants.js';
import useForm from '../../hooks/useForm.js';

const validateForm = (values) => {
  const errors = {};
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  return errors;
};

const ResendVerificationPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting
  } = useForm(
    { email: '' },
    validateForm,
    async (formValues) => {
      try {
        // If user is logged in, no need for email. If not, use the provided email
        const response = await sendVerificationEmail(formValues.email || undefined);
        showSuccess(response.message || 'Verification email sent. Please check your inbox and spam folder.');
        
        // Reset form (though we'll likely navigate away)
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 3000);
      } catch (err) {
        showError(err || 'Failed to send verification email. Please try again.');
      }
    }
  );

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full text-center mx-auto">
      <Mail className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Resend Verification Email</h2>
      <p className="text-gray-600 mb-6">
        If you haven't received your verification email or the link has expired, you can request a new one.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address (if not logged in)"
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          placeholder="your.email@example.com"
          error={errors.email}
          disabled={isSubmitting}
          required={false}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Resend Verification Email"}
        </Button>
      </form>

      <div className="mt-6">
        <Link to={ROUTES.LOGIN} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 hover:underline font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResendVerificationPage;