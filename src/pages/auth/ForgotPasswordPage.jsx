import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/authService.js';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import useForm from '../../hooks/useForm.js';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { Mail, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../utils/constants.js';

// Validation for forgot password form
const validateForgotPasswordForm = (values) => {
  const errors = {};
  if (!values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  return errors;
};

const ForgotPasswordPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  const navigate = useNavigate();

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
  } = useForm(
    { email: '' },
    validateForgotPasswordForm,
    async (formValues) => {
      try {
        const response = await forgotPassword(formValues.email);
        showSuccess(response.message || 'Password reset link sent to your email address. Please check your inbox (and spam folder)!');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 3000);
      } catch (err) {
        console.error("Forgot password error in ForgotPasswordPage:", err);
        showError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
      }
    }
  );

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full text-center mx-auto">
      <Mail className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password?</h2>
      <p className="text-gray-600 mb-6">Enter your email address to receive a password reset link.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          placeholder="your.email@example.com"
          required
          error={errors.email}
          disabled={isSubmitting}
          autoComplete="email"
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
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

export default ForgotPasswordPage;