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