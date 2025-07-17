// frontend/src/pages/errors/AccessDeniedPage.jsx

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, LogIn, UserPlus, Home, Mail } from "lucide-react"; // Icons
import { ROUTES, USER_ROLES } from "../../utils/constants.js"; // Import constants
import { useAuth } from "../../contexts/AuthContext.jsx"; // Import useAuth to get user role
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx"; // Assuming you have a Spinner component

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, loading: authLoading } = useAuth(); // isAuthenticated is now a boolean

  // Get the reason for access denial from route state, if provided
  const reason = location.state?.reason || 'unspecified';

  const [displayMessage, setDisplayMessage] = useState({
    title: "Access Denied",
    description: "You do not have permission to view this page.",
    actions: [],
  });

  useEffect(() => {
    if (authLoading) {
      // Still loading auth state, don't determine message yet
      return;
    }

    let title = "Access Denied";
    let description = "You do not have permission to view this page.";
    let actions = [];

    // CORRECTED: isAuthenticated is now a boolean, remove ()
    if (!isAuthenticated) { 
      title = "Authentication Required";
      description = "You need to be logged in to access this page.";
      actions = [
        { label: "Log In", to: ROUTES.LOGIN, icon: <LogIn className="w-5 h-5 mr-2" />, primary: true },
        { label: "Register", to: ROUTES.REGISTER, icon: <UserPlus className="w-5 h-5 mr-2" /> },
      ];
    } else {
      // User is authenticated, but unauthorized by role or account status
      const userRole = user?.role?.toLowerCase();

      switch (reason) {
        case 'unauthorized-role':
          title = "Unauthorized Access";
          description = `Your role (${userRole ? userRole.replace(/_/g, ' ') : 'N/A'}) does not permit access to this resource.`;
          actions = [
            { label: "Go to My Dashboard", to: getDashboardRoute(userRole), icon: <Home className="w-5 h-5 mr-2" />, primary: true },
            { label: "Contact Support", to: `mailto:support@${window.location.hostname}`, icon: <Mail className="w-5 h-5 mr-2" /> },
          ];
          break;
        case 'account-deactivated':
          title = "Account Deactivated";
          description = "Your account has been deactivated. Please contact support for assistance.";
          actions = [
            { label: "Contact Support", to: `mailto:support@${window.location.hostname}`, icon: <Mail className="w-5 h-5 mr-2" />, primary: true },
            { label: "Go Home", to: ROUTES.HOME, icon: <Home className="w-5 h-5 mr-2" /> },
          ];
          break;
        case 'pending-approval':
          title = "Account Pending Approval";
          description = "Your account is pending approval by an administrator. Please wait or contact support.";
          actions = [
            { label: "Go to Login", to: ROUTES.LOGIN, icon: <LogIn className="w-5 h-5 mr-2" />, primary: true }, // Redirect to login, as they can't do much else
            { label: "Contact Support", to: `mailto:support@${window.location.hostname}`, icon: <Mail className="w-5 h-5 mr-2" /> },
          ];
          break;
        default: // Generic access denied or unspecified reason
          title = "Access Denied";
          description = "You do not have permission to view this page. If you believe this is an error, please contact your administrator.";
          actions = [
            { label: "Go to My Dashboard", to: getDashboardRoute(userRole), icon: <Home className="w-5 h-5 mr-2" />, primary: true },
            { label: "Contact Support", to: `mailto:support@${window.location.hostname}`, icon: <Mail className="w-5 h-5 mr-2" /> },
          ];
          break;
      }
    }
    setDisplayMessage({ title, description, actions });

  }, [isAuthenticated, user, reason, authLoading]); // isAuthenticated is already a dependency

  // Helper function to determine the correct dashboard route
  const getDashboardRoute = (role) => {
    switch (role) {
      case USER_ROLES.TENANT: return ROUTES.TENANT_DASHBOARD;
      case USER_ROLES.LANDLORD: return ROUTES.LANDLORD_DASHBOARD;
      case USER_ROLES.PROPERTY_MANAGER: return ROUTES.PM_DASHBOARD;
      case USER_ROLES.ADMIN: return ROUTES.ADMIN_DASHBOARD;
      default: return ROUTES.HOME; // Fallback for unauthenticated or unknown roles
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" color="#219377" className="mb-4" />
        <p className="text-xl text-gray-700 font-semibold">Checking access permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#ffebee] to-[#f0f4c3] px-4 text-center animate-fadeIn">
      <AlertTriangle className="w-20 h-20 text-red-600 mb-6 animate-pulse" />
      <h1 className="text-5xl font-extrabold text-gray-900 mb-3">{displayMessage.title}</h1>
      <p className="text-lg text-gray-700 mb-8 max-w-xl">{displayMessage.description}</p>

      <div className="flex flex-col sm:flex-row gap-4">
        {displayMessage.actions.map((action, index) => (
          action.to.startsWith('mailto:') ? (
            <a
              key={index}
              href={action.to}
              className={`inline-flex items-center px-6 py-3 font-semibold rounded-xl transition ${
                action.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {action.icon} {action.label}
            </a>
          ) : (
            <Link
              key={index}
              to={action.to}
              className={`inline-flex items-center px-6 py-3 font-semibold rounded-xl transition ${
                action.primary ? 'bg-[#ffbd59] text-gray-900 hover:bg-orange-600' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {action.icon} {action.label}
            </Link>
          )
        ))}
      </div>

      {/* Animations (kept as inline style for simplicity as they are specific to this page) */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
        `}
      </style>
    </div>
  );
};

export default AccessDeniedPage;