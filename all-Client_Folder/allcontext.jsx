// frontend/src/contexts/RentContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import * as rentService from "../services/rentService.js"; // Corrected to rentService
import { useLease } from "./LeaseContext.jsx"; // Corrected import path
import { useAuth } from "./AuthContext.jsx"; // Corrected import path

const PaymentContext = createContext();

export const RentProvider = ({ children }) => {
  const { leases, loading: leasesLoading } = useLease();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshRents = useCallback(async () => {
    if (!isAuthenticated() || authLoading || leasesLoading) {
      setRents([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Fetch payments for all leases associated with the current user/property context
      // This logic might need to be more sophisticated depending on how you want to aggregate payments
      // For now, fetching all payments and then filtering client-side or passing specific leaseIds
      const params = {};
      if (leases.length > 0) {
        // Example: Fetch payments for the first lease, or iterate/send an array of lease IDs
        // For simplicity, let's fetch all and filter client-side or adjust backend to take multiple leaseIds
        // If backend getRentEntries supports `leaseId` array, pass it: { leaseId: leases.map(l => l._id) }
      }

      const res = await rentService.getRentEntries(params); // Use getRentEntries from rentService
      setRents(res.data);
    } catch (err) {
      console.error("Could not load payments:", err);
      setError("Could not load payments.");
      setRents([]);
    } finally {
      setLoading(false);
    }
  }, [leases, leasesLoading, isAuthenticated, authLoading]);

  // Fetch payments when leases or auth state changes
  useEffect(() => {
    refreshRents();
  }, [refreshRents]);

  const value = {
    rents,
    loading,
    error,
    refreshRents, // Expose refresh function
    setRents, // Allow direct manipulation if needed (e.g., after add/update)
  };

  return (
    <RentContext.Provider value={value}>{children}</RentContext.Provider>
  );
};

export const useRent = () => {
  const context = useContext(RentContext);
  if (context === undefined) {
    throw new Error('useRent must be used within a RentProvider');
  }
  return context;
};


// frontend/src/contexts/AuthContext.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as authService from "../services/authService.js";
import * as userService from "../services/userService.js"; // Import userService for getMyProfile
import api from "../api/axios.js";
import { useGlobalAlert } from "./GlobalAlertContext.jsx";
import { USER_ROLES } from '../utils/constants.js'; // Import USER_ROLES for consistency

// Create the AuthContext
export const AuthContext = createContext();

/**
 * AuthProvider component
 * Provides authentication state and functions to its children components.
 */
export const AuthProvider = ({ children }) => {
  // user state will store the user object including _id, name, email, role, etc.
  const [user, setUser] = useState(null);
  // loading state indicates if the initial authentication check is in progress
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useGlobalAlert();

  /**
   * Handles user logout.
   * Clears authentication state and removes data from localStorage.
   * If manualLogout is set in localStorage, shows a toast. Otherwise, silent logout (auto).
   */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Optionally, clear Axios default headers if needed
    delete api.defaults.headers.common["Authorization"];

    // Only show toast if this was a manual logout
    if (localStorage.getItem("manualLogout")) {
      showSuccess("Logged out successfully.");
      localStorage.removeItem("manualLogout");
    }
  }, [showSuccess]);

  /**
   * Handles user login and updates authentication state.
   * Calls the backend API, stores user data and token in localStorage.
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {object} loginData if login is successful
   */
  const login = useCallback(
    async (email, password) => {
      try {
        const loginData = await authService.loginUser(email, password);
        if (loginData && loginData.token) {
          // Store minimal user data and token
          const userToStore = {
            _id: loginData._id,
            name: loginData.name,
            email: loginData.email,
            role: loginData.role,
            // Include other essential properties for UI/permissions
            propertiesManaged: loginData.propertiesManaged || [],
            propertiesOwned: loginData.propertiesOwned || [],
            tenancies: loginData.tenancies || [],
          };
          setUser(userToStore);
          localStorage.setItem("user", JSON.stringify(userToStore));
          localStorage.setItem("token", loginData.token);
          return loginData;
        } else {
          console.error("Login data missing token:", loginData);
          showError("Login failed: Missing authentication token.");
          logout();
          throw new Error("Missing authentication token.");
        }
      } catch (err) {
        // Error message from authService is already user-friendly
        showError(err);
        logout();
        throw err;
      }
    },
    [showError, logout]
  );

  /**
   * Registers a new user.
   * @param {object} userData - User registration details.
   * @returns {object} Registration data if successful.
   */
  const register = useCallback(async (userData) => {
    try {
      const registrationData = await authService.registerUser(userData);
      // After registration, you might want to auto-login or redirect to login page
      showSuccess("Registration successful! Please log in.");
      return registrationData;
    } catch (err) {
      showError(err);
      throw err;
    }
  }, [showError, showSuccess]);


  /**
   * Checks user authentication status on app load.
   * Validates the stored token with the backend by fetching user profile.
   * Does not show "logged out" toast for auto-logout.
   */
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        try {
          // Call backend to validate token by fetching user profile
          const validUser = await userService.getMyProfile(); // Uses /users/profile
          // If validation successful, update user state
          if (validUser) {
            setUser({
              _id: validUser._id,
              name: validUser.firstName + " " + validUser.lastName, // Assuming name is derived from first/last
              email: validUser.email,
              role: validUser.role,
              propertiesManaged: validUser.propertiesManaged || [],
              propertiesOwned: validUser.propertiesOwned || [],
              tenancies: validUser.tenancies || [],
              // Add any other necessary user details from the profile
            });
            // Ensure token is still present in localStorage, if not (e.g., manual deletion), re-add
            if (!localStorage.getItem("token")) {
              localStorage.setItem("token", token); // Use the original token
            }
          } else {
            logout();
          }
        } catch (err) {
          console.error("Token validation failed:", err);
          logout();
        }
      } else {
        // No stored user or token, ensure logged out state
        logout();
      }
      setLoading(false);
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout]); // Only re-run if logout function changes

  // Value provided by the context
  const authContextValue = {
    user,
    isAuthenticated: useCallback(() => !!user && !loading, [user, loading]),
    login,
    register, // Expose register function
    /**
     * Use this helper instead of logout to perform a user-initiated logout.
     * This sets a flag so the user sees the success toast.
     */
    manualLogout: useCallback(() => {
      localStorage.setItem("manualLogout", "true");
      logout();
    }, [logout]),
    logout, // Keep the original for internal/auto use
    loading,
    // Add a helper to easily check roles
    hasRole: useCallback(
      (roleToCheck) => {
        return user && user.role?.toLowerCase() === roleToCheck.toLowerCase();
      },
      [user]
    ),
    hasAnyRole: useCallback(
      (rolesArray) => {
        if (!user) return false;
        return rolesArray.some(
          (role) => user.role?.toLowerCase() === role.toLowerCase()
        );
      },
      [user]
    ),
    // Helper to check if user is admin
    isAdmin: useCallback(() => user?.role?.toLowerCase() === USER_ROLES.ADMIN, [user]),
    // Helper to check if user is property manager
    isPropertyManager: useCallback(() => user?.role?.toLowerCase() === USER_ROLES.PROPERTY_MANAGER, [user]),
    // Helper to check if user is landlord
    isLandlord: useCallback(() => user?.role?.toLowerCase() === USER_ROLES.LANDLORD, [user]),
    // Helper to check if user is tenant
    isTenant: useCallback(() => user?.role?.toLowerCase() === USER_ROLES.TENANT, [user]),
    // Helper to check if user is vendor
    isVendor: useCallback(() => user?.role?.toLowerCase() === USER_ROLES.VENDOR, [user]),
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


/ frontend/src/contexts/PermissionContext.jsx

import React, { createContext, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx"; // Corrected import path to include .jsx extension
import { USER_ROLES } from '../utils/constants.js'; // Import USER_ROLES for consistency

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

        // Check if the user's role matches any of the required roles
        return requiredRolesArray.some(role => userRole === role.toLowerCase());
    }, [user, isAuthenticated, authLoading]);

    /**
     * Checks if the current user has access to a specific property.
     * This is crucial for multi-tenancy and role-based property access.
     * @param {string} propertyId - The ID of the property to check access for.
     * @returns {boolean} True if the user is associated with the property (as owner, manager, or tenant), false otherwise.
     */
    const hasPropertyAccess = useCallback((propertyId) => {
        if (!user || !propertyId) return false;

        const userRole = user.role?.toLowerCase();

        // Admin always has access
        if (userRole === USER_ROLES.ADMIN) {
            return true;
        }

        // Landlord: check if propertyId is in propertiesOwned
        if (userRole === USER_ROLES.LANDLORD && user.propertiesOwned?.includes(propertyId)) {
            return true;
        }

        // Property Manager: check if propertyId is in propertiesManaged
        if (userRole === USER_ROLES.PROPERTY_MANAGER && user.propertiesManaged?.includes(propertyId)) {
            return true;
        }

        // Tenant: check if any of their tenancies are linked to this property
        if (userRole === USER_ROLES.TENANT && user.tenancies?.some(t => t.property === propertyId)) {
            return true;
        }

        return false;
    }, [user]);

    /**
     * Checks if the current user has access to a specific unit.
     * @param {string} unitId - The ID of the unit to check access for.
     * @param {string} [propertyId] - Optional: The ID of the parent property (for extra validation).
     * @returns {boolean} True if the user is associated with the unit (via tenancy or property management/ownership), false otherwise.
     */
    const hasUnitAccess = useCallback((unitId, propertyId = null) => {
        if (!user || !unitId) return false;

        const userRole = user.role?.toLowerCase();

        // Admin always has access
        if (userRole === USER_ROLES.ADMIN) {
            return true;
        }

        // Landlord/PM: if they have access to the parent property, they have access to its units
        if ((userRole === USER_ROLES.LANDLORD && user.propertiesOwned?.includes(propertyId)) ||
            (userRole === USER_ROLES.PROPERTY_MANAGER && user.propertiesManaged?.includes(propertyId))) {
            return true;
        }

        // Tenant: check if any of their tenancies are linked to this unit
        if (userRole === USER_ROLES.TENANT && user.tenancies?.some(t => t.unit === unitId)) {
            return true;
        }

        return false;
    }, [user]);


    return (
        <PermissionContext.Provider value={{ hasPermission, hasPropertyAccess, hasUnitAccess }}>
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


// frontend/src/contexts/PropertyContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import * as propertyService from "../services/propertyService.js"; // Corrected import path
import { useAuth } from "./AuthContext.jsx"; // Corrected import path
import { useGlobalAlert } from "./GlobalAlertContext.jsx"; // For showing alerts

const PropertyContext = createContext();

export const PropertyProvider = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showError } = useGlobalAlert();
  const [properties, setProperties] = useState([]);
  const [current, setCurrent] = useState(null); // The currently selected property
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshProperties = useCallback(async () => {
    // Only fetch if authenticated and auth data is loaded
    if (!isAuthenticated() || authLoading) {
      setProperties([]);
      setCurrent(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // getAllProperties handles filtering by user's associated properties on the backend
      const res = await propertyService.getAllProperties(); // Corrected function name
      setProperties(res); // Assuming res is directly the array of properties
      
      // If there are properties and no current property is selected, set the first one as current
      if (res.length > 0 && !current) {
        setCurrent(res[0]);
      } else if (res.length === 0) {
        setCurrent(null);
      } else if (current && !res.some(p => p._id === current._id)) {
        // If current property is no longer in the list (e.g., deleted or access revoked)
        setCurrent(res[0] || null); // Set to first available or null
      }

    } catch (err) {
      console.error("Could not load properties:", err);
      setError("Could not load properties.");
      showError("Failed to load properties. " + (err.message || "Please try again."));
      setProperties([]);
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading, current, showError]); // Added current to dependencies for re-evaluation if current property is removed

  // Fetch properties when user or auth state changes
  useEffect(() => {
    refreshProperties();
  }, [refreshProperties]);

  // Function to manually select a property
  const selectProperty = useCallback((propertyId) => {
    const prop = properties.find((p) => p._id === propertyId);
    setCurrent(prop || null);
  }, [properties]);

  // Value provided by the context
  const value = {
    properties,
    current,
    loading,
    error,
    refreshProperties, // Expose refresh function
    selectProperty,
    setCurrent, // Allow direct setting of current property if needed
    setProperties, // Allow direct manipulation if needed (e.g., after add/update)
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};
