// frontend/src/services/commentService.js

import api from "../api/axios.js"; // Corrected import path

/**
 * Adds a new comment to a specified resource (e.g., request, scheduled maintenance).
 * @param {object} data - Comment data: { contextType: 'request'|'scheduledmaintenance'|'property'|'unit', contextId: string, message: string }
 * @returns {Promise<object>} The created comment object.
 */
export const addComment = async (data) => {
    try {
        // Ensure contextType is sent in lowercase to match backend enum
        const payload = {
            ...data,
            contextType: data.contextType.toLowerCase(),
        };
        const res = await api.post('/comments', payload);
        return res.data;
    } catch (error) {
        console.error("addComment error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Retrieves comments for a specified resource.
 * @param {object} params - Query parameters: { contextType: 'request'|'scheduledmaintenance'|'property'|'unit', contextId: string }
 * @returns {Promise<object[]>} An array of comment objects.
 */
export const getComments = async (params) => {
    try {
        // Ensure contextType in params is sent in lowercase
        const queryParams = {
            ...params,
            contextType: params.contextType.toLowerCase(),
        };
        const res = await api.get('/comments', { params: queryParams });
        return res.data;
    } catch (error) {
        console.error("getComments error:", error.response?.data || error.message);
        throw error;
    }
};
