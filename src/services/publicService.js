// client/src/services/publicService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'publicService';
const PUBLIC_BASE_URL = '/api/public'; // Updated to match backend route structure

/**
 * Get the CSRF token for use with public POST requests
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<string>} The CSRF token
 */
const getCsrfToken = async (signal) => {
  try {
    const res = await api.get(`${PUBLIC_BASE_URL}/csrf-token`, { signal });
    const response = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getCsrfToken', { success: true });
    
    return response.data?.csrfToken || res.data.csrfToken;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("Failed to get CSRF token:", error);
    throw new Error("Unable to secure the request. Please try again later.");
  }
};

/**
 * Verifies an invitation token (public access).
 * @param {string} token - The invite token to verify
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Returns invite details and validity information
 */
export const verifyInviteToken = async (token, signal) => {
  try {
    const res = await api.get(`${PUBLIC_BASE_URL}/invites/${token}/verify`, { signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'verifyInviteToken', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("verifyInviteToken error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to verify invitation token";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

/**
 * Accepts an invitation and creates/updates user account (public access).
 * @param {string} token - The invite token
 * @param {object} acceptData - Data for accepting invite
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Backend response including user details and token
 */
export const acceptInvite = async (token, acceptData, signal) => {
  try {
    // Get CSRF token for this secure operation
    const csrfToken = await getCsrfToken(signal);
    
    const res = await api.post(`${PUBLIC_BASE_URL}/invites/${token}/accept`, acceptData, {
      headers: {
        'X-CSRF-Token': csrfToken
      },
      signal
    });
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'acceptInvite', { success: true });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("acceptInvite error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to accept invitation";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

/**
 * Declines an invitation (public access).
 * @param {string} token - The invite token
 * @param {string} [reason=''] - Optional reason for declining
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Success message
 */
export const declineInvite = async (token, reason = '', signal) => {
  try {
    // Get CSRF token for this secure operation
    const csrfToken = await getCsrfToken(signal);
    
    const res = await api.post(`${PUBLIC_BASE_URL}/invites/${token}/decline`, 
      { reason }, 
      {
        headers: {
          'X-CSRF-Token': csrfToken
        },
        signal
      }
    );
    
    const response = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'declineInvite', response);
    
    return response.data || { success: true, message: 'Invitation declined successfully' };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("declineInvite error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to decline invitation";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

/**
 * Retrieves a public view of a maintenance request.
 * @param {string} publicToken - The public access token for the request
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Limited request details for public viewing
 */
export const getPublicRequestView = async (publicToken, signal) => {
  try {
    const res = await api.get(`${PUBLIC_BASE_URL}/requests/${publicToken}`, { signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getPublicRequestView', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("getPublicRequestView error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to retrieve public request";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

/**
 * Allows an external user (e.g., vendor) to update a maintenance request via public link.
 * @param {string} publicToken - The public access token
 * @param {object} updateData - Data to update
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Success message and updated request
 */
export const publicRequestUpdate = async (publicToken, updateData, mediaFiles = [], signal) => {
  try {
    // Get CSRF token for this secure operation
    const csrfToken = await getCsrfToken(signal);
    
    const formData = new FormData();
    
    // Add all update data to form
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        if (key === 'status') {
          formData.append(key, String(updateData[key]).toLowerCase());
        } else {
          formData.append(key, updateData[key]);
        }
      }
    });
    
    // Add media files if provided
    if (mediaFiles.length > 0) {
      mediaFiles.forEach(file => {
        formData.append('mediaFiles', file);
      });
    }

    const res = await api.post(
      `${PUBLIC_BASE_URL}/requests/${publicToken}/update`, 
      formData, 
      {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'X-CSRF-Token': csrfToken
        },
        signal
      }
    );
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'publicRequestUpdate', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("publicRequestUpdate error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to update public request";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

/**
 * Adds a comment to a public maintenance request.
 * @param {string} publicToken - The public access token
 * @param {object} commentData - Comment data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The created comment object
 */
export const addPublicCommentToRequest = async (publicToken, commentData, signal) => {
  try {
    // Get CSRF token for this secure operation
    const csrfToken = await getCsrfToken(signal);
    
    const res = await api.post(
      `${PUBLIC_BASE_URL}/requests/${publicToken}/comments`, 
      commentData, 
      {
        headers: {
          'X-CSRF-Token': csrfToken
        },
        signal
      }
    );
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'addPublicCommentToRequest', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("addPublicCommentToRequest error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to add comment to public request";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

/**
 * Retrieves a public view of a scheduled maintenance task.
 * @param {string} publicToken - The public access token for the scheduled maintenance task
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Limited task details for public viewing
 */
export const getPublicScheduledMaintenanceView = async (publicToken, signal) => {
  try {
    const res = await api.get(`${PUBLIC_BASE_URL}/scheduled-maintenances/${publicToken}`, { signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getPublicScheduledMaintenanceView', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("getPublicScheduledMaintenanceView error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to retrieve public scheduled maintenance";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

/**
 * Allows an external user (e.g., vendor) to update a scheduled maintenance task via public link.
 * @param {string} publicToken - The public access token
 * @param {object} updateData - Data to update
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Success message and updated maintenance task
 */
export const publicScheduledMaintenanceUpdate = async (publicToken, updateData, mediaFiles = [], signal) => {
  try {
    // Get CSRF token for this secure operation
    const csrfToken = await getCsrfToken(signal);
    
    const formData = new FormData();
    
    // Add all update data to form
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        if (key === 'status') {
          formData.append(key, String(updateData[key]).toLowerCase());
        } else {
          formData.append(key, updateData[key]);
        }
      }
    });
    
    // Add media files if provided
    if (mediaFiles.length > 0) {
      mediaFiles.forEach(file => {
        formData.append('mediaFiles', file);
      });
    }

    const res = await api.post(
      `${PUBLIC_BASE_URL}/scheduled-maintenances/${publicToken}/update`, 
      formData, 
      {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'X-CSRF-Token': csrfToken
        },
        signal
      }
    );
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'publicScheduledMaintenanceUpdate', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("publicScheduledMaintenanceUpdate error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to update public scheduled maintenance";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

/**
 * Adds a comment to a public scheduled maintenance task.
 * @param {string} publicToken - The public access token
 * @param {object} commentData - Comment data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The created comment object
 */
export const addPublicCommentToScheduledMaintenance = async (publicToken, commentData, signal) => {
  try {
    // Get CSRF token for this secure operation
    const csrfToken = await getCsrfToken(signal);
    
    const res = await api.post(
      `${PUBLIC_BASE_URL}/scheduled-maintenances/${publicToken}/comments`, 
      commentData, 
      {
        headers: {
          'X-CSRF-Token': csrfToken
        },
        signal
      }
    );
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'addPublicCommentToScheduledMaintenance', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    
    console.error("addPublicCommentToScheduledMaintenance error:", error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to add comment to public scheduled maintenance";
    
    const statusCode = error.response?.status;
    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    
    throw enhancedError;
  }
};

// Export all functions as a default object
export default {
  verifyInviteToken,
  acceptInvite,
  declineInvite,
  getPublicRequestView,
  publicRequestUpdate,
  addPublicCommentToRequest,
  getPublicScheduledMaintenanceView,
  publicScheduledMaintenanceUpdate,
  addPublicCommentToScheduledMaintenance
};