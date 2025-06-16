// frontend/src/services/vendorService.js

import api from "../api/axios.js"; // Corrected import path

/**
 * Retrieves all vendors accessible by the authenticated user, with filtering.
 * @returns {Promise<object[]>} An array of vendor objects.
 */
export const getAllVendors = async () => {
    try {
        const res = await api.get("/vendors");
        return res.data;
    } catch (error) {
        console.error("getAllVendors error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Retrieves details for a specific vendor.
 * @param {string} vendorId - The ID of the vendor.
 * @returns {Promise<object>} The vendor object.
 */
export const getVendorById = async (vendorId) => {
    try {
        const res = await api.get(`/vendors/${vendorId}`);
        return res.data;
    } catch (error) {
        console.error("getVendorById error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Adds a new vendor.
 * @param {object} vendorData - Data for the new vendor: { name, phone, email, address, description, services }.
 * @returns {Promise<object>} The created vendor object.
 */
export const addVendor = async (vendorData) => {
    try {
        // Ensure services array values are lowercase
        const payload = {
            ...vendorData,
            services: vendorData.services ? vendorData.services : [],
        };
        const res = await api.post("/vendors", payload);
        return res.data;
    } catch (error) {
        console.error("addVendor error:", error.response?.data || error.message);
        throw error;
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
        const res = await api.put(`/vendors/${vendorId}`, payload);
        return res.data;
    } catch (error) {
        console.error("updateVendor error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Deletes a vendor.
 * @param {string} vendorId - The ID of the vendor to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteVendor = async (vendorId) => {
    try {
        const res = await api.delete(`/vendors/${vendorId}`);
        return res.data;
    } catch (error) {
        console.error("deleteVendor error:", error.response?.data || error.message);
        throw error;
    }
};
