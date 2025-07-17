import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import * as authService from "../services/authService.js";
import api from "../api/axios.js";
import { useGlobalAlert } from "./GlobalAlertContext.jsx";
import { USER_ROLES } from '../utils/constants.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { showError, showSuccess } = useGlobalAlert();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    /**
     * Centralized function to set the user state and API headers.
     * This avoids repetition and ensures consistency.
     */
    const setupSession = useCallback((backendUser, accessToken) => {
        // The user object from the backend DTO is the source of truth.
        setUser(backendUser);
        localStorage.setItem("user", JSON.stringify(backendUser));
        localStorage.setItem("token", accessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }, []);

    /**
     * Centralized function to clear the user session from state and storage.
     */
    const clearSession = useCallback(() => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        setAuthError(null);
    }, []);

    /**
     * Handles user logout.
     */
    const logout = useCallback(async (isManual = false) => {
        setLoading(true);
        await authService.logoutUser(); // Call backend to invalidate session if needed
        clearSession();
        if (isManual) {
            showSuccess("You have been logged out successfully.");
        }
        setLoading(false);
    }, [clearSession, showSuccess]);

    /**
     * Handles user login.
     */
    const login = useCallback(async (email, password) => {
        setLoading(true);
        setAuthError(null);
        try {
            const responseData = await authService.loginUser(email, password);
            if (responseData?.user && responseData?.accessToken) {
                setupSession(responseData.user, responseData.accessToken);
                showSuccess("Login successful!");
                setLoading(false);
                return responseData;
            }
            throw new Error("Login failed: Invalid response from server.");
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unknown error occurred during login.";
            showError(errorMessage);
            clearSession();
            setLoading(false);
            throw err;
        }
    }, [setupSession, clearSession, showSuccess, showError]);

    /**
     * Handles new user registration.
     */
    const register = useCallback(async (userData) => {
        try {
            const registrationData = await authService.registerUser(userData);
            showSuccess("Registration successful! Please check your email to verify your account.");
            return registrationData;
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unknown error occurred during registration.";
            showError(errorMessage);
            throw err;
        }
    }, [showError, showSuccess]);

    /**
     * Effect to check authentication status on initial load.
     */
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            try {
                // Use the dedicated 'getMe' service to validate the token and get the user profile.
                const response = await authService.getMe();
                if (response?.user) {
                    // Re-setup session with fresh data from backend, using existing token.
                    setupSession(response.user, token);
                } else {
                    await logout();
                }
            } catch (error) {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                    // Token is invalid or expired.
                    showError("Your session has expired. Please log in again.");
                    await logout();
                } else {
                    // Handle other errors (e.g., network failure).
                    setAuthError("Could not verify session. Please check your connection.");
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, [logout, setupSession, showError]); // Dependencies

    // Memoize the context value for performance.
    const authContextValue = useMemo(() => ({
        user,
        isAuthenticated: !!user, // isAuthenticated is now a derived boolean.
        loading,
        authError,
        login,
        register,
        logout: () => logout(true), // manualLogout is now just logout(true)
        hasRole: (roleToCheck) => user?.role?.toLowerCase() === roleToCheck.toLowerCase(),
        hasAnyRole: (rolesArray) => rolesArray.some(role => user?.role?.toLowerCase() === role.toLowerCase()),
        isAdmin: user?.role?.toLowerCase() === USER_ROLES.ADMIN,
        isPropertyManager: user?.role?.toLowerCase() === USER_ROLES.PROPERTY_MANAGER,
        isLandlord: user?.role?.toLowerCase() === USER_ROLES.LANDLORD,
        isTenant: user?.role?.toLowerCase() === USER_ROLES.TENANT,
    }), [user, loading, authError, login, register, logout]);

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};