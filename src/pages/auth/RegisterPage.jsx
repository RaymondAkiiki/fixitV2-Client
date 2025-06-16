// frontend/src/pages/auth/RegisterPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'; // Icons

const roles = [
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'propertymanager', label: 'Property Manager' }, // Renamed from property_manager for consistency
];

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'tenant',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear specific error on change
    if (message) setMessage(''); // Clear general message on any input change
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full Name is required.';
    if (!formData.email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Invalid email format.';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone Number is required.';
    } else if (!/^\d{7,15}$/.test(formData.phone.trim())) { // Basic phone number regex
      errors.phone = 'Please enter a valid phone number (min 7 digits).';
    }
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) { // Increased min length for security
      errors.password = 'Password must be at least 8 characters long.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessageType('info');
    setMessage('');
    if (!validateForm()) {
        setMessage('Please correct the errors in the form.');
        setMessageType('error');
        return;
    }

    setLoading(true);
    try {
      await registerUser(formData);
      setMessageType('success');
      setMessage('Registration successful! Your account is pending approval. You will be notified once it\'s active.');
      // Optional: Redirect to login after a delay
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setMessageType('error');
      const apiMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setMessage(apiMsg);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
  
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-xl border border-gray-100 text-center">
      <UserPlus className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create Your Account</h2>
      <p className="text-gray-600 mb-6">Join FixIt and start managing your properties or tenancies.</p>

      {message && <Alert type={messageType} message={message} onClose={() => setMessage('')} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full Name"
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your Full Name"
          required
          error={formErrors.name}
          disabled={loading}
        />

        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your.email@example.com"
          required
          error={formErrors.email}
          disabled={loading}
        />

        <Input
          label="Phone Number"
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g., 0712345678"
          required
          error={formErrors.phone}
          disabled={loading}
        />

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Register as: <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200
              ${formErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
              ${loading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
            `}
            disabled={loading}
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {formErrors.role && <p className="mt-1 text-xs text-red-500">{formErrors.role}</p>}
        </div>


        <div className="relative">
          <Input
            label="Password"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            required
            error={formErrors.password}
            disabled={loading}
            minLength={8}
            className="pr-10" // Add padding for the toggle button
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
          loading={loading}
          disabled={loading}
        >
          Register
        </Button>
      </form>

      <p className="text-sm text-center text-gray-600 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[#ffbd59] hover:underline font-medium">
          Login
        </Link>
      </p>
    </div>
  
  );
};

export default RegisterPage;
