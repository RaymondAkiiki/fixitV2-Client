import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/authService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { Mail, ArrowLeft, Lock } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMessageType('success');
      setMessage('Password reset link sent to your email address. Please check your inbox (and spam folder)!');
    } catch (err) {
      setMessageType('error');
      const apiMsg = err.response?.data?.message || 'Failed to send reset link. Please try again.';
      setMessage(apiMsg);
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full text-center mx-auto">
      <Mail className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password?</h2>
      <p className="text-gray-600 mb-6">Enter your email address to receive a password reset link.</p>

      {message && (
        <Alert
          type={messageType}
          message={message}
          onClose={() => setMessage('')}
          className="mb-6"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
          disabled={loading}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={loading}
          disabled={loading}
        >
          Send Reset Link
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-2 items-center">
        <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 hover:underline font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
        </Link>
        {/* Optional: For dev/testing, add a link to set password directly */}
        <Link to="/reset-password/test-token" className="inline-flex items-center text-xs text-gray-400 hover:text-gray-800 hover:underline font-medium transition-colors">
          <Lock className="w-4 h-4 mr-2" /> Test "Set Password" Page
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;