// client/src/services/commentService.js

import api from "../api/axios.js"; // Corrected import path

const COMMENT_BASE_URL = '/comments';

/**
 * Adds a new comment to a specified resource (e.g., request, scheduled maintenance).
 * @param {object} data - Comment data: { contextType: 'request'|'scheduledmaintenance'|'property'|'unit', contextId: string, message: string, isExternal?: boolean, externalUserName?: string, externalUserEmail?: string, isInternalNote?: boolean, media?: string[] }
 * @returns {Promise<object>} The created comment object.
 */
export const addComment = async (data) => {
    try {
        // Ensure contextType is sent in lowercase to match backend enum
        const payload = {
            ...data,
            contextType: data.contextType.toLowerCase(),
        };
        const res = await api.post(COMMENT_BASE_URL, payload);
        return res.data;
    } catch (error) {
        console.error("addComment error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
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
        const res = await api.get(COMMENT_BASE_URL, { params: queryParams });
        return res.data;
    } catch (error) {
        console.error("getComments error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates an existing comment.
 * @param {string} commentId - The ID of the comment to update.
 * @param {object} updates - The updates to apply to the comment: { message?: string, isInternalNote?: boolean, media?: string[] }.
 * @returns {Promise<object>} The updated comment object.
 */
export const updateComment = async (commentId, updates) => {
    try {
        const res = await api.put(`${COMMENT_BASE_URL}/${commentId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateComment error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a comment.
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteComment = async (commentId) => {
    try {
        const res = await api.delete(`${COMMENT_BASE_URL}/${commentId}`);
        return res.data;
    } catch (error) {
        console.error("deleteComment error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

