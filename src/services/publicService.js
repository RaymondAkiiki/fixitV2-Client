// client/src/services/publicService.js

import api from "../api/axios.js";

// Note: Public routes typically don't require authentication,
// but they still use the 'api' instance which has a baseURL.
// Ensure your backend's public routes are correctly configured
// to bypass authentication middleware.

const PUBLIC_BASE_URL = '/public'; // Base path for public routes

/**
 * Verifies an invitation token (public access).
 * @param {string} token - The invite token to verify.
 * @returns {Promise<object>} Returns a success message or error.
 */
export const verifyInviteToken = async (token) => {
    try {
        const res = await api.get(`${PUBLIC_BASE_URL}/invites/${token}/verify`); // Corrected endpoint
        return res.data;
    } catch (error) {
        console.error("verifyInviteToken error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Accepts an invitation and creates/updates user account (public access).
 * @param {string} token - The invite token.
 * @param {object} acceptData - Data for accepting invite: { email, password, firstName, lastName, confirmPassword }.
 * @returns {Promise<object>} Backend response including user details and potentially a new token.
 */
export const acceptInvite = async (token, acceptData) => {
    try {
        const res = await api.post(`${PUBLIC_BASE_URL}/invites/${token}/accept`, acceptData); // Corrected endpoint
        return res.data;
    } catch (error) {
        console.error("acceptInvite error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Declines an invitation (public access).
 * @param {string} token - The invite token.
 * @param {string} [reason] - Optional reason for declining.
 * @returns {Promise<object>} Success message.
 */
export const declineInvite = async (token, reason = '') => {
    try {
        const res = await api.post(`${PUBLIC_BASE_URL}/invites/${token}/decline`, { reason });
        return res.data;
    } catch (error) {
        console.error("declineInvite error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a public view of a maintenance request.
 * @param {string} publicToken - The public access token for the request.
 * @returns {Promise<object>} Limited request details for public viewing.
 */
export const getPublicRequestView = async (publicToken) => {
    try {
        const res = await api.get(`${PUBLIC_BASE_URL}/requests/${publicToken}`);
        return res.data;
    } catch (error) {
        console.error("getPublicRequestView error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Allows an external user (e.g., vendor) to update a maintenance request via public link.
 * @param {string} publicToken - The public access token.
 * @param {object} updateData - Data to update: { status, commentMessage, name, phone }.
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload.
 * @returns {Promise<object>} Success message.
 */
export const publicRequestUpdate = async (publicToken, updateData, mediaFiles = []) => {
    try {
        const formData = new FormData();
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && updateData[key] !== null) {
                if (key === 'status') {
                    formData.append(key, String(updateData[key]).toLowerCase());
                } else {
                    formData.append(key, updateData[key]);
                }
            }
        });
        mediaFiles.forEach(file => {
            formData.append('mediaFiles', file); // 'mediaFiles' must match multer field name
        });

        const res = await api.post(`${PUBLIC_BASE_URL}/requests/${publicToken}/update`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("publicRequestUpdate error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Adds a comment to a public maintenance request.
 * @param {string} publicToken - The public access token.
 * @param {object} commentData - Comment data: { message, externalUserName, externalUserEmail }.
 * @returns {Promise<object>} The created comment object.
 */
export const addPublicCommentToRequest = async (publicToken, commentData) => {
    try {
        const res = await api.post(`${PUBLIC_BASE_URL}/requests/${publicToken}/comments`, commentData);
        return res.data;
    } catch (error) {
        console.error("addPublicCommentToRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a public view of a scheduled maintenance task.
 * @param {string} publicToken - The public access token for the scheduled maintenance task.
 * @returns {Promise<object>} Limited task details for public viewing.
 */
export const getPublicScheduledMaintenanceView = async (publicToken) => {
    try {
        const res = await api.get(`${PUBLIC_BASE_URL}/scheduled-maintenance/${publicToken}`);
        return res.data;
    } catch (error) {
        console.error("getPublicScheduledMaintenanceView error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Allows an external user (e.g., vendor) to update a scheduled maintenance task via public link.
 * @param {string} publicToken - The public access token.
 * @param {object} updateData - Data to update: { status, commentMessage, name, phone }.
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload.
 * @returns {Promise<object>} Success message.
 */
export const publicScheduledMaintenanceUpdate = async (publicToken, updateData, mediaFiles = []) => {
    try {
        const formData = new FormData();
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && updateData[key] !== null) {
                if (key === 'status') {
                    formData.append(key, String(updateData[key]).toLowerCase());
                } else {
                    formData.append(key, updateData[key]);
                }
            }
        });
        mediaFiles.forEach(file => {
            formData.append('mediaFiles', file); // 'mediaFiles' must match multer field name
        });

        const res = await api.post(`${PUBLIC_BASE_URL}/scheduled-maintenance/${publicToken}/update`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("publicScheduledMaintenanceUpdate error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Adds a comment to a public scheduled maintenance task.
 * @param {string} publicToken - The public access token.
 * @param {object} commentData - Comment data: { message, externalUserName, externalUserEmail }.
 * @returns {Promise<object>} The created comment object.
 */
export const addPublicCommentToScheduledMaintenance = async (publicToken, commentData) => {
    try {
        const res = await api.post(`${PUBLIC_BASE_URL}/scheduled-maintenance/${publicToken}/comments`, commentData);
        return res.data;
    } catch (error) {
        console.error("addPublicCommentToScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};