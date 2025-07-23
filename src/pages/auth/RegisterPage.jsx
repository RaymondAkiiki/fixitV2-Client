import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import useForm from '../../hooks/useForm';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import GoogleAuthButton from '../../components/GoogleAuthButton.jsx';
import { Eye, EyeOff } from 'lucide-react';
import { ROUTES } from '../../utils/constants';

// Validation function for registration form
const validateRegisterForm = (values) => {
  const errors = {};
  
  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }
  
  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  }
  
  if (!values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  
  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.';
  }
  
  if (!values.password.trim()) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(values.password)) {
    errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
  }
  
  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  
  return errors;
};

const RegisterPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  const navigate = useNavigate();
  const { login } = useAuth(); // Add login method from auth context
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
  } = useForm(
    { 
      firstName: '', 
      lastName: '', 
      email: '', 
      phone: '', 
      password: '', 
      confirmPassword: '' 
    },
    validateRegisterForm,
    async (formValues) => {
      try {
        // Remove confirmPassword from payload
        const { confirmPassword, ...userData } = formValues;
        
        const response = await registerUser(userData);
        
        showSuccess(response.message || 'Registration successful! Please check your email to verify your account.');
        
        // Navigate to login page after successful registration
        navigate(ROUTES.LOGIN);
      } catch (err) {
        console.error('Registration error:', err);
        showError(err.message || 'Failed to register. Please try again.');
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
        navigate(ROUTES.DASHBOARD);
      }
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  // Handle successful Google authentication
  const handleGoogleSuccess = (response) => {
    try {
      // Google login/register automatically logs the user in
      // Update auth context
      if (response.user) {
        login(response.user, response.accessToken);
      }

      // Redirect user based on role
      navigateBasedOnRole(response.user);
    } catch (error) {
      console.error('Error handling Google success:', error);
      showError('An error occurred during Google sign-up. Please try again.');
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
        Create Your Account
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Sign up to get started with Fix It by Threalty
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            id="firstName"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={handleChange}
            placeholder="First Name"
            required
            error={errors.firstName}
            disabled={isSubmitting}
            autoComplete="given-name"
          />

          <Input
            label="Last Name"
            id="lastName"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
            error={errors.lastName}
            disabled={isSubmitting}
            autoComplete="family-name"
          />
        </div>

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

        <Input
          label="Phone Number"
          id="phone"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          placeholder="Your phone number"
          required
          error={errors.phone}
          disabled={isSubmitting}
          autoComplete="tel"
        />

        <div className="relative">
          <Input
            label="Password"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            error={errors.password}
            disabled={isSubmitting}
            autoComplete="new-password"
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

        <div className="relative">
          <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={values.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            error={errors.confirmPassword}
            disabled={isSubmitting}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p>By creating an account, you agree to our{' '}
            <Link to={ROUTES.TERMS} className="font-medium text-green-600 hover:text-green-500">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to={ROUTES.PRIVACY} className="font-medium text-green-600 hover:text-green-500">
              Privacy Policy
            </Link>
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
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
            text="Sign up with Google" 
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            usePopup={false} // Set to true if you prefer popup mode
          />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-green-600 hover:text-green-500">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;