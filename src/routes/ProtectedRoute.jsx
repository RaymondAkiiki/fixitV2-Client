import React from 'react';
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { USER_ROLES, ROUTES } from "../utils/constants.js";
import Spinner from "../components/common/Spinner.jsx";

const AuthLoadingScreen = () => (
    <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Spinner />
        <p className="ml-4 text-lg text-gray-600">Verifying session...</p>
    </div>
);

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return <AuthLoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
    }

    // ✅ IMPROVEMENT: Ensure allowedRoles is an array and the user object exists
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userHasRequiredRole = user && roles.includes(user.role);

    if (!userHasRequiredRole) {
        console.warn(`Access Denied: User with role '${user?.role}' tried to access a route requiring one of '${roles}'.`);
        return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
    }

    return <Outlet />;
};

export const InitialRedirect = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <AuthLoadingScreen />;
    }

    if (isAuthenticated && user) {
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
                return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
        }
    }

    return <Navigate to={ROUTES.LOGIN} replace />;
};

export default ProtectedRoute;