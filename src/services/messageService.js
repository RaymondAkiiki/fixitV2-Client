// client/src/services/messageService.js

import api from "../api/axios.js";

const MESSAGE_BASE_URL = '/messages';

/**
 * Sends a new message.
 * @param {object} messageData - Data for the message: { recipientId, subject, body, contextType, contextId, propertyId, unitId, category }.
 * @returns {Promise<object>} The created message object.
 */
export const sendMessage = async (messageData) => {
    try {
        const res = await api.post(MESSAGE_BASE_URL, messageData);
        return res.data;
    } catch (error) {
        console.error("sendMessage error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves messages for the authenticated user, with optional filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., type: 'inbox'|'sent', propertyId, unitId, otherUserId).
 * @returns {Promise<object[]>} An array of message objects.
 */
export const getMessages = async (params = {}) => {
    try {
        const res = await api.get(MESSAGE_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getMessages error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a single message by ID.
 * @param {string} messageId - The ID of the message.
 * @returns {Promise<object>} The message object.
 */
export const getMessageById = async (messageId) => {
    try {
        const res = await api.get(`${MESSAGE_BASE_URL}/${messageId}`);
        return res.data;
    } catch (error) {
        console.error("getMessageById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks a specific message as read.
 * @param {string} messageId - The ID of the message to mark as read.
 * @returns {Promise<object>} The updated message object or success message.
 */
export const markMessageAsRead = async (messageId) => {
    try {
        const res = await api.patch(`${MESSAGE_BASE_URL}/${messageId}/read`); // Corrected to PATCH
        return res.data;
    } catch (error) {
        console.error("markMessageAsRead error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific message.
 * @param {string} messageId - The ID of the message to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteMessage = async (messageId) => {
    try {
        const res = await api.delete(`${MESSAGE_BASE_URL}/${messageId}`);
        return res.data;
    } catch (error) {
        console.error("deleteMessage error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};