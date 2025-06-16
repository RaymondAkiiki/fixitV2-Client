// frontend/src/services/requestService.js

import api from "../api/axios.js"; // Corrected import path

/**
 * Retrieves all maintenance requests accessible to the authenticated user, with filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., status, category, propertyId, unitId, search).
 * @returns {Promise<object[]>} An array of request objects.
 */
export const getAllRequests = async (params = {}) => {
    try {
        const res = await api.get("/requests", { params }); // This now handles all filtering
        return res.data;
    } catch (error) {
        console.error("getAllRequests error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Retrieves details for a specific maintenance request.
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} The request object.
 */
export const getRequestById = async (id) => {
    try {
        const res = await api.get(`/requests/${id}`);
        return res.data;
    } catch (error) {
        console.error("getRequestById error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Creates a new maintenance request.
 * @param {object} requestData - Request details: { title, description, category, priority, propertyId, unitId }.
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload.
 * @returns {Promise<object>} The created request object.
 */
export const createRequest = async (requestData, mediaFiles = []) => {
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
        mediaFiles.forEach(file => {
            formData.append('mediaFiles', file); // 'mediaFiles' must match multer field name
        });

        // Axios automatically sets Content-Type to multipart/form-data for FormData
        const res = await api.post("/requests", formData);
        return res.data;
    } catch (error) {
        console.error("createRequest error:", error.response?.data || error.message);
        throw error;
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

        const res = await api.put(`/requests/${id}`, payload);
        return res.data;
    } catch (error) {
        console.error("updateRequest error:", error.response?.data || error.message);
        throw error;
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
        const res = await api.post(`/requests/${id}/assign`, assignmentData); // Changed to POST /:id/assign
        return res.data;
    } catch (error) {
        console.error("assignRequest error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Uploads additional media files to an existing request.
 * @param {string} id - The ID of the request.
 * @param {File[]} mediaFiles - Array of File objects to upload.
 * @returns {Promise<object>} Updated request with new media URLs.
 */
export const uploadRequestMedia = async (id, mediaFiles) => {
    try {
        const formData = new FormData();
        mediaFiles.forEach(file => {
            formData.append('mediaFiles', file); // 'mediaFiles' must match multer field name
        });
        const res = await api.post(`/requests/${id}/media`, formData);
        return res.data;
    } catch (error) {
        console.error("uploadRequestMedia error:", error.response?.data || error.message);
        throw error;
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
        const res = await api.delete(`/requests/${id}/media`, { data: { mediaUrl } }); // DELETE with body
        return res.data;
    } catch (error) {
        console.error("deleteRequestMedia error:", error.response?.data || error.message);
        throw error;
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
        const res = await api.post(`/requests/${id}/enable-public-link`, { expiresInDays });
        return res.data;
    } catch (error) {
        console.error("enableRequestPublicLink error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Disables a public link for a maintenance request.
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Success message.
 */
export const disableRequestPublicLink = async (id) => {
    try {
        const res = await api.post(`/requests/${id}/disable-public-link`);
        return res.data;
    } catch (error) {
        console.error("disableRequestPublicLink error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Retrieves a public view of a request (no authentication required).
 * @param {string} publicToken - The public access token.
 * @returns {Promise<object>} Limited request details.
 */
export const getPublicRequestView = async (publicToken) => {
    try {
        const res = await api.get(`/requests/public/${publicToken}`);
        return res.data;
    } catch (error) {
        console.error("getPublicRequestView error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Allows an external vendor to update a request (status/comments) via public link.
 * @param {string} publicToken - The public access token.
 * @param {object} updateData - Data to update: { status, commentMessage, name, phone }.
 * @returns {Promise<object>} Success message.
 */
export const publicRequestUpdate = async (publicToken, updateData) => {
    try {
        // Ensure status is lowercase if provided
        const payload = { ...updateData };
        if (payload.status) payload.status = payload.status.toLowerCase();

        const res = await api.post(`/requests/public/${publicToken}/update`, payload);
        return res.data;
    } catch (error) {
        console.error("publicRequestUpdate error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Verifies a completed request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const verifyRequest = async (id) => {
    try {
        const res = await api.put(`/requests/${id}/verify`);
        return res.data;
    } catch (error) {
        console.error("verifyRequest error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Reopens a request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const reopenRequest = async (id) => {
    try {
        const res = await api.put(`/requests/${id}/reopen`);
        return res.data;
    } catch (error) {
        console.error("reopenRequest error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Archives a request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const archiveRequest = async (id) => {
    try {
        const res = await api.put(`/requests/${id}/archive`);
        return res.data;
    } catch (error) {
        console.error("archiveRequest error:", error.response?.data || error.message);
        throw error;
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
        const res = await api.post(`/requests/${id}/feedback`, feedbackData);
        return res.data;
    } catch (error) {
        console.error("submitFeedback error:", error.response?.data || error.message);
        throw error;
    }
};


// Removed: markAsResolved, deleteRequest (now handled by updateRequest with status/archive),
// getMyRequests (now consolidated into getAllRequests with filtering),
// addCommentToRequest (use commentsService.addComment), updateRequestStatus (use updateRequest).
