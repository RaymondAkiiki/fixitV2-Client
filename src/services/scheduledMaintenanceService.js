import api from "../api/axios.js";

/**
 * Creates a new scheduled maintenance task.
 * @param {object} taskData - Scheduled maintenance data.
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload.
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
        // Note: backend expects 'media', not 'mediaFiles'
        mediaFiles.forEach(file => {
            formData.append('media', file); // 'media' matches Multer field in backend
        });
        const res = await api.post('/scheduled-maintenance', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("createScheduledMaintenance error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Retrieves all scheduled maintenance tasks accessible to the authenticated user, with filtering.
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object>} An object: { tasks, total, currentPage, itemsPerPage }
 */
export const getAllScheduledMaintenance = async (params = {}) => {
    try {
        const res = await api.get('/scheduled-maintenance', { params });
        if (Array.isArray(res.data)) return { tasks: res.data, total: res.data.length, currentPage: 1, itemsPerPage: res.data.length };
        if (res.data?.tasks && typeof res.data.total !== "undefined") return res.data;
        return { tasks: [], total: 0, currentPage: 1, itemsPerPage: 0 };
    } catch (error) {
        console.error("getAllScheduledMaintenance error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Retrieves details for a specific scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @returns {Promise<object>} The task object.
 */
export const getScheduledMaintenanceById = async (id) => {
    try {
        const res = await api.get(`/scheduled-maintenance/${id}`);
        return res.data;
    } catch (error) {
        console.error("getScheduledMaintenanceById error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Updates details for a specific scheduled maintenance task.
 * @param {string} id - The ID of the task to update.
 * @param {object} updates - Data to update.
 * @param {File[]} [mediaFiles=[]] - Optional array of new File objects for media upload.
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
        const res = await api.put(`/scheduled-maintenance/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("updateScheduledMaintenance error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Deletes a scheduled maintenance task.
 * @param {string} id - The ID of the task to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteScheduledMaintenance = async (id) => {
    try {
        const res = await api.delete(`/scheduled-maintenance/${id}`);
        return res.data;
    } catch (error) {
        console.error("deleteScheduledMaintenance error:", error.response?.data || error.message);
        throw error;
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
        const res = await api.post(`/scheduled-maintenance/${id}/enable-public-link`, { expiresInDays });
        return res.data;
    } catch (error) {
        console.error("enableScheduledMaintenancePublicLink error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Disables a public link for a scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @returns {Promise<object>} Success message.
 */
export const disableScheduledMaintenancePublicLink = async (id) => {
    try {
        const res = await api.post(`/scheduled-maintenance/${id}/disable-public-link`);
        return res.data;
    } catch (error) {
        console.error("disableScheduledMaintenancePublicLink error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Retrieves a public view of a scheduled maintenance task (no authentication required).
 * @param {string} publicToken - The public access token.
 * @returns {Promise<object>} Limited task details.
 */
export const getPublicScheduledMaintenanceView = async (publicToken) => {
    try {
        const res = await api.get(`/scheduled-maintenance/public/${publicToken}`);
        return res.data;
    } catch (error) {
        console.error("getPublicScheduledMaintenanceView error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Allows an external vendor to update a scheduled maintenance task (status/comments) via public link.
 * @param {string} publicToken - The public access token.
 * @param {object} updateData - Data to update: { status, commentMessage, name, phone }.
 * @returns {Promise<object>} Success message.
 */
export const publicScheduledMaintenanceUpdate = async (publicToken, updateData) => {
    try {
        const payload = { ...updateData };
        if (payload.status) payload.status = payload.status.toLowerCase();
        const res = await api.post(`/scheduled-maintenance/public/${publicToken}/update`, payload);
        return res.data;
    } catch (error) {
        console.error("publicScheduledMaintenanceUpdate error:", error.response?.data || error.message);
        throw error;
    }
};