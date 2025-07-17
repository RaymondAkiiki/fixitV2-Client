import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext.jsx";
import { USER_ROLES } from '../utils/constants.js';

export const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    /**
     * Checks if the current user has at least one of the required roles.
     * @param {string|string[]} rolesRequired - A single role or an array of roles.
     * @returns {boolean} True if the user has permission, false otherwise.
     */
    const hasPermission = useCallback((rolesRequired) => {
        if (authLoading || !isAuthenticated) {
            return false;
        }

        const requiredRolesArray = Array.isArray(rolesRequired) ? rolesRequired : [rolesRequired];
        const userRole = user?.role?.toLowerCase();

        return requiredRolesArray.some(role => userRole === role.toLowerCase());
    }, [user, isAuthenticated, authLoading]);

    /**
     * Checks if the user has access to a specific property.
     * @param {string} propertyId - The ID of the property to check.
     * @returns {boolean} True if access is granted.
     */
    const hasPropertyAccess = useCallback((propertyId) => {
        if (!isAuthenticated || !propertyId) {
            return false;
        }

        const userRole = user.role?.toLowerCase();

        // Admin has universal access.
        if (userRole === USER_ROLES.ADMIN) return true;

        // Check against properties associated with the user.
        // NOTE: This assumes the 'user' object from the backend includes these arrays.
        if (userRole === USER_ROLES.LANDLORD && user.propertiesOwned?.includes(propertyId)) return true;
        if (userRole === USER_ROLES.PROPERTY_MANAGER && user.propertiesManaged?.includes(propertyId)) return true;
        if (userRole === USER_ROLES.TENANT && user.tenancies?.some(t => t.property === propertyId)) return true;

        return false;
    }, [user, isAuthenticated]);

    /**
     * Checks if the user has access to a specific unit.
     * @param {string} unitId - The ID of the unit to check.
     * @param {string} [propertyId] - The parent property ID (optional but recommended).
     * @returns {boolean} True if access is granted.
     */
    const hasUnitAccess = useCallback((unitId, propertyId = null) => {
        if (!isAuthenticated || !unitId) {
            return false;
        }

        const userRole = user.role?.toLowerCase();

        // Admin has universal access.
        if (userRole === USER_ROLES.ADMIN) return true;

        // Landlords/PMs have access if they manage the parent property.
        if (propertyId && (userRole === USER_ROLES.LANDLORD || userRole === USER_ROLES.PROPERTY_MANAGER)) {
            if (hasPropertyAccess(propertyId)) return true;
        }

        // Tenants have access if they are explicitly linked to the unit.
        if (userRole === USER_ROLES.TENANT && user.tenancies?.some(t => t.unit === unitId)) return true;

        return false;
    }, [user, isAuthenticated, hasPropertyAccess]);

    const permissionContextValue = useMemo(() => ({
        hasPermission,
        hasPropertyAccess,
        hasUnitAccess,
    }), [hasPermission, hasPropertyAccess, hasUnitAccess]);

    return (
        <PermissionContext.Provider value={permissionContextValue}>
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