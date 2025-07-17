// client/src/services/unitService.js

import api from "../api/axios.js"; // Corrected import path

const PROPERTY_UNIT_BASE_URL = '/properties'; // For nested unit routes

/**
 * Creates a new unit within a specific property.
 * @param {string} propertyId - The ID of the property the unit belongs to.
 * @param {object} unitData - Data for the new unit: { unitName, floor, details, numBedrooms, numBathrooms, squareFootage, rentAmount }.
 * @returns {Promise<object>} The created unit object.
 */
export const createUnit = async (propertyId, unitData) => {
    try {
        const res = await api.post(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units`, unitData); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("createUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a list of units for a specific property.
 * @param {string} propertyId - The ID of the property.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., status, numBedrooms, search, page, limit).
 * @returns {Promise<object[]>} An array of unit objects.
 */
export const getUnitsForProperty = async (propertyId, params = {}) => {
    try {
        const res = await api.get(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units`, { params }); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("getUnitsForProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific unit.
 * @param {string} propertyId - The ID of the parent property.
 * @param {string} unitId - The ID of the unit.
 * @returns {Promise<object>} The unit object.
 */
export const getUnitById = async (propertyId, unitId) => {
    try {
        const res = await api.get(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("getUnitById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific unit.
 * @param {string} propertyId - The ID of the parent property.
 * @param {string} unitId - The ID of the unit to update.
 * @param {object} updates - Data to update.
 * @returns {Promise<object>} The updated unit object.
 */
export const updateUnit = async (propertyId, unitId, updates) => {
    try {
        const res = await api.put(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`, updates); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("updateUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific unit.
 * @param {string} propertyId - The ID of the parent property.
 * @param {string} unitId - The ID of the unit to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteUnit = async (propertyId, unitId) => {
    try {
        const res = await api.delete(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("deleteUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a tenant to a unit.
 * @param {string} propertyId - The ID of the property.
 * @param {string} unitId - The ID of the unit.
 * @param {string} tenantId - The ID of the user (tenant) to assign.
 * @returns {Promise<object>} Success message and updated unit.
 */
export const assignTenantToUnit = async (propertyId, unitId, tenantId) => {
    try {
        // Backend uses POST /properties/:propertyId/units/:unitId/assign-tenant
        const res = await api.post(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}/assign-tenant`, { tenantId });
        return res.data;
    } catch (error) {
        console.error("assignTenantToUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Removes a tenant from a unit.
 * @param {string} propertyId - The ID of the property.
 * @param {string} unitId - The ID of the unit.
 * @param {string} tenantId - The ID of the user (tenant) to remove.
 * @returns {Promise<object>} Success message and updated unit.
 */
export const removeTenantFromUnit = async (propertyId, unitId, tenantId) => {
    try {
        // Backend uses DELETE /properties/:propertyId/units/:unitId/remove-tenant/:tenantId
        const res = await api.delete(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}/remove-tenant/${tenantId}`);
        return res.data;
    } catch (error) {
        console.error("removeTenantFromUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};
