// src/hooks/useRoleBasedPath.js

import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/constants';

/**
 * Custom hook to get role-based paths for navigation
 * Automatically determines the current base path (e.g., /admin, /pm, /landlord, /tenant)
 * and provides methods to generate correct paths for shared components
 */
const useRoleBasedPath = () => {
  const { pathname } = useLocation();
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

  /**
   * Generates a path with the correct base URL prefix
   * @param {string} path - The path without the base prefix (e.g., "vendors/add")
   * @returns {string} - Complete path with base prefix (e.g., "/pm/vendors/add")
   */
  const getPath = useCallback((path) => {
    const base = getBasePath();
    // Ensure path doesn't start with a slash to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${base}/${cleanPath}`;
  }, [getBasePath]);

  return {
    basePath: getBasePath(),
    getPath
  };
};

export default useRoleBasedPath;