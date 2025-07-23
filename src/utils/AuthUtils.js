/**
 * Utility functions for authentication flows
 */

import { ROUTES } from './constants';

/**
 * Determine the correct dashboard route based on user role
 * @param {Object} user - User object from auth context or API response
 * @param {string} defaultPath - Default path to use if no role-specific route exists
 * @returns {string} The appropriate dashboard route
 */
export const getDashboardByRole = (user, defaultPath = ROUTES.DASHBOARD) => {
  if (!user || !user.role) {
    return defaultPath;
  }

  const role = user.role.toLowerCase();
  
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_DASHBOARD;
    case 'tenant':
      return ROUTES.TENANT_DASHBOARD;
    case 'property_manager':
    case 'propertymanager':
      return ROUTES.PM_DASHBOARD;
    case 'landlord':
      return ROUTES.LANDLORD_DASHBOARD;
    default:
      return defaultPath;
  }
};

/**
 * Parse JWT token to get user information
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token:', e);
    return null;
  }
};

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
};

/**
 * Get the stored JWT token
 * @returns {string|null} The token or null if not found
 */
export const getStoredToken = () => {
  return localStorage.getItem('token');
};

/**
 * Set auth token in localStorage and axios headers
 * @param {string} token - JWT token
 * @param {Object} api - Axios instance
 */
export const setAuthToken = (token, api) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

/**
 * Clear all auth related data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default {
  getDashboardByRole,
  parseJwt,
  isTokenExpired,
  getStoredToken,
  setAuthToken,
  clearAuthData
};