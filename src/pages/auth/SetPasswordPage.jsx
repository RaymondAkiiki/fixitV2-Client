// frontend/src/pages/auth/SetPasswordPage.jsx

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../services/authService.js'; // Ensure .js extension
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx'; // Import useGlobalAlert
import useForm from '../../hooks/useForm.js'; // Import useForm hook
import Input from '../../components/common/Input.jsx'; // Ensure .jsx extension
import Button from '../../components/common/Button.jsx'; // Ensure .jsx extension
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'; // Icons
import { ROUTES } from '../../utils/constants.js'; // Import ROUTES

/**
 * Client-side validation function for the set password form.
 * @param {object} values - The current form values { password, confirmPassword }.
 * @returns {object} An object containing validation errors, if any.
 */
const validateSetPasswordForm = (values) => {
  const errors = {};

  if (!values.password.trim()) {
    errors.password = 'New password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  }

  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = 'Please confirm your new password.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

const SetPasswordPage = () => {
  const { token } = useParams(); // Get reset token from URL
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert(); // Destructure from useGlobalAlert

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize useForm hook
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
  } = useForm(
    { password: '', confirmPassword: '' },
    validateSetPasswordForm,
    async (formValues) => { // This is the onSubmitCallback for useForm
      if (!token) {
        showError('Password reset token is missing or invalid. Please use the link from your email.');
        return; // Prevent API call if token is missing
      }

      try {
        await resetPassword(token, formValues.password);
        showSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 2000);
      } catch (err) {
        console.error("Reset password error in SetPasswordPage:", err);
        showError(err.response?.data?.message || 'Failed to reset password. The link may be expired or invalid.');
      }
    }
  );

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-gray-100 text-center mx-auto">
      <Lock className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Set Your New Password</h2>
      <p className="text-gray-600 mb-6">Enter and confirm your new strong password for FixIt.</p>

      {/* Message display is now handled by GlobalAlertContext, so no local Alert component needed here */}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Input
            label="New Password"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            required
            error={errors.password} // Pass specific error for password input
            disabled={isSubmitting}
            minLength={8}
            className="pr-10" // Add padding for the toggle button
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
            aria-label={showPassword ? "Hide new password" : "Show new password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirm New Password"
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={values.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter new password"
            required
            error={errors.confirmPassword} // Pass specific error for confirm password input
            disabled={isSubmitting}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
            aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          <CheckCircle className="w-5 h-5 mr-2" /> {isSubmitting ? "Resetting..." : "Reset Password"}
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

export default SetPasswordPage;
