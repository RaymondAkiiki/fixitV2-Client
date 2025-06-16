import React, { createContext, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx"; // Ensure .jsx extension for React components

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    /**
     * Checks if the current user has the required role(s).
     * @param {string|string[]} rolesRequired - A single role string or an array of role strings.
     * Roles are expected to be in lowercase (e.g., 'admin', 'landlord').
     * @returns {boolean} True if the user has any of the required roles, false otherwise.
     */
    const hasPermission = useCallback((rolesRequired) => {
        // If auth data is still loading, assume no permission for now
        if (authLoading || !isAuthenticated()) {
            return false;
        }
        const requiredRolesArray = Array.isArray(rolesRequired) ? rolesRequired : [rolesRequired];
        const userRole = user?.role?.toLowerCase();
        return requiredRolesArray.some(role => userRole === role.toLowerCase());
    }, [user, isAuthenticated, authLoading]);

    return (
        <PermissionContext.Provider value={{ hasPermission }}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermission = () => {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermission must be used within a PermissionProvider');
    }
    return context;
};