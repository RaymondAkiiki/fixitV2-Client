// client/src/services/onboardingService.js

import api from "../api/axios.js";

const ONBOARDING_BASE_URL = '/onboarding';

/**
 * Creates a new onboarding entry, potentially with file uploads.
 * @param {object} data - Onboarding data. Includes `documentFile` if a file is being uploaded.
 * @returns {Promise<object>} The created onboarding entry.
 */
export const createOnboarding = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            if (Array.isArray(data[key])) {
                data[key].forEach(item => formData.append(`${key}[]`, item));
            } else if (data[key] instanceof File) {
                formData.append('documentFile', data[key]); // Corrected field name to 'documentFile'
            } else {
                formData.append(key, data[key]);
            }
        }
        const res = await api.post(ONBOARDING_BASE_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    } catch (error) {
        console.error("createOnboarding error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves onboarding entries, with optional filtering.
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} An array of onboarding entries.
 */
export const getOnboarding = async (params = {}) => {
    try {
        const res = await api.get(ONBOARDING_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getOnboarding error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a specific onboarding entry by ID.
 * @param {string} onboardingId - The ID of the onboarding entry.
 * @returns {Promise<object>} The onboarding entry object.
 */
export const getOnboardingById = async (onboardingId) => {
    try {
        const res = await api.get(`${ONBOARDING_BASE_URL}/${onboardingId}`);
        return res.data;
    } catch (error) {
        console.error("getOnboardingById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a specific onboarding entry, potentially with file uploads.
 * @param {string} onboardingId - The ID of the onboarding entry to update.
 * @param {object} updates - The updates to apply. Includes `documentFile` if a file is being replaced.
 * @returns {Promise<object>} The updated onboarding entry.
 */
export const updateOnboarding = async (onboardingId, updates) => {
    try {
        const formData = new FormData();
        for (const key in updates) {
            if (Array.isArray(updates[key])) {
                updates[key].forEach(item => formData.append(`${key}[]`, item));
            } else if (updates[key] instanceof File) {
                formData.append('documentFile', updates[key]); // Corrected field name to 'documentFile'
            } else {
                formData.append(key, updates[key]);
            }
        }
        const res = await api.put(`${ONBOARDING_BASE_URL}/${onboardingId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    } catch (error) {
        console.error("updateOnboarding error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific onboarding entry.
 * @param {string} onboardingId - The ID of the onboarding entry to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteOnboarding = async (onboardingId) => {
    try {
        const res = await api.delete(`${ONBOARDING_BASE_URL}/${onboardingId}`);
        return res.data;
    } catch (error) {
        console.error("deleteOnboarding error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks an onboarding document as completed by a tenant.
 * @param {string} onboardingId - The ID of the onboarding document.
 * @returns {Promise<object>} Updated onboarding document.
 */
export const markOnboardingCompleted = async (onboardingId) => {
    try {
        const res = await api.patch(`${ONBOARDING_BASE_URL}/${onboardingId}/complete`);
        return res.data;
    } catch (error) {
        console.error("markOnboardingCompleted error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets download URL for an onboarding document.
 * @param {string} onboardingId - The ID of the onboarding document.
 * @returns {Promise<Blob>} The document as a Blob.
 */
export const getOnboardingDocumentDownloadUrl = async (onboardingId) => {
    try {
        const res = await api.get(`${ONBOARDING_BASE_URL}/${onboardingId}/download`, {
            responseType: 'blob', // Important for file downloads
        });
        return res.data;
    } catch (error) {
        console.error("getOnboardingDocumentDownloadUrl error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};