// src/pages/public/InviteAcceptancePage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { verifyInviteToken, acceptInvite, declineInvite } from "../../services/publicService.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx";
import useForm from "../../hooks/useForm.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import ConfirmationModal from "../../components/common/modals/ConfirmationModal.jsx";
import { UserPlus, Lock, Mail, CheckCircle, Eye, EyeOff, X } from "lucide-react";
import { ROUTES, USER_ROLES } from "../../utils/constants.js";

/**
 * Validates the invite acceptance form
 */
const validateInviteAcceptanceForm = (values) => {
  const errors = {};
  
  // Validate name
  if (!values.name.trim()) {
    errors.name = "Full Name is required.";
  }
  
  // Validate password
  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }
  
  // Validate password confirmation
  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  
  // Validate phone (optional)
  if (values.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(values.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }
  
  return errors;
};

function InviteAcceptancePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState(null);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [decliningInvite, setDecliningInvite] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize useForm hook for the form
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
    setValues
  } = useForm(
    { 
      name: "", 
      password: "", 
      confirmPassword: "", 
      email: "",
      phone: "" // Added phone field 
    },
    validateInviteAcceptanceForm,
    async (formValues) => {
      try {
        // Call the public service to accept the invite
        await acceptInvite(inviteToken, {
          name: formValues.name,
          password: formValues.password,
          phone: formValues.phone // Include phone if provided
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
          case USER_ROLES.ADMIN:
            navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
            break;
          default:
            navigate(ROUTES.HOME, { replace: true });
            break;
        }
      } catch (err) {
        console.error("Invite acceptance error:", err);
        showError(err.message || "Failed to accept invitation. Please try again.");
      }
    }
  );

  // Handle declining the invitation
  const handleDeclineInvite = async () => {
    setDecliningInvite(true);
    try {
      await declineInvite(inviteToken);
      showSuccess("Invitation declined successfully.");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      console.error("Invite decline error:", err);
      showError(err.message || "Failed to decline invitation. Please try again.");
    } finally {
      setDecliningInvite(false);
      setShowDeclineModal(false);
    }
  };

  // Effect for initial token verification
  useEffect(() => {
    const verifyToken = async () => {
      setInitialLoading(true);
      setInitialError(null);
      try {
        const response = await verifyInviteToken(inviteToken);
        setInviteDetails(response.invite);
        setIsExistingUser(response.isExistingUser);
        
        // Pre-fill email for the form
        setValues(prev => ({ 
          ...prev, 
          email: response.invite.email
        }));
      } catch (err) {
        setInitialError("Invalid or expired invitation link. Please request a new one or contact support.");
        console.error("Invite token verification error:", err);
        showError(err.message || "Invalid or expired invitation link. Please request a new one or contact support.");
      } finally {
        setInitialLoading(false);
      }
    };
    
    if (inviteToken) {
      verifyToken();
    } else {
      setInitialLoading(false);
      setInitialError("Invitation token is missing from the URL.");
      showError("Invitation token is missing from the URL.");
    }
  }, [inviteToken, showError, setValues]);

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
                <Link to={ROUTES.LOGIN} className="bg-[#ffbd59] text-gray-900 px-6 py-3 rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-200 inline-block">
                  Log In
                </Link>
                <button
                  onClick={() => setShowDeclineModal(true)}
                  className="mt-4 px-6 py-3 text-red-600 hover:text-red-800 font-medium block mx-auto"
                >
                  Decline Invitation
                </button>
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
                  disabled={true}
                  className="opacity-70"
                />
                <Input
                  label="Phone Number (Optional)"
                  id="phone"
                  name="phone"
                  type="tel"
                  value={values.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  error={errors.phone}
                  disabled={isSubmitting}
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
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    className="sm:w-2/3 py-3"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" /> {isSubmitting ? "Accepting..." : "Accept Invitation"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="sm:w-1/3 py-3 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setShowDeclineModal(true)}
                    disabled={isSubmitting}
                  >
                    <X className="w-5 h-5 mr-2" /> Decline
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
      
      {/* Decline Confirmation Modal */}
      {showDeclineModal && (
        <ConfirmationModal
          isOpen={showDeclineModal}
          onClose={() => setShowDeclineModal(false)}
          onConfirm={handleDeclineInvite}
          title="Decline Invitation"
          message="Are you sure you want to decline this invitation? This action cannot be undone."
          confirmText={decliningInvite ? "Declining..." : "Yes, Decline Invitation"}
          cancelText="Cancel"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          isLoading={decliningInvite}
        />
      )}
    </div>
  );
}

export default InviteAcceptancePage;


// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Mail, Check, X, UserPlus, Eye, EyeOff, AlertTriangle, Loader, CheckCircle } from 'lucide-react';
// import { verifyInviteToken, acceptInvite, declineInvite } from '../../services/inviteService';
// import Button from '../../components/common/Button';
// import LoadingSpinner from '../../components/common/LoadingSpinner';

// // Constants
// const PRIMARY_COLOR = '#219377';
// const SECONDARY_COLOR = '#ffbd59';

// const InviteAcceptancePage = () => {
//   const { token } = useParams();
//   const navigate = useNavigate();
  
//   // State
//   const [invite, setInvite] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     password: '',
//     confirmPassword: '',
//     phone: '',
//     acceptTerms: false
//   });
//   const [formErrors, setFormErrors] = useState({});
//   const [processingAction, setProcessingAction] = useState(false);
//   const [success, setSuccess] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
//   // Verify the token and get invite details
//   useEffect(() => {
//     const verifyToken = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         const response = await verifyInviteToken(token);
        
//         if (response.success) {
//           setInvite(response.data);
          
//           // Pre-fill email from invite if available
//           if (response.data.email) {
//             setFormData(prev => ({ ...prev, email: response.data.email }));
//           }
//         } else {
//           setError('This invitation is invalid or has expired.');
//         }
//       } catch (err) {
//         console.error('Failed to verify invitation:', err);
//         setError('This invitation is invalid or has expired.');
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     if (token) {
//       verifyToken();
//     } else {
//       setError('No invitation token provided.');
//       setLoading(false);
//     }
//   }, [token]);
  
//   // Handle form field changes
//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     // Clear error for this field
//     setFormErrors(prev => ({ ...prev, [name]: '' }));
    
//     // Update form data based on input type
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };
  
//   // Form validation
//   const validateForm = () => {
//     const errors = {};
    
//     if (!formData.firstName?.trim()) {
//       errors.firstName = 'First name is required';
//     }
    
//     if (!formData.lastName?.trim()) {
//       errors.lastName = 'Last name is required';
//     }
    
//     if (!formData.password) {
//       errors.password = 'Password is required';
//     } else if (formData.password.length < 8) {
//       errors.password = 'Password must be at least 8 characters';
//     }
    
//     if (!formData.confirmPassword) {
//       errors.confirmPassword = 'Please confirm your password';
//     } else if (formData.password !== formData.confirmPassword) {
//       errors.confirmPassword = 'Passwords do not match';
//     }
    
//     if (!formData.acceptTerms) {
//       errors.acceptTerms = 'You must accept the terms and conditions';
//     }
    
//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };
  
//   // Handle accepting the invitation
//   const handleAccept = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }
    
//     setProcessingAction(true);
//     setError(null);
    
//     try {
//       const response = await acceptInvite(token, {
//         email: invite.email,
//         firstName: formData.firstName.trim(),
//         lastName: formData.lastName.trim(),
//         password: formData.password,
//         confirmPassword: formData.confirmPassword,
//         phone: formData.phone.trim() || undefined
//       });
      
//       setSuccess({
//         message: 'You have successfully accepted the invitation!',
//         details: 'You can now log in with your email and password.'
//       });
//     } catch (err) {
//       console.error('Failed to accept invitation:', err);
//       setError('Failed to accept invitation: ' + (err.response?.data?.message || err.message));
//     } finally {
//       setProcessingAction(false);
//     }
//   };
  
//   // Handle declining the invitation
//   const handleDecline = async () => {
//     if (!window.confirm('Are you sure you want to decline this invitation?')) {
//       return;
//     }
    
//     setProcessingAction(true);
//     setError(null);
    
//     try {
//       await declineInvite(token);
      
//       setSuccess({
//         message: 'You have declined the invitation.',
//         details: 'The invitation has been marked as declined.'
//       });
//     } catch (err) {
//       console.error('Failed to decline invitation:', err);
//       setError('Failed to decline invitation: ' + (err.response?.data?.message || err.message));
//     } finally {
//       setProcessingAction(false);
//     }
//   };
  
//   // Function to go to login page
//   const goToLogin = () => {
//     navigate('/login');
//   };
  
//   // Show loading state
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
//         <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
//           <Mail className="mx-auto h-16 w-16 text-blue-500 mb-4" />
//           <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying Invitation</h1>
//           <p className="text-gray-600 mb-6">Please wait while we verify your invitation...</p>
//           <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
//         </div>
//       </div>
//     );
//   }
  
//   // Show error state
//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
//         <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
//           <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
//           <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Invitation</h1>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <Button
//             onClick={() => navigate('/login')}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
//           >
//             Go to Login
//           </Button>
//         </div>
//       </div>
//     );
//   }
  
//   // Show success state
//   if (success) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
//         <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
//           <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
//           <h1 className="text-2xl font-bold text-gray-800 mb-2">{success.message}</h1>
//           <p className="text-gray-600 mb-6">{success.details}</p>
//           <Button
//             onClick={goToLogin}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
//           >
//             Go to Login
//           </Button>
//         </div>
//       </div>
//     );
//   }
  
//   // Main content - invite acceptance form
//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
//       <div className="w-full max-w-md">
//         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//           <div className="p-6 bg-blue-600 text-white">
//             <div className="flex items-center">
//               <Mail className="h-8 w-8 mr-3" />
//               <h1 className="text-2xl font-bold">Accept Invitation</h1>
//             </div>
//             <p className="mt-2 text-blue-100">
//               You've been invited to join as a {invite.roleToInvite || invite.role}
//             </p>
//           </div>
          
//           <div className="p-6">
//             <div className="mb-6">
//               <h2 className="text-lg font-semibold text-gray-800 mb-2">Invitation Details</h2>
//               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//                 <div className="grid grid-cols-1 gap-3">
//                   <div>
//                     <span className="text-sm text-gray-500">Invited Email:</span>
//                     <p className="text-gray-900 font-medium">{invite.email}</p>
//                   </div>
//                   <div>
//                     <span className="text-sm text-gray-500">Role:</span>
//                     <p className="text-gray-900 font-medium capitalize">{invite.roleToInvite || invite.role}</p>
//                   </div>
//                   <div>
//                     <span className="text-sm text-gray-500">Property:</span>
//                     <p className="text-gray-900 font-medium">{invite.property?.name || 'N/A'}</p>
//                   </div>
//                   {invite.unit && (
//                     <div>
//                       <span className="text-sm text-gray-500">Unit:</span>
//                       <p className="text-gray-900 font-medium">
//                         {invite.unit.unitName || invite.unit.unitIdentifier || `Unit ${invite.unit.unitNumber || ''}`}
//                       </p>
//                     </div>
//                   )}
//                   <div>
//                     <span className="text-sm text-gray-500">Expires:</span>
//                     <p className="text-gray-900 font-medium">
//                       {new Date(invite.expiresAt).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <form onSubmit={handleAccept}>
//               <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Your Account</h2>
              
//               <div className="grid grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
//                     First Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     id="firstName"
//                     name="firstName"
//                     value={formData.firstName}
//                     onChange={handleChange}
//                     className={`w-full px-3 py-2 border ${
//                       formErrors.firstName ? 'border-red-500' : 'border-gray-300'
//                     } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
//                     disabled={processingAction}
//                   />
//                   {formErrors.firstName && (
//                     <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
//                   )}
//                 </div>
                
//                 <div>
//                   <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
//                     Last Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     id="lastName"
//                     name="lastName"
//                     value={formData.lastName}
//                     onChange={handleChange}
//                     className={`w-full px-3 py-2 border ${
//                       formErrors.lastName ? 'border-red-500' : 'border-gray-300'
//                     } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
//                     disabled={processingAction}
//                   />
//                   {formErrors.lastName && (
//                     <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
//                   )}
//                 </div>
//               </div>
              
//               <div className="mb-4">
//                 <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
//                   Phone Number (Optional)
//                 </label>
//                 <input
//                   type="tel"
//                   id="phone"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   disabled={processingAction}
//                 />
//               </div>
              
//               <div className="mb-4">
//                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                   Password <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     id="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     className={`w-full px-3 py-2 border ${
//                       formErrors.password ? 'border-red-500' : 'border-gray-300'
//                     } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10`}
//                     disabled={processingAction}
//                   />
//                   <button
//                     type="button"
//                     className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-5 w-5 text-gray-400" />
//                     ) : (
//                       <Eye className="h-5 w-5 text-gray-400" />
//                     )}
//                   </button>
//                 </div>
//                 {formErrors.password && (
//                   <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
//                 )}
//               </div>
              
//               <div className="mb-6">
//                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
//                   Confirm Password <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <input
//                     type={showConfirmPassword ? "text" : "password"}
//                     id="confirmPassword"
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     className={`w-full px-3 py-2 border ${
//                       formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
//                     } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10`}
//                     disabled={processingAction}
//                   />
//                   <button
//                     type="button"
//                     className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   >
//                     {showConfirmPassword ? (
//                       <EyeOff className="h-5 w-5 text-gray-400" />
//                     ) : (
//                       <Eye className="h-5 w-5 text-gray-400" />
//                     )}
//                   </button>
//                 </div>
//                 {formErrors.confirmPassword && (
//                   <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
//                 )}
//               </div>
              
//               <div className="mb-6">
//                 <label className="flex items-center">
//                   <input
//                     type="checkbox"
//                     name="acceptTerms"
//                     checked={formData.acceptTerms}
//                     onChange={handleChange}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                     disabled={processingAction}
//                   />
//                   <span className="ml-2 text-sm text-gray-700">
//                     I accept the{' '}
//                     <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800">
//                       Terms and Conditions
//                     </a>
//                   </span>
//                 </label>
//                 {formErrors.acceptTerms && (
//                   <p className="mt-1 text-sm text-red-600">{formErrors.acceptTerms}</p>
//                 )}
//               </div>
              
//               <div className="flex justify-between">
//                 <Button
//                   type="button"
//                   onClick={handleDecline}
//                   className="bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2 rounded-lg flex items-center"
//                   disabled={processingAction}
//                 >
//                   <X className="mr-2 h-5 w-5" /> Decline
//                 </Button>
//                 <Button
//                   type="submit"
//                   className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center"
//                   disabled={processingAction}
//                 >
//                   {processingAction ? (
//                     <>
//                       <Loader className="mr-2 h-5 w-5 animate-spin" /> Processing...
//                     </>
//                   ) : (
//                     <>
//                       <Check className="mr-2 h-5 w-5" /> Accept Invitation
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </form>
//           </div>
//         </div>
        
//         <div className="text-center mt-6">
//           <p className="text-gray-600">
//             Already have an account?{' '}
//             <button
//               onClick={goToLogin}
//               className="text-blue-600 hover:text-blue-800 font-medium"
//             >
//               Log in
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InviteAcceptancePage;