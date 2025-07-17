// frontend/src/pages/auth/InviteAcceptancePage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { UserPlus, Lock, Mail, CheckCircle } from "lucide-react";
import { verifyInviteToken, acceptInvite } from "../../services/publicService.js";
import { registerUser, loginUser } from '../../services/authService';
import { useAuth } from "../../contexts/AuthContext";

function InviteAcceptancePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    email: ""
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await verifyInviteToken(inviteToken);
        setInviteDetails(response.invite);
        setIsExistingUser(response.isExistingUser);
        setFormData(prev => ({ ...prev, email: response.invite.email }));
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError("Invalid or expired invitation link. Please request a new one or contact support.");
        console.error("Invite token verification error:", err);
      }
    };
    verifyToken();
  }, [inviteToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required.";
    if (!formData.password) errors.password = "Password is required.";
    if (formData.password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewUserAcceptance = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      await acceptInvite(inviteToken, {
        name: formData.name,
        password: formData.password,
      });

      await authLogin(formData.email, formData.password);

      setSuccess(`Invitation accepted successfully! You are now logged in as a ${inviteDetails.role}.`);
      setLoading(false);

      if (inviteDetails.role === 'tenant') {
        navigate('/tenant/dashboard', { replace: true });
      } else if (inviteDetails.role === 'propertymanager') {
        navigate('/pm/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || "Failed to accept invitation. Please try again.";
      setError(msg);
      console.error("Invite acceptance error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg shadow-xl border border-gray-100">
            <Spinner size="lg" color="#219377" className="mb-4" />
            <p className="text-xl text-gray-700 font-semibold">Verifying invitation link...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-white rounded-lg shadow-xl border border-gray-100">
            <Alert type="error" message={error} onClose={() => setError(null)} />
            <div className="mt-6 text-center">
              <Link to="/register" className="text-blue-600 hover:underline font-medium">Register a new account</Link>
              <span className="mx-2 text-gray-500">|</span>
              <Link to="/login" className="text-blue-600 hover:underline font-medium">Already have an account?</Link>
            </div>
          </div>
        ) : success ? (
          <div className="p-8 bg-white rounded-lg shadow-xl border border-gray-100 text-center">
            <Alert type="success" message={success} />
            <div className="mt-6">
              <Link to={inviteDetails.role === 'tenant' ? '/tenant/dashboard' : '/pm/dashboard'} className="bg-[#219377] text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-800 transition-colors duration-200">
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <UserPlus className="w-16 h-16 mx-auto text-green-700 mb-4" />
              <h2 className="text-3xl font-extrabold text-gray-900">Accept Invitation</h2>
              <p className="mt-2 text-gray-700">
                You've been invited as a <span className="font-semibold capitalize text-[#219377]">{inviteDetails.role}</span>
                {inviteDetails.property?.name && ` for property "${inviteDetails.property.name}"`}
                {inviteDetails.unit?.unitName && ` (Unit: ${inviteDetails.unit.unitName})`}!
              </p>
              <p className="text-gray-600 italic">Email: {inviteDetails.email}</p>
            </div>

            {isExistingUser ? (
              <div className="text-center">
                <p className="text-lg text-gray-800 mb-4">
                  It looks like you already have an account. Please log in to accept this invitation.
                </p>
                <Link to="/login" className="bg-[#ffbd59] text-gray-900 px-6 py-3 rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-200">
                  Log In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleNewUserAcceptance} className="space-y-6">
                <p className="text-gray-700">Please set up your profile to activate your account.</p>
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
                  disabled={true}
                  className="opacity-70"
                />
                <Input
                  label="New Password"
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  required
                  error={formErrors.password}
                  disabled={loading}
                />
                <Input
                  label="Confirm Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                  error={formErrors.confirmPassword}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3"
                  loading={loading}
                  disabled={loading}
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Accept Invitation & Register
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteAcceptancePage;
