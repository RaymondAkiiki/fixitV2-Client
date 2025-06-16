// frontend/src/services/propertyService.js

import api from "../api/axios.js"; // Corrected import path

/**
 * Retrieves a list of properties accessible by the authenticated user.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., { search, city, country }).
 * @returns {Promise<object[]>} An array of property objects.
 */

export const getAllProperties = async (params = {}) => {
    try {
        const res = await api.get("/properties", { params });
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.properties)) return res.data.properties;
        return [];
    } catch (error) {
        console.error("getAllProperties error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Retrieves details for a specific property.
 * @param {string} propertyId - The ID of the property.
 * @returns {Promise<object>} The property object.
 */
export const getPropertyById = async (propertyId) => {
    try {
        const res = await api.get(`/properties/${propertyId}`);
        return res.data;
    } catch (error) {
        console.error("getPropertyById error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Creates a new property.
 * @param {object} propertyData - Data for the new property: { name, address: { street, city, state, country }, details }.
 * @returns {Promise<object>} The created property object.
 */
export const createProperty = async (propertyData) => {
    try {
        const res = await api.post("/properties", propertyData);
        return res.data;
    } catch (error) {
        console.error("createProperty error:", error.response?.data || error.message);
        throw error;
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
        const res = await api.put(`/properties/${propertyId}`, propertyData);
        return res.data;
    } catch (error) {
        console.error("updateProperty error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Deletes a property.
 * @param {string} propertyId - The ID of the property to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteProperty = async (propertyId) => {
    try {
        const res = await api.delete(`/properties/${propertyId}`);
        return res.data;
    } catch (error) {
        console.error("deleteProperty error:", error.response?.data || error.message);
        throw error;
    }
};

