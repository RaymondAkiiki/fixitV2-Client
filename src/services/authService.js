import api from "../api/axios.js";

/**
 * Sends login credentials to the backend.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} The response data from the API.
 */
export const loginUser = async (email, password) => {
    try {
        const res = await api.post("/auth/login", { email, password });
        return res.data;
    } catch (error) {
        throw error; // Let the calling component handle the error
    }
};

/**
 * Registers a new user with the backend.
 * @param {object} userData - The user's registration details.
 * @returns {Promise<object>} The response data from the API.
 */
export const registerUser = async (userData) => {
    try {
        const res = await api.post("/auth/register", userData);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Gets the profile of the currently authenticated user from their token.
 * This is the primary method for validating a session.
 * @returns {Promise<object>} The response data from the API, containing the user profile.
 */
export const getMe = async () => {
    try {
        // This endpoint is more standard for getting the current user from a token.
        // Ensure your backend has a route like GET /api/auth/me that is protected.
        const res = await api.get("/auth/me");
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Logs out the current user by calling the backend endpoint.
 * @returns {Promise<object>} The response data from the API.
 */
export const logoutUser = async () => {
    try {
        const res = await api.post("/auth/logout");
        return res.data;
    } catch (error) {
        // Logout can fail if the token is already expired, but we still want to clear the frontend.
        // We can ignore the error here or log it, but we shouldn't block the logout process.
        console.warn("Logout API call failed, but proceeding with client-side logout.", error.message);
        return { success: true, message: "Logged out from client." };
    }
};

/**
 * Requests a password reset link for the given email.
 * @param {string} email - The user's email.
 * @returns {Promise<object>} The response data from the API.
 */
export const requestPasswordReset = async (email) => {
    try {
        const res = await api.post("/auth/forgot-password", { email });
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Resets the user's password using a reset token.
 * @param {string} token - The password reset token from the URL.
 * @param {string} newPassword - The new password.
 * @returns {Promise<object>} The response data from the API.
 */
export const resetPassword = async (token, newPassword) => {
    try {
        const res = await api.put(`/auth/reset-password/${token}`, { newPassword });
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Requests a new email verification link.
 * @returns {Promise<object>} The response data from the API.
 */
export const sendVerificationEmail = async () => {
    try {
        const res = await api.post("/auth/send-verification-email");
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Verifies a user's email using a verification token.
 * @param {string} token - The email verification token from the URL.
 * @returns {Promise<object>} The response data from the API.
 */
export const verifyEmail = async (token) => {
    try {
        const res = await api.get(`/auth/verify-email/${token}`);
        return res.data;
    } catch (error) {
        throw error;
    }
};