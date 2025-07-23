// client/src/services/authService.js

import api from '../api/axios';
import axios from 'axios';
import { extractApiResponse, logApiResponse } from '../utils/apiUtils.js';

const SERVICE_NAME = 'authService';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.email - Email address
 * @param {string} userData.phone - Phone number
 * @param {string} userData.password - Password
 * @param {string} [userData.role] - Optional role
 * @returns {Promise<Object>} Registration response
 */
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    const { data, meta } = extractApiResponse(response.data);
    
    logApiResponse(SERVICE_NAME, 'registerUser', { 
      email: userData.email,
      success: meta.success
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Registration successful',
      user: data?.user || data || null
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Log in a user with email and password
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<Object>} Login response with user and token
 */
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { data, meta } = extractApiResponse(response.data);
    
    // Extract user and token from response
    const user = data?.user || null;
    const accessToken = data?.accessToken || response.data?.accessToken;
    
    // Store token in localStorage
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    
    logApiResponse(SERVICE_NAME, 'loginUser', { 
      email,
      success: meta.success,
      hasToken: !!accessToken
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Login successful',
      user,
      accessToken
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Login or register with Google
 * @param {string} credential - Google JWT credential (ID token)
 * @returns {Promise<Object>} Login response with user and token
 */
export const loginWithGoogle = async (credential) => {
  try {
    const response = await api.post('/auth/google', { idToken: credential });
    const { data, meta } = extractApiResponse(response.data);
    
    // Extract user and token from response
    const user = data?.user || null;
    const accessToken = data?.accessToken || response.data?.accessToken;
    
    // Store token in localStorage
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    
    logApiResponse(SERVICE_NAME, 'loginWithGoogle', { 
      success: meta.success,
      hasToken: !!accessToken
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Google login successful',
      user,
      accessToken
    };
  } catch (error) {
    console.error('Google login error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get the current authenticated user's profile
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel request
 * @returns {Promise<Object>} User data
 */
export const getMe = async (signal) => {
  try {
    const response = await api.get('/auth/me', { signal });
    const { data, meta } = extractApiResponse(response.data);
    
    logApiResponse(SERVICE_NAME, 'getMe', { 
      success: meta.success
    });
    
    return {
      success: meta.success,
      user: data?.user || data || null
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    console.error('Get profile error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Log out the current user
 * @returns {Promise<Object>} Logout response
 */
export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    const { meta } = extractApiResponse(response.data);
    
    // Clear token from localStorage regardless of response
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    
    logApiResponse(SERVICE_NAME, 'logoutUser', { 
      success: meta.success
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Logout successful'
    };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear token even if API call fails
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Change password for authenticated user
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Response
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    const { meta } = extractApiResponse(response.data);
    
    logApiResponse(SERVICE_NAME, 'changePassword', { 
      success: meta.success
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Password changed successfully'
    };
  } catch (error) {
    console.error('Change password error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Request password reset email
 * @param {string} email - Email address
 * @returns {Promise<Object>} Response
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    const { meta } = extractApiResponse(response.data);
    
    logApiResponse(SERVICE_NAME, 'forgotPassword', { 
      email,
      success: meta.success
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Password reset instructions sent to your email'
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Response
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.put(`/auth/reset-password/${token}`, { newPassword });
    const { meta } = extractApiResponse(response.data);
    
    logApiResponse(SERVICE_NAME, 'resetPassword', { 
      tokenPrefix: token.substring(0, 4) + '...', // For privacy, only log prefix
      success: meta.success
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Password reset successful'
    };
  } catch (error) {
    console.error('Reset password error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Verify email with token
 * @param {string} token - Email verification token
 * @returns {Promise<Object>} Response
 */
export const verifyEmail = async (token) => {
  try {
    const response = await api.get(`/auth/verify-email/${token}`);
    const { meta } = extractApiResponse(response.data);
    
    logApiResponse(SERVICE_NAME, 'verifyEmail', { 
      tokenPrefix: token.substring(0, 4) + '...', // For privacy, only log prefix
      success: meta.success
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Email verified successfully'
    };
  } catch (error) {
    console.error('Email verification error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Request email verification
 * @param {string} [email] - Email address (optional if authenticated)
 * @returns {Promise<Object>} Response
 */
export const sendVerificationEmail = async (email) => {
  try {
    const response = await api.post('/auth/send-verification-email', { email });
    const { meta } = extractApiResponse(response.data);
    
    logApiResponse(SERVICE_NAME, 'sendVerificationEmail', { 
      email: email || 'current user',
      success: meta.success
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Verification email sent'
    };
  } catch (error) {
    console.error('Send verification email error:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Initialize Google Sign-In using Google Identity Services (newer approach)
 * @returns {Promise<boolean>} Success status
 */
export const initGoogleAuth = async () => {
  logApiResponse(SERVICE_NAME, 'initGoogleAuth', { start: true });
  
  return new Promise((resolve, reject) => {
    // Check if Google Identity Services script is already loaded
    if (window.google?.accounts) {
      initializeGoogleIdentity(resolve, reject);
      return;
    }
    
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => initializeGoogleIdentity(resolve, reject);
    script.onerror = (err) => {
      const errorMessage = 'Failed to load Google Identity Services: ' + (err || 'unknown error');
      logApiResponse(SERVICE_NAME, 'initGoogleAuth', { error: errorMessage });
      reject(new Error(errorMessage));
    };
    document.head.appendChild(script);
  });
};

/**
 * Helper function to initialize Google Identity Services
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
const initializeGoogleIdentity = (resolve, reject) => {
  try {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      const errorMessage = 'Google Client ID not configured';
      logApiResponse(SERVICE_NAME, 'initializeGoogleIdentity', { error: errorMessage });
      reject(new Error(errorMessage));
      return;
    }

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: null, // We'll handle this in the component
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    logApiResponse(SERVICE_NAME, 'initializeGoogleIdentity', { success: true });
    resolve(true);
  } catch (err) {
    logApiResponse(SERVICE_NAME, 'initializeGoogleIdentity', { error: err.message });
    reject(err);
  }
};

/**
 * Handle Google Sign-In response (for use with Google Identity Services)
 * @param {Object} response - Google credential response
 * @returns {Promise<Object>} Login response
 */
export const handleGoogleSignIn = async (response) => {
  try {
    // The response.credential contains the JWT token
    const result = await loginWithGoogle(response.credential);
    return result;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Trigger Google One Tap login
 * @param {Function} callback - Callback function to handle the response
 */
export const triggerGoogleOneTap = (callback) => {
  if (!window.google?.accounts) {
    console.error('Google Identity Services not loaded');
    return;
  }

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID not configured');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: callback,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      console.log('One Tap was not displayed or was skipped');
    }
  });
};

/**
 * Show Google Sign-In popup
 * @returns {Promise<Object>} Google credential response
 */
export const showGoogleSignInPopup = async () => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID not configured'));
      return;
    }

    // Initialize with callback
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          resolve(response);
        } else {
          reject(new Error('No credential received from Google'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Show the One Tap dialog
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        // Fallback to popup if One Tap is not available
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
              // Convert access token to ID token by making a request to Google
              getUserInfoFromAccessToken(tokenResponse.access_token)
                .then(userInfo => resolve({ credential: null, userInfo, accessToken: tokenResponse.access_token }))
                .catch(reject);
            } else {
              reject(new Error('No access token received'));
            }
          },
        });
        client.requestAccessToken();
      } else if (notification.isSkippedMoment()) {
        reject(new Error('User skipped the sign-in'));
      }
    });
  });
};

/**
 * Get user info from Google access token
 * @param {string} accessToken - Google access token
 * @returns {Promise<Object>} User information
 */
const getUserInfoFromAccessToken = async (accessToken) => {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};

export default {
  registerUser,
  loginUser,
  loginWithGoogle,
  getMe,
  logoutUser,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
  initGoogleAuth,
  handleGoogleSignIn,
  triggerGoogleOneTap,
  showGoogleSignInPopup
};