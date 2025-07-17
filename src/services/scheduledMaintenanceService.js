// client/src/services/scheduledMaintenanceService.js

import api from "../api/axios.js";

const SCHEDULED_MAINTENANCE_BASE_URL = '/scheduled-maintenance';

/**
 * Creates a new scheduled maintenance task.
 * @param {object} taskData - Scheduled maintenance data.
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload. (Backend expects 'media')
 * @returns {Promise<object>} The created task object.
 */
export const createScheduledMaintenance = async (taskData, mediaFiles = []) => {
    try {
        const formData = new FormData();
        Object.keys(taskData).forEach(key => {
            const value = taskData[key];
            if (value === undefined || value === null) return;
            if (key === 'category' && typeof value === 'string') {
                formData.append(key, value.toLowerCase());
            } else if (key === 'frequency' && typeof value === 'object') {
                formData.append(key, JSON.stringify({
                    ...value,
                    type: value.type?.toLowerCase()
                }));
            } else {
                formData.append(key, value);
            }
        });
        mediaFiles.forEach(file => {
            formData.append('media', file); // 'media' matches Multer field in backend
        });
        const res = await api.post(SCHEDULED_MAINTENANCE_BASE_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("createScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves all scheduled maintenance tasks accessible to the authenticated user, with filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., status, recurring, propertyId, unitId, category, search, startDate, endDate, page, limit).
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} An object: { tasks, total, currentPage, itemsPerPage }
 */
export const getAllScheduledMaintenance = async (params = {}, signal) => {
    try {
        const res = await api.get(SCHEDULED_MAINTENANCE_BASE_URL, { params, signal });
        if (Array.isArray(res.data)) return { tasks: res.data, total: res.data.length, currentPage: 1, itemsPerPage: res.data.length };
        if (res.data?.tasks && typeof res.data.total !== "undefined") return res.data;
        return { tasks: [], total: 0, currentPage: 1, itemsPerPage: 0 };
    } catch (error) {
        console.error("getAllScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The task object.
 */
export const getScheduledMaintenanceById = async (id, signal) => {
    try {
        const res = await api.get(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}`, { signal });
        return res.data;
    } catch (error) {
        console.error("getScheduledMaintenanceById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific scheduled maintenance task.
 * @param {string} id - The ID of the task to update.
 * @param {object} updates - Data to update.
 * @param {File[]} [mediaFiles=[]] - Optional array of new File objects for media upload. (Backend expects 'media')
 * @returns {Promise<object>} The updated task object.
 */
export const updateScheduledMaintenance = async (id, updates, mediaFiles = []) => {
    try {
        const formData = new FormData();
        Object.keys(updates).forEach(key => {
            const value = updates[key];
            if (value === undefined || value === null) return;
            if ((key === 'category' || key === 'status') && typeof value === 'string') {
                formData.append(key, value.toLowerCase());
            } else if (key === 'frequency' && typeof value === 'object') {
                formData.append(key, JSON.stringify({
                    ...value,
                    type: value.type?.toLowerCase()
                }));
            } else {
                formData.append(key, value);
            }
        });
        mediaFiles.forEach(file => {
            formData.append('media', file); // 'media' matches Multer field in backend
        });
        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("updateScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a scheduled maintenance task.
 * @param {string} id - The ID of the task to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteScheduledMaintenance = async (id) => {
    try {
        const res = await api.delete(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error("deleteScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Enables a public link for a scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @param {number} [expiresInDays] - Optional number of days until the link expires.
 * @returns {Promise<object>} The public link URL.
 */
export const enableScheduledMaintenancePublicLink = async (id, expiresInDays) => {
    try {
        const res = await api.post(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/enable-public-link`, { expiresInDays });
        return res.data;
    } catch (error) {
        console.error("enableScheduledMaintenancePublicLink error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Disables a public link for a scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @returns {Promise<object>} Success message.
 */
export const disableScheduledMaintenancePublicLink = async (id) => {
    try {
        const res = await api.post(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/disable-public-link`);
        return res.data;
    } catch (error) {
        console.error("disableScheduledMaintenancePublicLink error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Pauses a scheduled maintenance task.
 * @param {string} id - The ID of the task to pause.
 * @returns {Promise<object>} The updated task object.
 */
export const pauseScheduledMaintenance = async (id) => {
    try {
        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/pause`);
        return res.data;
    } catch (error) {
        console.error("pauseScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Resumes a paused scheduled maintenance task.
 * @param {string} id - The ID of the task to resume.
 * @returns {Promise<object>} The updated task object.
 */
export const resumeScheduledMaintenance = async (id) => {
    try {
        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/resume`);
        return res.data;
    } catch (error) {
        console.error("resumeScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};
