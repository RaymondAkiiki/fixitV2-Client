// frontend/src/services/notificationService.js

import api from "../api/axios.js"; // Corrected import path

/**
 * Retrieves all notifications for the authenticated user.
 * @returns {Promise<object[]>} An array of notification objects.
 */
export const getAllNotifications = async () => {
    try {
        const res = await api.get("/notifications");
        return res.data;
    } catch (error) {
        console.error("getAllNotifications error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Marks a specific notification as read.
 * @param {string} notificationId - The ID of the notification to mark as read.
 * @returns {Promise<object>} The updated notification object or success message.
 */
export const markAsRead = async (notificationId) => {
    try {
        // Changed to PUT /notifications/:id/read as per backend route
        const res = await api.put(`/notifications/${notificationId}/read`);
        return res.data;
    } catch (error) {
        console.error("markAsRead error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Marks all notifications for the authenticated user as read.
 * @returns {Promise<object>} Success message.
 */
export const markAllAsRead = async () => {
    try {
        const res = await api.put('/notifications/read-all'); // New route
        return res.data;
    } catch (error) {
        console.error("markAllAsRead error:", error.response?.data || error.message);
        throw error;
    }
};

// Removed deleteNotification as it was not explicitly in the backend notificationController.
// If needed, it would require a DELETE /notifications/:id endpoint and corresponding controller logic.
/*
export const deleteNotification = async (notificationId) => {
    const res = await api.delete(`/notifications/${notificationId}`);
    return res.data;
};
*/
