// src/contexts/RouteContext.jsx
import React, { createContext, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { USER_ROLES } from '../utils/constants';

// Create context
const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine base path from current URL or fallback to user role
  const getBasePath = useCallback(() => {
    // First try to extract from current URL path
    const pathParts = pathname.split('/');
    if (pathParts.length > 1) {
      const firstSegment = pathParts[1].toLowerCase();
      if (['admin', 'pm', 'landlord', 'tenant'].includes(firstSegment)) {
        return `/${firstSegment}`;
      }
    }

    // Fallback to user role if URL doesn't have a valid base path
    if (user?.role) {
      switch(user.role.toLowerCase()) {
        case USER_ROLES.ADMIN:
          return '/admin';
        case USER_ROLES.PROPERTY_MANAGER:
          return '/pm';
        case USER_ROLES.LANDLORD:
          return '/landlord';
        case USER_ROLES.TENANT:
          return '/tenant';
        default:
          return '';
      }
    }

    return '';
  }, [pathname, user?.role]);

  // Enhanced navigation function that automatically adds the base path
  const navigateTo = useCallback((path, options) => {
    const base = getBasePath();
    // Ensure path doesn't start with a slash to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const fullPath = `${base}/${cleanPath}`;
    navigate(fullPath, options);
  }, [getBasePath, navigate]);

  // Create context value
  const contextValue = {
    basePath: getBasePath(),
    navigateTo,
    getFullPath: (path) => {
      const base = getBasePath();
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      return `${base}/${cleanPath}`;
    }
  };

  return (
    <RouteContext.Provider value={contextValue}>
      {children}
    </RouteContext.Provider>
  );
};

// Custom hook to use the route context
export const useRouteContext = () => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRouteContext must be used within a RouteProvider');
  }
  return context;
};