// frontend/src/services/authService.js

import api from "../api/axios"; // Import the configured Axios instance

/**
 * Validates the current JWT token with the backend.
 * This will use the Axios interceptor to automatically attach the token.
 * @returns {Promise<object>} Returns { user: object, message: string } if valid, throws on error.
 */
export const validateToken = async () => {
    try {
        const res = await api.get("/auth/profile"); // Changed to /auth/profile based on backend's getMe route
        // Backend's getMe returns: id, email, role, propertiesManaged, propertiesOwned, tenancies
        return { user: res.data, message: "Token is valid." }; // Wrap user data and message
    } catch (error) {
        console.error("validateToken error:", error.response?.data || error.message);
        throw error; // Re-throw to be caught by AuthContext
    }
};

/**
 * Sends login credentials to the backend.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} Returns user data and token from backend.
 * Expected: { _id, name, email, role, approved, token, ...associations }
 */
export const loginUser = async (email, password) => {
    try {
        const res = await api.post("/auth/login", { email, password });
        return res.data; // This data includes the token that AuthContext needs
    } catch (error) {
        console.error("loginUser error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Registers a new user with the backend.
 * @param {object} userData - User registration details: { name, email, password, role }.
 * @returns {Promise<object>} Returns user data and token from backend.
 * Expected: { _id, name, email, role, token, ... }
 */
export const registerUser = async (userData) => {
    try {
        const res = await api.post("/auth/register", userData);
        return res.data;
    } catch (error) {
        console.error("registerUser error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Requests a password reset link for the given email.
 * @param {string} email - Email for which to reset password.
 * @returns {Promise<object>} Backend response message.
 */
export const requestPasswordReset = async (email) => {
    try {
        const res = await api.post("/auth/forgot-password", { email });
        return res.data;
    } catch (error) {
        console.error("requestPasswordReset error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Resets the user's password using a reset token.
 * @param {string} token - The password reset token received via email.
 * @param {string} newPassword - The new password.
 * @returns {Promise<object>} Backend response message.
 */
export const resetPassword = async (token, newPassword) => {
    try {
        const res = await api.post("/auth/reset-password", { token, newPassword });
        return res.data;
    } catch (error) {
        console.error("resetPassword error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Changes the logged-in user's password.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The desired new password.
 * @returns {Promise<object>} Backend response message.
 */
export const changePassword = async (currentPassword, newPassword) => {
    try {
        const res = await api.post("/auth/change-password", { currentPassword, newPassword });
        return res.data;
    } catch (error) {
        console.error("changePassword error:", error.response?.data || error.message);
        throw error;
    }
};