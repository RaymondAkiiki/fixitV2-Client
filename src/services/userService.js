// frontend/src/services/userService.js

import api from "../api/axios.js"; // Corrected import path
// import { USER_ROLES } from "../utils/constants.js"; // Not strictly needed in service file, roles are used in client-side logic/contexts

/**
 * Get current user's profile.
 * Maps to backend's GET /api/users/me route.
 * @returns {Promise<object>} User profile data.
 */
export const getMyProfile = async () => {
    try {
        const res = await api.get('/users/me'); // Endpoint changed to /users/me
        return res.data; // This data will be like { _id, name, email, role, associations, ... }
    } catch (error) {
        console.error("getMyProfile error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update current user's own profile (name, phone).
 * Maps to backend's PUT /api/users/me route.
 * @param {object} profileData - Data to update (e.g., { name, phone }).
 * @returns {Promise<object>} Updated user profile data.
 */
export const updateMyProfile = async (profileData) => {
    try {
        const res = await api.put("/users/me", profileData); // Endpoint changed to /users/me
        return res.data;
    } catch (error) {
        console.error("updateMyProfile error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * For ADMIN, PropertyManager, Landlord: Get all users with filtering.
 * Maps to backend's GET /api/users route.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., { role, propertyId, unitId, search }).
 * @returns {Promise<object[]>} Array of user objects.
 */
export const getAllUsers = async (params = {}) => {
    try {
        const res = await api.get("/users", { params }); // Consolidated route for all users with filters
        return res.data;
    } catch (error) {
        console.error("getAllUsers error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get specific user details by ID.
 * Maps to backend's GET /api/users/:id route.
 * @param {string} userId - ID of the user to retrieve.
 * @returns {Promise<object>} User details object.
 */
export const getUserById = async (userId) => {
    try {
        const res = await api.get(`/users/${userId}`);
        return res.data;
    } catch (error) {
        console.error("getUserById error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update a user's profile (Admin only for full update, or limited by PM/Landlord).
 * Maps to backend's PUT /api/users/:id route.
 * @param {string} userId - ID of the user to update.
 * @param {object} updates - Data to update (e.g., { name, phone, email, role, isActive, approved }).
 * @returns {Promise<object>} Updated user data.
 */
export const updateUser = async (userId, updates) => {
    try {
        // Ensure role is lowercase if provided before sending to backend
        const payload = { ...updates };
        if (payload.role) payload.role = payload.role.toLowerCase();

        const res = await api.put(`/users/${userId}`, payload);
        return res.data;
    } catch (error) {
        console.error("updateUser error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Approve a user (admin only).
 * Maps to backend's PATCH /api/users/:id/approve route.
 * @param {string} userId - ID of the user to approve.
 * @returns {Promise<object>} Backend response.
 */
export const approveUser = async (userId) => {
    try {
        const res = await api.patch(`/users/${userId}/approve`);
        return res.data;
    } catch (error) {
        console.error("approveUser error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Update a user's role (admin only).
 * Maps to backend's PATCH /api/users/:id/role route.
 * @param {string} userId - ID of the user to update.
 * @param {string} role - New role (e.g., 'landlord', 'propertymanager').
 * @returns {Promise<object>} Backend response.
 */
export const updateUserRole = async (userId, role) => {
    try {
        const res = await api.patch(`/users/${userId}/role`, { role: role.toLowerCase() }); // Ensure role is lowercase
        return res.data;
    } catch (error) {
        console.error("updateUserRole error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Delete a user (admin only).
 * Maps to backend's DELETE /api/users/:id route.
 * @param {string} userId - ID of the user to delete.
 * @returns {Promise<object>} Backend response.
 */
export const deleteUser = async (userId) => {
    try {
        const res = await api.delete(`/users/${userId}`);
        return res.data;
    } catch (error) {
        console.error("deleteUser error:", error.response?.data || error.message);
        throw error;
    }
};


/**
 * Create a new tenant manually (admin/landlord/PM only).
 * @param {object} data - { name, email, phone, propertyId, unitId, ... }
 * @returns {Promise<object>} The created user object.
 */
export const createTenant = async (data) => {
    try {
        const res = await api.post("/users", { ...data, role: "tenant" });
        return res.data;
    } catch (error) {
        console.error("createTenant error:", error.response?.data || error.message);
        throw error;
    }
};