import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const SetPasswordPage = () => {
  const { token } = useParams(); // Get reset token from URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Only show error if the user tries to submit without a token
  const validatePasswords = () => {
    let isValid = true;
    setPasswordError('');
    setConfirmPasswordError('');

    if (!password.trim()) {
      setPasswordError('New password is required.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your new password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('info');
    if (!token) {
      setMessageType('error');
      setMessage('Password reset token is missing or invalid. Please use the link from your email.');
      return;
    }
    if (!validatePasswords()) {
      setMessage('Please correct the password errors.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setMessageType('success');
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setMessageType('error');
      const apiMsg = err.response?.data?.message || 'Failed to reset password. The link may be expired or invalid.';
      setMessage(apiMsg);
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-gray-100 text-center mx-auto">
      <Lock className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Set Your New Password</h2>
      <p className="text-gray-600 mb-6">Enter and confirm your new strong password for FixIt.</p>

      {message && (
        <Alert
          type={messageType}
          message={message}
          onClose={() => setMessage('')}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Input
            label="New Password"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
            placeholder="Minimum 8 characters"
            required
            error={passwordError}
            disabled={loading}
            minLength={8}
            className="pr-10"
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
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }}
            placeholder="Re-enter new password"
            required
            error={confirmPasswordError}
            disabled={loading}
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
          loading={loading}
          disabled={loading}
        >
          <CheckCircle className="w-5 h-5 mr-2" /> Reset Password
        </Button>
      </form>

      <div className="mt-6">
        <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 hover:underline font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
        </Link>
      </div>
    </div>
  );
};

export default SetPasswordPage;