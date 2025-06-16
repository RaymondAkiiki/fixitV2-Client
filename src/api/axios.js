// frontend/src/api/axios.js

import axios from "axios";

/**
 * Helper to get the current user object from localStorage.
 * This user object should ideally contain role and other non-sensitive profile data.
 */
const getUserFromLocalStorage = () => {
    try {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem("user"); // Clear potentially corrupted data
        return null;
    }
};

/**
 * Helper to get the JWT token from localStorage.
 */
const getTokenFromLocalStorage = () => {
    try {
        return localStorage.getItem("token");
    } catch (error) {
        console.error("Error retrieving token from localStorage:", error);
        localStorage.removeItem("token"); // Clear potentially corrupted data
        return null;
    }
};

/**
 * Create an Axios instance for all API requests.
 * `baseURL` is set from your VITE environment variable.
 * `withCredentials: false` is standard for JWT in headers (set to true if using cookies/sessions).
 */
const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_API_URL}/api`, // Use VITE_BACKEND_API_URL for backend
    withCredentials: false, // JWTs are typically sent in headers, not cookies
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request Interceptor:
 * - Attaches JWT token to every request in the Authorization header.
 * - For admin users, if a static admin token is provided in env, uses that token (for "system admin" use case).
 * - For other users (tenant, landlord, property manager), uses their own token from localStorage.
 * - This ensures the correct token is always sent for the currently logged-in user.
 */
api.interceptors.request.use(
    (config) => {
        const user = getUserFromLocalStorage();
        let token = getTokenFromLocalStorage();

        // Priority 1: If user is admin AND VITE_ADMIN_TOKEN is set, use the static admin token
        if (user && user.role === "admin" && import.meta.env.VITE_ADMIN_TOKEN) {
            token = import.meta.env.VITE_ADMIN_TOKEN;
        }

        // Priority 2: Use the token retrieved from localStorage if it exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * - Handles global API errors, specifically 401 Unauthorized responses.
 * - If a 401 is received, it means the token is expired or invalid.
 * - It clears token and user from localStorage and redirects to login page.
 * - This keeps your app secure and ensures users are re-authenticated if the token expires or is invalid.
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Access a global alert context if you want to display a message,
        // but it's not directly accessible here.
        // For a full-fledged solution, you might wrap Axios calls in a custom hook
        // that has access to the context, or dispatch global events.
        // For now, we'll use window.location.href which works outside React context.

        if (error.response?.status === 401) {
            console.warn("Unauthorized API call, session expired or invalid. Logging out.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Redirect to login page
            // Using window.location.href forces a full page reload, clearing all React state.
            // This is often desired for security on token expiry.
            window.location.href = "/login";
            // You can add a transient message to localStorage here to be picked up by login page
            localStorage.setItem('authError', 'Session expired or invalid. Please log in again.');
        }
        return Promise.reject(error); // Re-throw the error so it can be caught by individual API calls
    }
);

export default api;

