
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



// frontend/src/pages/auth/LoginPage.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { LogIn, Eye, EyeOff } from 'lucide-react'; // Icons for login and password toggle

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth(); // Renamed to avoid conflict with local variable

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Helper for input change handlers
  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError(""); // Clear error when user starts typing
  };

  // Simple client-side validation
  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return false;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) { // Increased minLength for stronger passwords
      setError("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Pass email and password directly to auth context's login
      const user = await authLogin(email, password);

      // Redirect based on the authenticated user's role
      switch (user.role) {
        case "tenant":
          navigate("/tenant", { replace: true }); // Using /tenant as base route
          break;
        case "landlord":
          navigate("/landlord", { replace: true }); // Landlords typically use PM dashboard or a dedicated one
          break;
        case "propertyManager":
          navigate("/pm", { replace: true });
          break;
        case "admin":
          navigate("/admin", { replace: true }); 
          break;
        default:
          navigate("/", { replace: true }); // Fallback
          break;
      }

    } catch (err) {
      console.error("Login error:", err);
      const apiMsg = err.response?.data?.message;
      if (err.response?.status === 401) {
        setError(apiMsg || "Invalid email or password. Please check your credentials.");
      } else if (err.response?.status === 403) {
        setError(apiMsg || "Your account is pending approval or is not active. Please contact support.");
      }
      else if (err.response?.status === 500) {
        setError(apiMsg || "Server error. Please try again later.");
      } else {
        setError(apiMsg || "Unable to connect. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100 text-center">
      <LogIn className="w-16 h-16 mx-auto text-green-700 mb-4" />
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back!</h2>
      <p className="text-gray-600 mb-6">Sign in to your FixIt account.</p>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError("")}
          className="mb-4"
        />
      )}

      <form onSubmit={handleLogin} className="mt-8 space-y-6">
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={handleChange(setEmail)}
          placeholder="Enter your email"
          required
          error={error} // Use the general error state for input feedback
          disabled={loading}
        />

        <div className="relative">
          <Input
            label="Password"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={handleChange(setPassword)}
            placeholder="Enter your password"
            required
            error={error}
            disabled={loading}
            minLength={8} // Reflect client-side validation rule
            className="pr-10" // Add padding for the toggle button
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1} // Prevent tabbing to this button
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-[#219377] focus:ring-[#219377] border-gray-300 rounded-md"
              disabled={loading}
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
              Remember Me
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm text-[#ffbd59] hover:underline font-medium"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={loading}
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="flex justify-center mt-6">
        <p className="text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/register" className="text-[#ffbd59] hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  
  );
};

export default LoginPage;
