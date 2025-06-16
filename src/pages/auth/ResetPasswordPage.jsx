import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/authService';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(token, password);
      setError(false);
      setMessage('✅ Password reset successfully. Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(true);
      setMessage('❌ Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-200 space-y-6 animate-fadeIn"
      >
        <h2 className="text-2xl font-bold text-center text-[#219377]">Reset Your Password</h2>
        <p className="text-sm text-center text-gray-500">Secure your FixIt account with a new password</p>

        {message && (
          <div
            className={`text-sm text-center font-medium px-4 py-2 rounded ${
              error ? 'bg-red-100 text-red-600' : 'bg-[#e6f8f2] text-[#219377]'
            }`}
          >
            {message}
          </div>
        )}

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377] transition"
        />

        <button
          type="submit"
          className="w-full py-2 px-4 rounded-md text-white font-medium bg-[#219377] hover:bg-[#1b7f66] transition"
        >
          Reset Password
        </button>

        <div className="text-sm text-center text-gray-600">
          <button
            onClick={() => navigate('/login')}
            type="button"
            className="text-[#ffbd59] hover:underline font-medium"
          >
            Back to Login
          </button>
        </div>
      </form>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default ResetPasswordPage;
