// frontend/src/hooks/useAuth.js

// This hook provides convenient access to the authentication context.
// It's a wrapper around useContext(AuthContext) to enforce its usage within AuthProvider.

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx'; // Ensure .jsx extension for React components

/**
 * Custom hook to access the authentication context.
 * Throws an error if used outside of an AuthProvider.
 * @returns {object} The authentication context value (user, isAuthenticated, login, logout, register, loading, hasRole, hasAnyRole).
 */
const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        // This ensures the hook is only used within the AuthProvider's scope.
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

export default useAuth;

