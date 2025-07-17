import api from "../api/axios.js";
import axios from "axios";

const USER_BASE_URL = '/users';

/**
 * Get current user's profile.
 * GET /api/users/profile
 */
export const getMyProfile = async (signal) => {
    try {
        const res = await api.get(`${USER_BASE_URL}/profile`, { signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request Aborted");
        }
        throw error;
    }
};

/**
 * Update current user's own profile.
 */
export const updateMyProfile = async (profileData) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/profile`, profileData);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * For ADMIN, PM, Landlord: Get all users with filtering.
 */
export const getAllUsers = async (params = {}, signal) => {
    try {
        const res = await api.get(USER_BASE_URL, { params, signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request Aborted");
        }
        throw error;
    }
};

/**
 * Create new user.
 */
export const createUser = async (userData) => {
    try {
        const res = await api.post(USER_BASE_URL, userData);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get specific user details by ID.
 */
export const getUserById = async (userId, signal) => {
    try {
        const res = await api.get(`${USER_BASE_URL}/${userId}`, { signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request Aborted");
        }
        throw error;
    }
};

/**
 * Update a user's profile by ID.
 */
export const updateUserById = async (userId, updates) => {
    try {
        // Ensure role is lowercase if provided before sending to backend
        const payload = { ...updates };
        if (payload.role) payload.role = payload.role.toLowerCase();

        const res = await api.put(`${USER_BASE_URL}/${userId}`, payload);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Approve a pending user.
 */
export const approveUser = async (userId) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/approve`);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Update a user's global role (Admin only).
 */
export const updateUserRole = async (userId, role) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/role`, { role: role.toLowerCase() });
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete user by ID (Admin only).
 */
export const deleteUserById = async (userId) => {
    try {
        const res = await api.delete(`${USER_BASE_URL}/${userId}`);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Deactivate a user.
 */
export const deactivateUser = async (userId) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/deactivate`);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Activate a user.
 */
export const activateUser = async (userId) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/activate`);
        return res.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Admin can reset a user's password.
 */
export const adminResetUserPassword = async (userId, newPassword) => {
    try {
        const res = await api.post(`${USER_BASE_URL}/${userId}/reset-password`, { newPassword });
        return res.data;
    } catch (error) {
        throw error;
    }
};