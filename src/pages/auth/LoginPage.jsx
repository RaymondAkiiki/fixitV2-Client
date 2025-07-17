// frontend/src/pages/Auth/LoginPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx";
import useForm from "../../hooks/useForm.js";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { ROUTES, USER_ROLES } from "../../utils/constants.js";
import frontendLogger from '../../utils/logger.js';

const validateLoginForm = (values) => {
    const errors = {};
    if (!values.email.trim()) {
        errors.email = "Email is required.";
        frontendLogger.debug('LoginPage: Validation error - email missing.');
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = "Please enter a valid email address.";
        frontendLogger.debug('LoginPage: Validation error - invalid email format.', { email: values.email });
    }
    if (!values.password.trim()) {
        errors.password = "Password is required.";
        frontendLogger.debug('LoginPage: Validation error - password missing.');
    } else if (values.password.length < 8) {
        errors.password = "Password must be at least 8 characters long.";
        frontendLogger.debug('LoginPage: Validation error - password too short.');
    }
    return errors;
};

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login: authLogin, user: authContextUser } = useAuth();
    const { showError } = useGlobalAlert();

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        frontendLogger.debug("LoginPage (Component Render): Current user from AuthContext:", {
            userId: authContextUser?.id, // Changed _id to id for consistency
            email: authContextUser?.email,
            isAuthenticated: authContextUser ? true : false // If authContextUser exists, isAuthenticated is true
        });
    }, [authContextUser]);

    const {
        values,
        errors,
        handleChange,
        handleSubmit,
        isSubmitting,
    } = useForm(
        { email: "", password: "" },
        validateLoginForm,
        async (formValues) => {
            frontendLogger.info('LoginPage: Handling login form submission.', { email: formValues.email });
            try {
                const loginResponse = await authLogin(formValues.email, formValues.password); // Renamed `user` to `loginResponse`
                const loggedInUser = loginResponse.user; // <--- This is the key change! Access the nested `user` object

                frontendLogger.debug("LoginPage (handleSubmit): Login successful, user object received.", {
                    userId: loggedInUser.id, // Changed _id to id for consistency
                    userRole: loggedInUser.role,
                    fromPath: location.state?.from,
                });

                const from = location.state?.from || ROUTES.HOME;

                switch (loggedInUser.role?.toLowerCase()) { // Use `loggedInUser.role`
                    case USER_ROLES.TENANT:
                        frontendLogger.info("LoginPage (Redirect): Navigating to Tenant Dashboard.");
                        navigate(from.startsWith(ROUTES.TENANT_BASE) ? from : ROUTES.TENANT_DASHBOARD, { replace: true });
                        break;
                    case USER_ROLES.LANDLORD:
                        frontendLogger.info("LoginPage (Redirect): Navigating to Landlord Dashboard.");
                        navigate(from.startsWith(ROUTES.LANDLORD_BASE) ? from : ROUTES.LANDLORD_DASHBOARD, { replace: true });
                        break;
                    case USER_ROLES.PROPERTY_MANAGER:
                        frontendLogger.info("LoginPage (Redirect): Navigating to Property Manager Dashboard.");
                        navigate(from.startsWith(ROUTES.PM_BASE) ? from : ROUTES.PM_DASHBOARD, { replace: true });
                        break;
                    case USER_ROLES.ADMIN:
                        frontendLogger.info("LoginPage (Redirect): Navigating to Admin Dashboard.");
                        navigate(from.startsWith(ROUTES.ADMIN_BASE) ? from : ROUTES.ADMIN_DASHBOARD, { replace: true });
                        break;
                    default:
                        frontendLogger.warn("LoginPage (Redirect): User role not recognized, navigating to default route.", { userRole: loggedInUser.role, fromPath: from });
                        navigate(from, { replace: true });
                        break;
                }

            } catch (err) {
                const errorMessage = typeof err === "string"
                    ? err
                    : err?.message || "Login failed. Please try again.";
                showError(errorMessage);
                frontendLogger.error("LoginPage: Login error during form submission.", {
                    email: formValues.email,
                    errorDetails: err.response?.data || err.message,
                    statusCode: err.response?.status
                });
            }
        }
    );

    return (
        <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100 text-center">
            <LogIn className="w-16 h-16 mx-auto text-green-700 mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600 mb-6">Sign in to your FixIt account.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <Input
                    label="Email Address"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    value={values.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    error={errors.email}
                    disabled={isSubmitting}
                />

                <div className="relative">
                    <Input
                        label="Password"
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={values.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        error={errors.password}
                        disabled={isSubmitting}
                        minLength={8}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
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
                            disabled={isSubmitting}
                        />
                        <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                            Remember Me
                        </label>
                    </div>
                    <Link
                        to={ROUTES.FORGOT_PASSWORD}
                        className="text-sm text-[#ffbd59] hover:underline font-medium"
                    >
                        Forgot Password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
            </form>

            <div className="flex justify-center mt-6">
                <p className="text-sm text-gray-600">
                    Don’t have an account?{" "}
                    <Link to={ROUTES.REGISTER} className="text-[#ffbd59] hover:underline font-medium">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;