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

    const clearSession = useCallback(() => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        setAuthError(null);
    }, []);

    const setupSession = useCallback((backendUser, accessToken) => {
        setUser(backendUser);
        localStorage.setItem("user", JSON.stringify(backendUser));
        localStorage.setItem("token", accessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }, []);

    const logout = useCallback(async (isManual = false) => {
        try {
            await authService.logoutUser();
        } catch (error) {
            console.error("Logout API error:", error);
            // Continue with local logout even if API call fails
        }
        
        clearSession();
        
        if (isManual) {
            showSuccess("You have been logged out successfully.");
        }
    }, [clearSession, showSuccess]);

    const manualLogout = useCallback(() => {
        logout(true);
    }, [logout]);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setAuthError(null);
        try {
            const responseData = await authService.loginUser(email, password);
            if (responseData?.user && responseData?.accessToken) {
                setupSession(responseData.user, responseData.accessToken);
                showSuccess("Login successful!");
                return responseData;
            }
            throw new Error("Login failed: Invalid response from server.");
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred during login.";
            showError(errorMessage);
            clearSession();
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setupSession, clearSession, showSuccess, showError]);

    const register = useCallback(async (userData) => {
        try {
            const registrationData = await authService.registerUser(userData);
            showSuccess("Registration successful! Please check your email to verify your account.");
            return registrationData;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred during registration.";
            showError(errorMessage);
            throw err;
        }
    }, [showError, showSuccess]);

    // New method for Google Authentication
    const loginWithGoogle = useCallback(async (idToken) => {
        setLoading(true);
        setAuthError(null);
        try {
            const responseData = await authService.loginWithGoogle(idToken);
            if (responseData?.user && responseData?.accessToken) {
                setupSession(responseData.user, responseData.accessToken);
                showSuccess(responseData.message || "Google login successful!");
                return responseData;
            }
            throw new Error("Google login failed: Invalid response from server.");
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred during Google login.";
            showError(errorMessage);
            clearSession();
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setupSession, clearSession, showSuccess, showError]);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            try {
                const response = await authService.getMe();
                if (response?.user) {
                    setupSession(response.user, token);
                } else {
                    await logout();
                }
            } catch (error) {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                    showError("Your session has expired. Please log in again.");
                    await logout();
                } else if (error.code !== 'ERR_CANCELED') {
                    setAuthError("Could not verify session. Please check your connection.");
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
        // This effect should only run ONCE on mount.
        // We disable the exhaustive-deps rule because we are intentionally
        // referencing functions defined outside that should not trigger a re-run.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const authContextValue = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        loading,
        authError,
        login,
        register,
        logout: manualLogout,
        loginWithGoogle, // Added Google login method to context
        hasRole: (roleToCheck) => user?.role?.toLowerCase() === roleToCheck.toLowerCase(),
        hasAnyRole: (rolesArray) => rolesArray.some(role => user?.role?.toLowerCase() === role.toLowerCase()),
        isAdmin: user?.role?.toLowerCase() === USER_ROLES.ADMIN,
        isPropertyManager: user?.role?.toLowerCase() === USER_ROLES.PROPERTY_MANAGER,
        isLandlord: user?.role?.toLowerCase() === USER_ROLES.LANDLORD,
        isTenant: user?.role?.toLowerCase() === USER_ROLES.TENANT,
    }), [user, loading, authError, login, register, manualLogout, loginWithGoogle]); // Added loginWithGoogle to dependencies

    return (
        <AuthContext.Provider value={authContextValue}>
            {!loading ? children : <div className="flex items-center justify-center h-screen w-full">Loading Application...</div>}
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