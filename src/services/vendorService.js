// client/src/services/vendorService.js

import api from "../api/axios.js"; // Corrected import path

const VENDOR_BASE_URL = '/vendors';

/**
 * Retrieves all vendors accessible by the authenticated user, with filtering.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., status, serviceTag, propertyId, search, page, limit).
 * @returns {Promise<object[]>} An array of vendor objects.
 */
export const getAllVendors = async (params = {}) => {
    try {
        const res = await api.get(VENDOR_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getAllVendors error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific vendor.
 * @param {string} vendorId - The ID of the vendor.
 * @returns {Promise<object>} The vendor object.
 */
export const getVendorById = async (vendorId) => {
    try {
        const res = await api.get(`${VENDOR_BASE_URL}/${vendorId}`);
        return res.data;
    } catch (error) {
        console.error("getVendorById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new vendor.
 * @param {object} vendorData - Data for the new vendor: { name, phone, email, address, description, services }.
 * @returns {Promise<object>} The created vendor object.
 */
export const createVendor = async (vendorData) => { // Renamed from addVendor
    try {
        // Ensure services array values are lowercase
        const payload = {
            ...vendorData,
            services: vendorData.services ? vendorData.services.map(s => String(s).toLowerCase()) : [],
        };
        const res = await api.post(VENDOR_BASE_URL, payload);
        return res.data;
    } catch (error) {
        console.error("createVendor error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific vendor.
 * @param {string} vendorId - The ID of the vendor to update.
 * @param {object} vendorData - Data to update.
 * @returns {Promise<object>} The updated vendor object.
 */
export const updateVendor = async (vendorId, vendorData) => {
    try {
        // Ensure services array values are lowercase if provided
        const payload = { ...vendorData };
        if (payload.services) {
            payload.services = payload.services.map(s => String(s).toLowerCase());
        }
        const res = await api.put(`${VENDOR_BASE_URL}/${vendorId}`, payload);
        return res.data;
    } catch (error) {
        console.error("updateVendor error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a vendor.
 * @param {string} vendorId - The ID of the vendor to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteVendor = async (vendorId) => {
    try {
        const res = await api.delete(`${VENDOR_BASE_URL}/${vendorId}`);
        return res.data;
    } catch (error) {
        console.error("deleteVendor error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Rates a vendor's performance.
 * @param {string} vendorId - The ID of the vendor to rate.
 * @param {object} ratingData - Data for the rating: { score: number, comment?: string, requestId?: string }.
 * @returns {Promise<object>} Success message.
 */
export const rateVendor = async (vendorId, ratingData) => {
    try {
        // Assuming backend has POST /vendors/:id/rate
        const res = await api.post(`${VENDOR_BASE_URL}/${vendorId}/rate`, ratingData);
        return res.data;
    } catch (error) {
        console.error("rateVendor error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deactivates a vendor.
 * @param {string} vendorId - The ID of the vendor to deactivate.
 * @returns {Promise<object>} Updated vendor object.
 */
export const deactivateVendor = async (vendorId) => {
    try {
        const res = await api.put(`${VENDOR_BASE_URL}/${vendorId}/deactivate`);
        return res.data;
    } catch (error) {
        console.error("deactivateVendor error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};
