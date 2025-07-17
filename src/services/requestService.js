// client/src/services/requestService.js

import api from "../api/axios.js";

const REQUEST_BASE_URL = '/requests';

/**
 * Retrieves all maintenance requests accessible to the authenticated user, with filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., status, category, priority, propertyId, unitId, search, startDate, endDate, assignedToId, assignedToType, page, limit).
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object[]>} An array of request objects.
 */
export const getAllRequests = async (params = {}, signal) => {
    try {
        const res = await api.get(REQUEST_BASE_URL, { params, signal }); // This now handles all filtering
        return res.data;
    } catch (error) {
        console.error("getAllRequests error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific maintenance request.
 * @param {string} id - The ID of the request.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The request object.
 */
export const getRequestById = async (id, signal) => {
    try {
        const res = await api.get(`${REQUEST_BASE_URL}/${id}`, { signal });
        return res.data;
    } catch (error) {
        console.error("getRequestById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new maintenance request.
 * @param {object} requestData - Request details: { title, description, category, priority, propertyId, unitId }.
 * @param {File[]} [files=[]] - Optional array of File objects for media upload. (Backend expects 'files')
 * @returns {Promise<object>} The created request object.
 */
export const createRequest = async (requestData, files = []) => {
    try {
        const formData = new FormData();
        // Append all text fields
        Object.keys(requestData).forEach(key => {
            if (requestData[key] !== undefined && requestData[key] !== null) {
                // Ensure enum values are lowercase for backend
                if (['category', 'priority'].includes(key)) {
                    formData.append(key, String(requestData[key]).toLowerCase());
                } else {
                    formData.append(key, requestData[key]);
                }
            }
        });
        // Append media files
        files.forEach(file => {
            formData.append('files', file); // Corrected to 'files' to match backend multer field name
        });

        // Axios automatically sets Content-Type to multipart/form-data for FormData
        const res = await api.post(REQUEST_BASE_URL, formData);
        return res.data;
    } catch (error) {
        console.error("createRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific maintenance request.
 * @param {string} id - The ID of the request to update.
 * @param {object} updates - Data to update (e.g., title, description, category, priority, status).
 * @returns {Promise<object>} The updated request object.
 */
export const updateRequest = async (id, updates) => {
    try {
        // Ensure enum values are lowercase for backend
        const payload = { ...updates };
        if (payload.category) payload.category = payload.category.toLowerCase();
        if (payload.priority) payload.priority = payload.priority.toLowerCase();
        if (payload.status) payload.status = payload.status.toLowerCase();

        const res = await api.put(`${REQUEST_BASE_URL}/${id}`, payload);
        return res.data;
    } catch (error) {
        console.error("updateRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a request to a user (internal staff) or a vendor.
 * @param {string} id - The ID of the request.
 * @param {object} assignmentData - Data: { assignedToId: string, assignedToModel: 'User' | 'Vendor' }.
 * @returns {Promise<object>} The updated request object.
 */
export const assignRequest = async (id, assignmentData) => {
    try {
        // Backend uses POST /api/requests/:id/assign
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/assign`, assignmentData);
        return res.data;
    } catch (error) {
        console.error("assignRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Uploads additional media files to an existing request.
 * @param {string} id - The ID of the request.
 * @param {File[]} mediaFiles - Array of File objects to upload. (Backend expects 'mediaFiles')
 * @returns {Promise<object>} Updated request with new media URLs.
 */
export const uploadRequestMedia = async (id, mediaFiles) => {
    try {
        const formData = new FormData();
        mediaFiles.forEach(file => {
            formData.append('mediaFiles', file); // 'mediaFiles' matches multer field name
        });
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/media`, formData);
        return res.data;
    } catch (error) {
        console.error("uploadRequestMedia error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific media file from a request.
 * @param {string} id - The ID of the request.
 * @param {string} mediaUrl - The URL of the media file to delete.
 * @returns {Promise<object>} Success message and remaining media URLs.
 */
export const deleteRequestMedia = async (id, mediaUrl) => {
    try {
        const res = await api.delete(`${REQUEST_BASE_URL}/${id}/media`, { data: { mediaUrl } }); // DELETE with body
        return res.data;
    } catch (error) {
        console.error("deleteRequestMedia error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Enables a public link for a maintenance request.
 * @param {string} id - The ID of the request.
 * @param {number} [expiresInDays] - Optional number of days until the link expires.
 * @returns {Promise<object>} The public link URL.
 */
export const enableRequestPublicLink = async (id, expiresInDays) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/enable-public-link`, { expiresInDays });
        return res.data;
    } catch (error) {
        console.error("enableRequestPublicLink error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Disables a public link for a maintenance request.
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Success message.
 */
export const disableRequestPublicLink = async (id) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/disable-public-link`);
        return res.data;
    } catch (error) {
        console.error("disableRequestPublicLink error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Verifies a completed request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const verifyRequest = async (id) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/verify`);
        return res.data;
    } catch (error) {
        console.error("verifyRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Reopens a request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const reopenRequest = async (id) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/reopen`);
        return res.data;
    } catch (error) {
        console.error("reopenRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Archives a request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const archiveRequest = async (id) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/archive`);
        return res.data;
    } catch (error) {
        console.error("archiveRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Submits feedback for a completed request.
 * @param {string} id - The ID of the request.
 * @param {object} feedbackData - Feedback data: { rating: number, comment?: string }.
 * @returns {Promise<object>} Success message.
 */
export const submitFeedback = async (id, feedbackData) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/feedback`, feedbackData);
        return res.data;
    } catch (error) {
        console.error("submitFeedback error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};
