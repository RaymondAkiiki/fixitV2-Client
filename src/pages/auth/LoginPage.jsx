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
        case "propertymanager":
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
