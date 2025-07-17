// client/src/services/notificationService.js

import api from "../api/axios.js";
import axios from "axios";

const NOTIFICATION_BASE_URL = '/notifications';

/**
 * Retrieves all notifications for the authenticated user.
 * @param {object} [params={}] - Query parameters.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object[]>} An array of notification objects.
 */
export const getAllNotifications = async (params = {}, signal) => {
    try {
        const res = await api.get(NOTIFICATION_BASE_URL, { params, signal });
        return res.data;
    } catch (error) {
        // ✅ FIX: Simply re-throw the original error. Do not create a new one.
        // The calling context will handle whether to display it.
        throw error;
    }
};

/**
 * Retrieves a single notification by ID.
 * @param {string} notificationId
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The notification object.
 */
export const getNotificationById = async (notificationId, signal) => {
    try {
        const res = await api.get(`${NOTIFICATION_BASE_URL}/${notificationId}`, { signal });
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Marks a specific notification as read.
 * @param {string} notificationId
 * @returns {Promise<object>} The updated notification object or success message.
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const res = await api.patch(`${NOTIFICATION_BASE_URL}/${notificationId}/read`);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Marks all notifications as read.
 * @returns {Promise<object>} Success message.
 */
export const markAllNotificationsAsRead = async () => {
    try {
        const res = await api.patch(`${NOTIFICATION_BASE_URL}/mark-all-read`);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Retrieves the count of unread notifications for the authenticated user.
 * @returns {Promise<number>} The count of unread notifications.
 */
export const getUnreadNotificationCount = async () => {
    try {
        const res = await api.get(`${NOTIFICATION_BASE_URL}/unread-count`);
        return res.data.count;
    } catch (error) {
        throw error;
    }
};

/**
 * Deletes a specific notification.
 * @param {string} notificationId
 * @returns {Promise<object>} Success message.
 */
export const deleteNotification = async (notificationId) => {
    try {
        const res = await api.delete(`${NOTIFICATION_BASE_URL}/${notificationId}`);
        return res.data;
    } catch (error) {
        throw error;
    }
};