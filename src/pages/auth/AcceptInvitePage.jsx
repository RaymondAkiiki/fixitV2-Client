// frontend/src/pages/auth/InviteAcceptancePage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { UserPlus, CheckCircle } from "lucide-react"; // Only need UserPlus and CheckCircle

// Import service for invite acceptance and user registration/login
import { verifyInviteToken, acceptInvite } from "../../services/inviteService.js";
import { useAuth } from "../../context/AuthContext"; // To handle login after acceptance

/**
 * InviteAcceptancePage allows users to accept an invitation to join the platform.
 * It handles token verification, new user registration, or prompts existing users to log in.
 */
function InviteAcceptancePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth(); // Destructure login method from AuthContext

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [inviteDetails, setInviteDetails] = useState(null); // Stores data from token verification
  const [isExistingUser, setIsExistingUser] = useState(false); // If true, prompt for login

  // Form data for new user registration/password setting
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    email: "" // Email will be pre-filled from inviteDetails
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
        setFormData(prev => ({ ...prev, email: response.invite.email })); // Pre-fill email
      } catch (err) {
        setError("Invalid or expired invitation link. Please request a new one or contact support.");
        console.error("Invite token verification error:", err);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [inviteToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full Name is required.";
    if (!formData.password) errors.password = "Password is required.";
    if (formData.password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewUserAcceptance = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        setError("Please correct the errors in the form.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
      // Backend's `acceptInvite` should handle user creation/password setting
      await acceptInvite(inviteToken, {
        name: formData.name,
        password: formData.password,
      });

      // After successful acceptance, attempt to log in the newly registered/activated user
      await authLogin(formData.email, formData.password);

      setSuccess(`Invitation accepted successfully! You are now logged in as a ${inviteDetails.role}.`);
      setLoading(false);

      // Redirect based on role
      const redirectPath = inviteDetails.role === 'tenant' ? '/tenant' :
                           inviteDetails.role === 'propertymanager' || inviteDetails.role === 'landlord' ? '/pm' :
                           '/'; // Default or a generic dashboard
      navigate(redirectPath, { replace: true });

    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || "Failed to accept invitation. Please try again.";
      setError(msg);
      console.error("Invite acceptance error:", err);
    }
  };

  if (loading) {
    return (
    
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg shadow-xl border border-gray-100 min-h-[300px]">
        <Spinner size="lg" color="#219377" className="mb-4" />
        <p className="text-xl text-gray-700 font-semibold">Verifying invitation link...</p>
      </div>
    
    );
  }

  if (error && !inviteDetails) { // Show full error if initial verification fails
    return (
    
      <div className="p-8 bg-white rounded-lg shadow-xl border border-gray-100">
        <Alert type="error" message={error} onClose={() => setError(null)} />
        <div className="mt-6 text-center">
          <Link to="/register" className="text-blue-600 hover:underline font-medium">Register a new account</Link>
          <span className="mx-2 text-gray-500">|</span>
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Already have an account?</Link>
        </div>
      </div>
    
    );
  }

  if (success) {
    return (
    
      <div className="p-8 bg-white rounded-lg shadow-xl border border-gray-100 text-center">
        <Alert type="success" message={success} />
        <div className="mt-6">
          <Link to={inviteDetails.role === 'tenant' ? '/tenant' : '/pm'} className="w-full">
            <Button variant="primary" size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    
    );
  }

  return (   
    <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full">
      <div className="text-center mb-6">
        <UserPlus className="w-16 h-16 mx-auto text-green-700 mb-4" />
        <h2 className="text-3xl font-extrabold text-gray-900">Accept Invitation</h2>
        <p className="mt-2 text-gray-700">
          You've been invited as a <span className="font-semibold capitalize text-[#219377]">{inviteDetails?.role.replace(/_/g, ' ')}</span>
          {inviteDetails?.property?.name && ` for property "${inviteDetails.property.name}"`}
          {inviteDetails?.unit?.unitName && ` (Unit: ${inviteDetails.unit.unitName})`}!
        </p>
        <p className="text-gray-600 italic">Email: {inviteDetails?.email}</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />}

      {isExistingUser ? (
        <div className="text-center">
          <p className="text-lg text-gray-800 mb-4">
            It looks like you already have an account with this email address. Please log in to accept this invitation.
          </p>
          <Link to="/login" className="w-full">
            <Button variant="secondary" size="lg">Log In</Button>
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
            disabled={true} // Email is fixed by the invite
          />
          <Input
            label="New Password"
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
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
            placeholder="Re-enter new password"
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
  
  );
}

export default InviteAcceptancePage;
