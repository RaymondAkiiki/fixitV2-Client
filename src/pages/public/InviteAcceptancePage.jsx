// frontend/src/pages/public/InviteAcceptancePage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { verifyInviteToken, acceptInvite } from "../../services/publicService.js"; // Ensure .js extension
import { useAuth } from "../../contexts/AuthContext.jsx"; // Ensure .jsx extension
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx"; // Import useGlobalAlert
import useForm from "../../hooks/useForm.js"; // Import useForm hook
import Button from "../../components/common/Button.jsx"; // Ensure .jsx extension
import Input from "../../components/common/Input.jsx"; // Ensure .jsx extension
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx"; // Using LoadingSpinner instead of generic Spinner
import { UserPlus, Lock, Mail, CheckCircle, Eye, EyeOff } from "lucide-react"; // Icons
import { ROUTES, USER_ROLES } from "../../utils/constants.js"; // Import ROUTES and USER_ROLES

/**
 * Client-side validation function for the new user invitation acceptance form.
 * @param {object} values - The current form values { name, password, confirmPassword }.
 * @returns {object} An object containing validation errors, if any.
 */
const validateInviteAcceptanceForm = (values) => {
  const errors = {};
  if (!values.name.trim()) {
    errors.name = "Full Name is required.";
  }
  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
};

function InviteAcceptancePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useGlobalAlert(); // Destructure from useGlobalAlert

  const [initialLoading, setInitialLoading] = useState(true); // For initial token verification
  const [initialError, setInitialError] = useState(null); // For errors during initial verification
  const [inviteDetails, setInviteDetails] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize useForm hook for the new user registration part
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting, // Renamed from 'loading' to avoid conflict with initialLoading
  } = useForm(
    { name: "", password: "", confirmPassword: "", email: "" }, // Email will be pre-filled
    validateInviteAcceptanceForm,
    async (formValues) => { // This is the onSubmitCallback for useForm
      try {
        // Call the public service to accept the invite
        await acceptInvite(inviteToken, {
          name: formValues.name,
          password: formValues.password,
        });

        // After successful invite acceptance, automatically log the user in
        const user = await authLogin(formValues.email, formValues.password);

        showSuccess(`Invitation accepted successfully! You are now logged in as a ${user.role}.`);

        // Redirect based on the authenticated user's role
        switch (user.role?.toLowerCase()) {
          case USER_ROLES.TENANT:
            navigate(ROUTES.TENANT_DASHBOARD, { replace: true });
            break;
          case USER_ROLES.PROPERTY_MANAGER:
            navigate(ROUTES.PM_DASHBOARD, { replace: true });
            break;
          case USER_ROLES.LANDLORD:
            navigate(ROUTES.LANDLORD_DASHBOARD, { replace: true });
            break;
          case USER_ROLES.ADMIN: // Admins can also be invited
            navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
            break;
          default:
            navigate(ROUTES.HOME, { replace: true }); // Fallback
            break;
        }
      } catch (err) {
        console.error("Invite acceptance error:", err);
        showError(err.response?.data?.message || "Failed to accept invitation. Please try again.");
      }
    }
  );

  // Effect for initial token verification
  useEffect(() => {
    const verifyToken = async () => {
      setInitialLoading(true);
      setInitialError(null); // Clear previous initial errors
      try {
        const response = await verifyInviteToken(inviteToken);
        setInviteDetails(response.invite);
        setIsExistingUser(response.isExistingUser);
        // Pre-fill email for the form if it's a new user
        if (!response.isExistingUser) {
          // Use setValues from useForm to update form data
          values.email = response.invite.email; // Directly modify values object before initial render
          // Or if you prefer to use setValues: setValues(prev => ({ ...prev, email: response.invite.email }));
          // For initial load, direct modification before render is fine, or use useEffect on inviteDetails
        }
      } catch (err) {
        setInitialError("Invalid or expired invitation link. Please request a new one or contact support.");
        console.error("Invite token verification error:", err);
        showError(err.response?.data?.message || "Invalid or expired invitation link. Please request a new one or contact support.");
      } finally {
        setInitialLoading(false);
      }
    };
    if (inviteToken) { // Only run if inviteToken is present
      verifyToken();
    } else {
      setInitialLoading(false);
      setInitialError("Invitation token is missing from the URL.");
      showError("Invitation token is missing from the URL.");
    }
  }, [inviteToken, showSuccess, showError, values]); // Added values to dependencies to ensure email is set correctly

  // If inviteDetails is loaded and it's a new user, set the email in useForm values
  useEffect(() => {
    if (inviteDetails && !isExistingUser) {
      handleChange({ target: { name: 'email', value: inviteDetails.email } });
    }
  }, [inviteDetails, isExistingUser, handleChange]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg shadow-xl border border-gray-100">
            <LoadingSpinner size="lg" color="#219377" className="mb-4" />
            <p className="text-xl text-gray-700 font-semibold">Verifying invitation link...</p>
          </div>
        ) : initialError ? (
          <div className="p-8 bg-white rounded-lg shadow-xl border border-gray-100">
            {/* Error message is already displayed via GlobalAlertContext, but a static message can remain here */}
            <h3 className="text-lg font-semibold text-red-600 mb-4">Invitation Error</h3>
            <p className="text-gray-700 mb-6">{initialError}</p>
            <div className="mt-6 text-center">
              <Link to={ROUTES.REGISTER} className="text-blue-600 hover:underline font-medium">Register a new account</Link>
              <span className="mx-2 text-gray-500">|</span>
              <Link to={ROUTES.LOGIN} className="text-blue-600 hover:underline font-medium">Already have an account?</Link>
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
                <Link to={ROUTES.LOGIN} className="bg-[#ffbd59] text-gray-900 px-6 py-3 rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-200">
                  Log In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-gray-700">Please set up your profile to activate your account.</p>
                <Input
                  label="Full Name"
                  id="name"
                  name="name"
                  type="text"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="Your Full Name"
                  required
                  error={errors.name}
                  disabled={isSubmitting}
                />
                <Input
                  label="Email Address"
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  disabled={true} // Email is pre-filled and not editable
                  className="opacity-70"
                />
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
                    error={errors.password}
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
                    label="Confirm Password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                    error={errors.confirmPassword}
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
                  <CheckCircle className="w-5 h-5 mr-2" /> {isSubmitting ? "Accepting..." : "Accept Invitation & Register"}
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
