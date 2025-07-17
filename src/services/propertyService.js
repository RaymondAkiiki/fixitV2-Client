// client/src/services/propertyService.js

import api from "../api/axios.js";
import axios from "axios"; // Import axios to check for cancel errors

const PROPERTY_BASE_URL = '/properties';

/**
 * Retrieves a list of properties accessible by the authenticated user.
 * @param {object} [params={}] - Optional query parameters for filtering.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object[]>} An array of property objects.
 */
export const getAllProperties = async (params = {}, signal) => {
    try {
        const res = await api.get(PROPERTY_BASE_URL, { params, signal });
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.properties)) return res.data.properties; // Handle paginated response
        return [];
    } catch (error) {
        // ✅ FIX: Check for cancellation errors first. If it's not a cancel error,
        // then log it. In either case, re-throw the original error object
        // so the calling component can inspect its 'name' or 'code'.
        if (!axios.isCancel(error)) {
            console.error("getAllProperties error:", error.response?.data || error.message);
        }
        throw error; // Re-throw the original error
    }
};

/**
 * Retrieves details for a specific property.
 * @param {string} propertyId - The ID of the property.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The property object.
 */
export const getPropertyById = async (propertyId, signal) => {
    try {
        const res = await api.get(`${PROPERTY_BASE_URL}/${propertyId}`, { signal });
        return res.data;
    } catch (error) {
        if (!axios.isCancel(error)) {
            console.error("getPropertyById error:", error.response?.data || error.message);
        }
        throw error;
    }
};


/**
 * Creates a new property.
 * @param {object} propertyData - Data for the new property.
 * @returns {Promise<object>} The created property object.
 */
export const createProperty = async (propertyData) => {
    try {
        const res = await api.post(PROPERTY_BASE_URL, propertyData);
        return res.data;
    } catch (error) {
        console.error("createProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific property.
 * @param {string} propertyId - The ID of the property to update.
 * @param {object} propertyData - Data to update.
 * @returns {Promise<object>} The updated property object.
 */
export const updateProperty = async (propertyId, propertyData) => {
    try {
        const res = await api.put(`${PROPERTY_BASE_URL}/${propertyId}`, propertyData);
        return res.data;
    } catch (error) {
        console.error("updateProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a property.
 * @param {string} propertyId - The ID of the property to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteProperty = async (propertyId) => {
    try {
        const res = await api.delete(`${PROPERTY_BASE_URL}/${propertyId}`);
        return res.data;
    } catch (error) {
        console.error("deleteProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a user to a property with specific roles.
 * @param {string} propertyId - The ID of the property.
 * @param {string} userIdToAssign - The ID of the user to assign.
 * @param {string[]} roles - Array of roles to assign (e.g., ['propertymanager'], ['tenant']).
 * @param {string} [unitId] - Optional. Unit ID if assigning a tenant to a specific unit.
 * @returns {Promise<object>} Success message and updated property.
 */
export const assignUserToProperty = async (propertyId, userIdToAssign, roles, unitId = null) => {
    try {
        const payload = {
            userIdToAssign,
            roles: roles.map(role => role.toLowerCase()), // Ensure roles are lowercase
            ...(unitId && { unitId }) // Conditionally add unitId
        };
        const res = await api.post(`${PROPERTY_BASE_URL}/${propertyId}/assign-user`, payload);
        return res.data;
    } catch (error) {
        console.error("assignUserToProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Removes (deactivates) a user's association with a property/unit for specific roles.
 * @param {string} propertyId - The ID of the property.
 * @param {string} userIdToRemove - The ID of the user to remove.
 * @param {string[]} rolesToRemove - Array of roles to remove (e.g., ['propertymanager'], ['tenant']).
 * @param {string} [unitId] - Optional. Required if 'tenant' role is being removed.
 * @returns {Promise<object>} Success message.
 */
export const removeUserFromProperty = async (propertyId, userIdToRemove, rolesToRemove, unitId = null) => {
    try {
        const params = {
            rolesToRemove: rolesToRemove.map(role => role.toLowerCase()), // Ensure roles are lowercase
            ...(unitId && { unitId }) // Conditionally add unitId
        };
        // Backend uses DELETE with query parameters
        const res = await api.delete(`${PROPERTY_BASE_URL}/${propertyId}/remove-user/${userIdToRemove}`, { params });
        return res.data;
    } catch (error) {
        console.error("removeUserFromProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};