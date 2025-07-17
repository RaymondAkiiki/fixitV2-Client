import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/authService.js';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import useForm from '../../hooks/useForm.js';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { ROUTES, USER_ROLES } from '../../utils/constants.js';

// Roles for the dropdown
const roles = [
  { value: USER_ROLES.TENANT, label: 'Tenant' },
  { value: USER_ROLES.LANDLORD, label: 'Landlord' },
  { value: USER_ROLES.PROPERTY_MANAGER, label: 'Property Manager' },
];

/**
 * Client-side validation for the registration form.
 * Now expects { firstName, lastName, email, phone, role, password }
 */
const validateRegisterForm = (values) => {
  const errors = {};
  if (!values.firstName?.trim()) {
    errors.firstName = 'First Name is required.';
  }
  if (!values.lastName?.trim()) {
    errors.lastName = 'Last Name is required.';
  }
  if (!values.email?.trim()) {
    errors.email = 'Email Address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Invalid email format.';
  }
  if (!values.phone?.trim()) {
    errors.phone = 'Phone Number is required.';
  } else if (!/^\d{7,15}$/.test(values.phone.trim())) {
    errors.phone = 'Please enter a valid phone number (7-15 digits).';
  }
  if (!values.role) {
    errors.role = 'Role is required.';
  }
  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  }
  return errors;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();
  const [showPassword, setShowPassword] = useState(false);

  // Form state: updated for firstName/lastName
  const {
    values,
    errors,
    setErrors,
    handleChange,
    handleSubmit,
    isSubmitting,
  } = useForm(
    {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: USER_ROLES.TENANT,
      password: ''
    },
    validateRegisterForm,
    async (formValues) => {
      try {
        // Prepare payload for backend
        const payload = {
          ...formValues,
          role: formValues.role.toLowerCase(),
          firstName: formValues.firstName.trim(),
          lastName: formValues.lastName.trim(),
        };
        await registerUser(payload);
        showSuccess('Registration successful! Your account is pending approval. You will be notified once it\'s active.');
        setTimeout(() => navigate(ROUTES.LOGIN), 3000);
      } catch (err) {
        // --- IMPROVED ERROR HANDLING ---
        // Try to extract backend validation errors for field-level display
        let serverErrors = {};
        // If backend returns array of field errors (as in your backend log)
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach(e => {
            // e.field, e.message
            serverErrors[e.field] = e.message;
          });
        }
        // If backend returns error for unique email, etc.
        if (err.field && err.message) {
          serverErrors[err.field] = err.message;
        }
        // If backend returns as 'error' or 'message' string
        if (typeof err === 'string') {
          showError(err);
        } else if (err.message) {
          showError(err.message);
        } else {
          showError('Registration failed. Please try again.');
        }
        if (Object.keys(serverErrors).length) {
          setErrors(serverErrors); // <-- Set field-level errors for the form
        }
        // Always log the error for debugging
        console.error("Registration error in RegisterPage:", err);
      }
    }
  );

  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-xl border border-gray-100 text-center">
      <UserPlus className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create Your Account</h2>
      <p className="text-gray-600 mb-6">Join FixIt and start managing your properties or tenancies.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-3">
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
          placeholder="e.g., 0712345678"
          required
          error={errors.phone}
          disabled={isSubmitting}
          autoComplete="tel"
        />

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Register as: <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={values.role}
            onChange={handleChange}
            required
            className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200
              ${errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
              ${isSubmitting ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
            `}
            disabled={isSubmitting}
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
        </div>

        <div className="relative">
          <Input
            label="Password"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            required
            error={errors.password}
            disabled={isSubmitting}
            minLength={8}
            className="pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </Button>
      </form>

      <p className="text-sm text-center text-gray-600 mt-6">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-[#ffbd59] hover:underline font-medium">
          Login
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;