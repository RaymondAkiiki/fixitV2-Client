import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import useForm from '../../hooks/useForm';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import GoogleAuthButton from '../../components/GoogleAuthButton.jsx';
import { Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '../../utils/constants';

// Validation function for login form
const validateLoginForm = (values) => {
  const errors = {};
  if (!values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!values.password.trim()) {
    errors.password = 'Password is required.';
  }
  return errors;
};

const LoginPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth(); // Add login method from auth context
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to appropriate page
  if (isAuthenticated) {
    navigate(ROUTES.DASHBOARD);
    return null;
  }

  const redirectPath = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
  } = useForm(
    { email: '', password: '' },
    validateLoginForm,
    async (formValues) => {
      try {
        const response = await loginUser(formValues.email, formValues.password);

        // Update auth context
        if (response.user) {
          login(response.user, response.accessToken);
        }

        showSuccess(response.message || 'Login successful!');

        // Redirect user based on role
        navigateBasedOnRole(response.user);
      } catch (err) {
        console.error('Login error:', err);
        showError(err.message || 'Failed to login. Please check your credentials.');
      }
    }
  );

  // Helper function to navigate based on user role
  const navigateBasedOnRole = (user) => {
    if (user?.role) {
      const role = user.role.toLowerCase();
      if (role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else if (role === 'tenant') {
        navigate(ROUTES.TENANT_DASHBOARD);
      } else if (role === 'property_manager' || role === 'propertymanager') {
        navigate(ROUTES.PM_DASHBOARD);
      } else if (role === 'landlord') {
        navigate(ROUTES.LANDLORD_DASHBOARD);
      } else {
        navigate(redirectPath);
      }
    } else {
      navigate(redirectPath);
    }
  };

  // Handle successful Google authentication
  const handleGoogleSuccess = (response) => {
    try {
      // Update auth context with Google login response
      if (response.user) {
        login(response.user, response.accessToken);
      }

      // Navigate based on role
      navigateBasedOnRole(response.user);
    } catch (error) {
      console.error('Error handling Google success:', error);
      showError('An error occurred during Google sign-in. Please try again.');
    }
  };

  // Handle Google authentication errors
  const handleGoogleError = (error) => {
    console.error('Google authentication error:', error);
    // Error is already handled by GoogleAuthButton, so we don't need to show it again
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
        Welcome Back
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Sign in to your account to continue
      </p>

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

        <div className="relative">
          <Input
            label="Password"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={handleChange}
            placeholder="Your password"
            required
            error={errors.password}
            disabled={isSubmitting}
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-green-600 hover:text-green-500">
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <GoogleAuthButton
            text="Sign in with Google"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            usePopup={false} // Set to true if you prefer popup mode
          />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-green-600 hover:text-green-500">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;