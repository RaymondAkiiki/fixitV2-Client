//protectedRout.jsx 

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

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as authService from "../services/authService.js";
import api from "../api/axios.js";
import { useGlobalAlert } from "./GlobalAlertContext.jsx";

// Create the AuthContext
const AuthContext = createContext();

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
          setUser({
            _id: loginData._id,
            name: loginData.name,
            email: loginData.email,
            role: loginData.role,
            propertiesManaged: loginData.propertiesManaged,
            propertiesOwned: loginData.propertiesOwned,
            tenancies: loginData.tenancies,
          });
          localStorage.setItem("user", JSON.stringify(loginData));
          localStorage.setItem("token", loginData.token);
          return loginData;
        } else {
          console.error("Login data missing token:", loginData);
          showError("Login failed: Missing authentication token.");
          logout();
          throw new Error("Missing authentication token.");
        }
      } catch (err) {
        logout();
        throw err;
      }
    },
    [showError, logout]
  );

  /**
   * Checks user authentication status on app load.
   * Validates the stored token with the backend.
   * Does not show "logged out" toast for auto-logout.
   */
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        try {
          // Call backend to validate token. authService.validateToken will use axios interceptor.
          const { user: validUser } = await authService.validateToken();
          // If validation successful, update user state
          if (validUser) {
            setUser({
              _id: validUser._id,
              name: validUser.name,
              email: validUser.email,
              role: validUser.role,
              propertiesManaged: validUser.propertiesManaged,
              propertiesOwned: validUser.propertiesOwned,
              tenancies: validUser.tenancies,
            });
            // Ensure token is still present in localStorage, if not (e.g., manual deletion), re-add
            if (!localStorage.getItem("token")) {
              localStorage.setItem("token", JSON.parse(storedUser).token);
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
  }, [logout]);

  // Value provided by the context
  const authContextValue = {
    user,
    isAuthenticated: useCallback(() => !!user && !loading, [user, loading]),
    login,
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


// frontend/src/context/GlobalAlertContext.jsx

// This context provides a global mechanism for displaying alert messages (success, error, info).
// It's useful for showing transient feedback to the user after an action.

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

// Create the GlobalAlertContext
export const GlobalAlertContext = createContext();

/**
 * GlobalAlertProvider component
 * Provides alert state and functions to its children components.
 */
export const GlobalAlertProvider = ({ children }) => {
    // State to manage the current alert message and its type
    const [alert, setAlert] = useState(null); // { message: '...', type: 'success' | 'error' | 'info' }
    const [timeoutId, setTimeoutId] = useState(null);

    /**
     * Displays an alert message.
     * @param {string} message - The message to display.
     * @param {'success' | 'error' | 'info'} type - The type of alert.
     * @param {number} [duration=5000] - How long the alert should be visible in milliseconds.
     */
    const showAlert = useCallback((message, type = 'info', duration = 5000) => {
        // Clear any existing timeout to prevent multiple alerts overlapping
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        setAlert({ message, type });

        // Set a new timeout to clear the alert after the specified duration
        const id = setTimeout(() => {
            setAlert(null);
            setTimeoutId(null);
        }, duration);
        setTimeoutId(id);
    }, [timeoutId]);

    /**
     * Shortcut for displaying a success alert.
     * @param {string} message - The success message.
     * @param {number} [duration] - Optional duration.
     */
    const showSuccess = useCallback((message, duration) => showAlert(message, 'success', duration), [showAlert]);

    /**
     * Shortcut for displaying an error alert.
     * @param {string} message - The error message.
     * @param {number} [duration] - Optional duration.
     */
    const showError = useCallback((message, duration) => showAlert(message, 'error', duration), [showAlert]);

    /**
     * Shortcut for displaying an info alert.
     * @param {string} message - The info message.
     * @param {number} [duration] - Optional duration.
     */
    const showInfo = useCallback((message, duration) => showAlert(message, 'info', duration), [showAlert]);

    /**
     * Clears the currently displayed alert.
     */
    const clearAlert = useCallback(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setAlert(null);
    }, [timeoutId]);


    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);


    // Value provided by the context
    const alertContextValue = {
        alert,
        showAlert,
        showSuccess,
        showError,
        showInfo,
        clearAlert,
    };

    return (
        <GlobalAlertContext.Provider value={alertContextValue}>
            {children}
            {/* Optional: Render a global alert component here */}
            {alert && (
                <div
                    className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
                        alert.type === 'success' ? 'bg-green-500 text-white' :
                        alert.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                    }`}
                    role="alert"
                >
                    {alert.message}
                    <button
                        onClick={clearAlert}
                        className="ml-4 font-bold text-lg leading-none"
                        aria-label="Close alert"
                    >&times;</button>
                </div>
            )}
        </GlobalAlertContext.Provider>
    );
};

// Custom hook to easily consume the GlobalAlertContext
export const useGlobalAlert = () => {
    const context = useContext(GlobalAlertContext);
    if (context === undefined) {
        throw new Error('useGlobalAlert must be used within a GlobalAlertProvider');
    }
    return context;
};


import React, { createContext, useState, useEffect, useContext } from "react";
import * as leaseService from "../services/leaseService";
import { useAuth } from "./AuthContext";
import { useProperty } from "./PropertyContext";

const LeaseContext = createContext();

export const LeaseProvider = ({ children }) => {
  const { user } = useAuth();
  const { current: currentProperty } = useProperty();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch leases on change
  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line
  }, [user, currentProperty]);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const params = currentProperty ? { propertyId: currentProperty._id } : {};
      const res = await leaseService.getLeases(params);
      setLeases(res.data);
    } catch (err) {
      setError("Could not load leases");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    leases,
    loading,
    error,
    refresh,
    setLeases,
  };

  return (
    <LeaseContext.Provider value={value}>{children}</LeaseContext.Provider>
  );
};

export const useLease = () => useContext(LeaseContext);


// frontend/src/contexts/NotificationContext.jsx

// This context manages in-app notifications, including fetching, marking as read,
// and providing a mechanism for displaying notification toasts or lists.

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx'; // Corrected import path to include .jsx extension
import * as notificationService from '../services/notificationService.js'; // Use notification service

// Create the NotificationContext
export const NotificationContext = createContext();

/**
 * NotificationProvider component
 * Provides notification state and functions to its children components.
 */
export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth(); // Get user from AuthContext
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch notifications from the backend
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated() || !user || authLoading) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await notificationService.getAllNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Failed to load notifications.');
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user, authLoading]);

    // Effect to fetch notifications when component mounts or user logs in/out
    useEffect(() => {
        fetchNotifications();
        // Set up polling for new notifications (optional, for basic real-time)
        // For true real-time, consider WebSockets (e.g., Socket.IO)
        const pollingInterval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds

        return () => clearInterval(pollingInterval); // Cleanup on unmount
    }, [fetchNotifications]);

    /**
     * Marks a specific notification as read.
     * @param {string} notificationId - The ID of the notification to mark as read.
     */
    const markAsRead = useCallback(async (notificationId) => {
        if (!isAuthenticated() || !user) return;

        try {
            // Update UI optimistically
            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif._id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));

            // Call API to persist the change
            await notificationService.markAsRead(notificationId);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            // Revert optimistic update if API call fails (or refetch)
            fetchNotifications();
            setError('Failed to mark notification as read.');
        }
    }, [isAuthenticated, user, fetchNotifications]);

    /**
     * Marks all notifications as read.
     */
    const markAllNotificationsAsRead = useCallback(async () => {
        if (!isAuthenticated() || !user) return;

        try {
            // Optimistically update UI
            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif.isRead ? notif : { ...notif, isRead: true }
                )
            );
            setUnreadCount(0);

            // Persist change on backend
            await notificationService.markAllAsRead();
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            fetchNotifications();
            setError('Failed to mark all as read.');
        }
    }, [isAuthenticated, user, fetchNotifications]);

    // Value provided by the context
    const notificationContextValue = {
        notifications,
        unreadCount,
        isLoading,
        error,
        fetchNotifications, // Allow components to manually refresh
        markAsRead,
        markAllNotificationsAsRead,
    };

    return (
        <NotificationContext.Provider value={notificationContextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook to easily consume the NotificationContext
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

import React, { createContext, useState, useEffect, useContext } from "react";
import * as paymentService from "../services/paymentService";
import { useLease } from "./LeaseContext";

const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const { leases } = useLease();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch Payment/payments for active leases
  useEffect(() => {
    if (leases.length) refresh();
    // eslint-disable-next-line
  }, [leases]);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      // Could fetch payments for all leases, or per property, etc.
      const leaseIds = leases.map((l) => l._id);
      const params = leaseIds.length ? { leaseId: leaseIds[0] } : {}; // Simplified for single lease
      const res = await paymentService.getPayments(params);
      setPayments(res.data);
    } catch (err) {
      setError("Could not load payments");
    } finally {
      setLoading(false);
    }
  };

  // For more complex apps, you can make this a map of leaseId => payments.

  const value = {
    payments,
    loading,
    error,
    refresh,
    setPayments,
  };

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
};

export const usePayment = () => useContext(PaymentContext);

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

import React, { createContext, useState, useEffect, useContext } from "react";
import * as propertyService from "../services/propertyService";
import { useAuth } from "./AuthContext";

const PropertyContext = createContext();

export const PropertyProvider = ({ children }) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch properties when user changes
  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line
  }, [user]);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await propertyService.getProperties();
      setProperties(res.data);
      if (res.data.length && !current) setCurrent(res.data[0]);
    } catch (err) {
      setError("Could not load properties");
    } finally {
      setLoading(false);
    }
  };

  const selectProperty = (propertyId) => {
    const prop = properties.find((p) => p._id === propertyId);
    setCurrent(prop || null);
  };

  const value = {
    properties,
    current,
    loading,
    error,
    refresh,
    selectProperty,
    setCurrent,
    setProperties,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => useContext(PropertyContext);