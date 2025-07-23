// client/src/services/userService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'userService';
const USER_BASE_URL = '/users';

/**
 * Get current user's profile with property associations
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} User profile with property associations
 * @throws {Error} If the request fails
 */
export const getMyProfile = async (signal) => {
    try {
        const res = await api.get(`${USER_BASE_URL}/profile`, { signal });
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getMyProfile', response);
        
        return response.data?.user || response.user || {};
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request Aborted");
        }
        console.error("Error fetching user profile:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Update current user's own profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user profile
 * @throws {Error} If the request fails
 */
export const updateMyProfile = async (profileData) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/profile`, profileData);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateMyProfile', response);
        
        return response.data?.user || response.user || {};
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Get all users with filtering and pagination
 * @param {Object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Paginated list of users
 * @throws {Error} If the request fails
 */
export const getAllUsers = async (params = {}, signal) => {
    try {
        const res = await api.get(USER_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getAllUsers', { data, meta });
        
        return {
            data: data || [],
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: Math.ceil((meta.total || 0) / (meta.limit || 10))
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request Aborted");
        }
        console.error("Error fetching users:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 * @throws {Error} If the request fails
 */
export const createUser = async (userData) => {
    try {
        // Ensure role is lowercase
        const payload = {
            ...userData,
            role: userData.role?.toLowerCase()
        };
        
        const res = await api.post(USER_BASE_URL, payload);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createUser', { data });
        
        return data?.user || data || {};
    } catch (error) {
        console.error("Error creating user:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Get specific user details by ID
 * @param {string} userId - User ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} User details with property associations
 * @throws {Error} If the request fails
 */
export const getUserById = async (userId, signal) => {
    try {
        const res = await api.get(`${USER_BASE_URL}/${userId}`, { signal });
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getUserById', response);
        
        return response.data?.user || response.user || {};
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request Aborted");
        }
        console.error(`Error fetching user ${userId}:`, error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Update a user's profile by ID
 * @param {string} userId - User ID
 * @param {Object} updates - Data to update
 * @returns {Promise<Object>} Updated user
 * @throws {Error} If the request fails
 */
export const updateUserById = async (userId, updates) => {
    try {
        // Normalize data before sending
        const payload = { ...updates };
        if (payload.role) payload.role = payload.role.toLowerCase();
        if (payload.status) payload.status = payload.status.toLowerCase();

        const res = await api.put(`${USER_BASE_URL}/${userId}`, payload);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateUserById', { data });
        
        return data?.user || data || {};
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Approve a pending user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Approved user
 * @throws {Error} If the request fails
 */
export const approveUser = async (userId) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/approve`);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'approveUser', { data });
        
        return data?.user || data || {};
    } catch (error) {
        console.error(`Error approving user ${userId}:`, error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Update a user's global role (Admin only)
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} Updated user
 * @throws {Error} If the request fails
 */
export const updateUserRole = async (userId, role) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/role`, { 
            role: role.toLowerCase() 
        });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateUserRole', { data });
        
        return data?.user || data || {};
    } catch (error) {
        console.error(`Error updating role for user ${userId}:`, error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Delete user by ID (Admin only)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success message
 * @throws {Error} If the request fails
 */
export const deleteUserById = async (userId) => {
    try {
        const res = await api.delete(`${USER_BASE_URL}/${userId}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteUserById', response);
        
        return response;
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Update user notification preferences
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<Object>} Updated preferences
 * @throws {Error} If the request fails
 */
export const updateNotificationPreferences = async (preferences) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/profile`, { 
            preferences: {
                notificationChannels: preferences.channels,
                ...preferences
            }
        });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateNotificationPreferences', { data });
        
        return data?.user?.preferences || data?.preferences || {};
    } catch (error) {
        console.error("Error updating notification preferences:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Get user notification preferences
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} User notification preferences
 * @throws {Error} If the request fails
 */
export const getNotificationPreferences = async (signal) => {
    try {
        const res = await api.get(`${USER_BASE_URL}/profile`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getNotificationPreferences', { data });
        
        return data?.user?.preferences || data?.preferences || {};
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request Aborted");
        }
        console.error("Error fetching notification preferences:", error);
        throw error.response?.data?.message || error.message;
    }
};

export default {
    getMyProfile,
    updateMyProfile,
    getAllUsers,
    createUser,
    getUserById,
    updateUserById,
    approveUser,
    updateUserRole,
    deleteUserById,
    updateNotificationPreferences,
    getNotificationPreferences
};