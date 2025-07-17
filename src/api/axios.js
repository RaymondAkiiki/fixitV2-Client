import axios from "axios";

/**
 * Helper to get the JWT token from localStorage.
 */
const getTokenFromLocalStorage = () => {
    try {
        return localStorage.getItem("token");
    } catch (error) {
        console.error("Error retrieving token from localStorage:", error);
        localStorage.removeItem("token");
        return null;
    }
};

/**
 * Create an Axios instance for all API requests.
 */
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
    withCredentials: false,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request Interceptor:
 * - Attaches JWT token to every request in the Authorization header.
 */
api.interceptors.request.use(
    (config) => {
        const token = getTokenFromLocalStorage();
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
 * - We DO NOT forcibly redirect or clear storage here—leave that to React context.
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Just propagate the error, let AuthContext handle session/logout logic
        return Promise.reject(error);
    }
);

export default api;