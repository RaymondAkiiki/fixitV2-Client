// client/src/services/mediaService.js

import api from "../api/axios.js";

const MEDIA_BASE_URL = '/media';

// Removed generic uploadMedia as backend routes indicate media uploads are tied to specific resources (e.g., requests, onboarding, rent proof)
// If a general media upload endpoint is added to backend /api/media, this function can be re-added.

/**
 * Retrieves a list of media files, with optional filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., relatedTo, relatedId, uploadedBy, mimeType, isPublic, search, page, limit).
 * @returns {Promise<object[]>} An array of media objects.
 */
export const getMedia = async (params = {}) => {
    try {
        const res = await api.get(MEDIA_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getMedia error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a single media record by ID.
 * @param {string} mediaId - The ID of the media file.
 * @returns {Promise<object>} The media object.
 */
export const getMediaById = async (mediaId) => {
    try {
        const res = await api.get(`${MEDIA_BASE_URL}/${mediaId}`);
        return res.data;
    } catch (error) {
        console.error("getMediaById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a media record's metadata.
 * @param {string} mediaId - The ID of the media file to update.
 * @param {object} updates - The updates to apply (e.g., description, tags, isPublic).
 * @returns {Promise<object>} The updated media object.
 */
export const updateMedia = async (mediaId, updates) => {
    try {
        const res = await api.put(`${MEDIA_BASE_URL}/${mediaId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateMedia error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific media file.
 * @param {string} mediaId - The ID of the media file to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteMedia = async (mediaId) => {
    try {
        const res = await api.delete(`${MEDIA_BASE_URL}/${mediaId}`);
        return res.data;
    } catch (error) {
        console.error("deleteMedia error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};
