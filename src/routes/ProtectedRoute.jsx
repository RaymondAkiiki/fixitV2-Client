import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePermission } from "../context/PermissionContext.jsx";

/**
 * ProtectedRoute component
 * Wraps protected routes and handles authentication/authorization checks.
 * @param {ReactNode} children - The protected component(s).
 * @param {string|string[]} allowedRoles - Allowed role or roles for the route.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { hasPermission } = usePermission();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        {/* Replace with your Spinner component if desired */}
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></span>
        <p className="ml-4 text-xl text-gray-700">Loading user session...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Redirect to login, preserving the current path in state for redirection after successful login
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  // Check if the user's role is allowed to access this route
  if (allowedRoles && !hasPermission(allowedRoles)) {
    return <Navigate to="/access-denied" replace />;
  }

  // Render children or Outlet for nested routes
  return children ? children : <Outlet />;
};

/**
 * InitialRedirect component
 * Handles the initial redirection after app load or login
 * based on the user's authentication status and role.
 */
export const InitialRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></span>
        <p className="ml-4 text-xl text-gray-700">Loading user session...</p>
      </div>
    );
  }

  if (isAuthenticated()) {
    switch (user?.role?.toLowerCase()) {
      case 'tenant':
        return <Navigate to="/tenant" replace />;
      case 'propertymanager':
        return <Navigate to="/pm" replace />;
      case 'landlord':
        return <Navigate to="/landlord" replace />;
      case 'admin':
        return <Navigate to="/adminPage" replace />;
      default:
        return <Navigate to="/access-denied" replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;