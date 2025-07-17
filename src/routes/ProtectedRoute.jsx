import React from 'react';
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { usePermission } from "../contexts/PermissionContext.jsx";
import { USER_ROLES, ROUTES } from "../utils/constants.js";
import Spinner from "../components/common/Spinner.jsx";
import MainLayout from '../layout/MainLayout.jsx'; // Import your main app layout

/**
 * A shared loading component to provide a consistent UI during auth checks.
 * It renders the main application layout with a spinner in the content area.
 */
const AuthLoadingScreen = () => (
    <MainLayout>
        <div className="flex items-center justify-center h-full p-8">
            <Spinner />
            <p className="ml-4 text-lg text-gray-600">Verifying session...</p>
        </div>
    </MainLayout>
);

/**
 * Wraps protected routes to handle authentication and authorization.
 * @param {string|string[]} allowedRoles - A role or array of roles permitted to access the route.
 */
const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const { hasPermission } = usePermission();
    const location = useLocation();

    // 1. While the authentication status is being checked, show a consistent loading screen.
    // This prevents screen flicker and provides a better user experience.
    if (loading) {
        return <AuthLoadingScreen />;
    }

    // 2. If the user is not authenticated, redirect them to the login page.
    // We pass the original location so they can be redirected back after logging in.
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
    }

    // 3. If the route requires specific roles and the user doesn't have permission, redirect to an access denied page.
    if (allowedRoles && !hasPermission(allowedRoles)) {
        // Log this for debugging purposes, but don't show it in production.
        console.warn(`Access Denied: User with role '${user?.role}' tried to access a route requiring '${allowedRoles}'.`);
        return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
    }

    // 4. If the user is authenticated and has permission, render the child components.
    // <Outlet /> is used by React Router for nested routes.
    return <Outlet />;
};

/**
 * Handles the initial redirection after the app loads, based on user role.
 */
export const InitialRedirect = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <AuthLoadingScreen />;
    }

    if (isAuthenticated && user) {
        // Redirect authenticated users to their designated dashboard.
        switch (user.role?.toLowerCase()) {
            case USER_ROLES.TENANT:
                return <Navigate to={ROUTES.TENANT_DASHBOARD} replace />;
            case USER_ROLES.PROPERTY_MANAGER:
                return <Navigate to={ROUTES.PM_DASHBOARD} replace />;
            case USER_ROLES.LANDLORD:
                return <Navigate to={ROUTES.LANDLORD_DASHBOARD} replace />;
            case USER_ROLES.ADMIN:
                return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
            default:
                // If the role is unrecognized, deny access.
                return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
        }
    }

    // If not authenticated, redirect to the public landing/login page.
    return <Navigate to={ROUTES.LOGIN} replace />;
};

export default ProtectedRoute;