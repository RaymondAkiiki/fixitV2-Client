// client/src/services/notificationService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'notificationService';
const NOTIFICATION_BASE_URL = '/notifications';

/**
 * Retrieves all notifications for the authenticated user with optional filtering and pagination.
 * @param {Object} [params={}] - Query parameters
 * @param {string} [params.readStatus] - Filter by read status ('read', 'unread')
 * @param {string} [params.type] - Filter by notification type
 * @param {string} [params.startDate] - Filter by start date (ISO string)
 * @param {string} [params.endDate] - Filter by end date (ISO string)
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Response with notifications array, counts, and pagination info
 */
export const getAllNotifications = async (params = {}, signal) => {
  try {
    const res = await api.get(NOTIFICATION_BASE_URL, { params, signal });
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getAllNotifications', { 
      data, 
      unreadCount: meta.unreadCount, 
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages
    });
    
    return {
      data,
      unreadCount: meta.unreadCount || 0,
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 10,
      totalPages: meta.totalPages || 1
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getAllNotifications error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Retrieves a single notification by ID.
 * @param {string} notificationId - Notification ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The notification object
 */
export const getNotificationById = async (notificationId, signal) => {
  try {
    const res = await api.get(`${NOTIFICATION_BASE_URL}/${notificationId}`, { signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getNotificationById', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getNotificationById error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Marks a specific notification as read.
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} The updated notification object
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const res = await api.patch(`${NOTIFICATION_BASE_URL}/${notificationId}/read`);
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'markNotificationAsRead', { data, message: meta.message });
    
    return data;
  } catch (error) {
    console.error("markNotificationAsRead error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Marks all notifications as read.
 * @returns {Promise<Object>} Result with modifiedCount
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const res = await api.patch(`${NOTIFICATION_BASE_URL}/mark-all-read`);
    const response = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'markAllNotificationsAsRead', { 
      success: response.meta.success, 
      modifiedCount: response.data?.modifiedCount 
    });
    
    return {
      success: response.meta.success,
      message: response.meta.message,
      modifiedCount: response.data?.modifiedCount || 0
    };
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Deletes a specific notification.
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Success message
 */
export const deleteNotification = async (notificationId) => {
  try {
    const res = await api.delete(`${NOTIFICATION_BASE_URL}/${notificationId}`);
    const response = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'deleteNotification', { 
      success: response.meta.success, 
      message: response.meta.message 
    });
    
    return {
      success: response.meta.success,
      message: response.meta.message
    };
  } catch (error) {
    console.error("deleteNotification error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Retrieves the count of unread notifications.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Object with count property
 */
export const getUnreadNotificationCount = async (signal) => {
  try {
    const res = await api.get(`${NOTIFICATION_BASE_URL}/count`, { signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getUnreadNotificationCount', { count: data?.count || 0 });
    
    return { count: data?.count || 0 };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getUnreadNotificationCount error:", error);
    return { count: 0 }; // Return 0 instead of throwing to prevent UI disruption
  }
};

/**
 * Get user notification preferences
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} User's notification preferences
 */
export const getNotificationPreferences = async (signal) => {
  try {
    const res = await api.get(`${NOTIFICATION_BASE_URL}/preferences`, { signal });
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getNotificationPreferences', { data });
    
    return {
      success: meta.success,
      data
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getNotificationPreferences error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Update user notification preferences
 * @param {Object} preferences - Updated preferences
 * @param {string[]} [preferences.channels] - Notification channels array
 * @param {Object} [preferences.emailSettings] - Email notification settings
 * @param {Object} [preferences.smsSettings] - SMS notification settings
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Updated preferences
 */
export const updateNotificationPreferences = async (preferences, signal) => {
  try {
    const res = await api.put(
      `${NOTIFICATION_BASE_URL}/preferences`, 
      preferences, 
      { signal }
    );
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'updateNotificationPreferences', { 
      success: meta.success, 
      data, 
      message: meta.message 
    });
    
    return {
      success: meta.success,
      message: meta.message,
      data
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("updateNotificationPreferences error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Subscribe to real-time notifications (placeholder for future WebSocket/SSE implementation)
 * @param {Function} callback - Function to call when a new notification is received
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNotifications = (callback) => {
  // This is a placeholder for future implementation with WebSockets or SSE
  // For now, we'll use polling in the NotificationContext
  console.log('Subscription to real-time notifications is not implemented yet');
  
  // Return a dummy unsubscribe function
  return () => {};
};

export default {
  getAllNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  getNotificationPreferences,
  updateNotificationPreferences,
  subscribeToNotifications
};