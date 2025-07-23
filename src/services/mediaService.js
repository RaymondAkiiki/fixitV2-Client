// client/src/services/mediaService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'mediaService';
const MEDIA_BASE_URL = '/media';

/**
 * Retrieves a list of media files, with optional filtering.
 * @param {object} [params={}] - Query parameters for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Paginated list of media objects with metadata
 */
export const getMedia = async (params = {}, signal) => {
    try {
        const res = await api.get(MEDIA_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getMedia', { data, meta });
        
        return {
            data,
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.totalPages || Math.ceil((meta.total || 0) / (meta.limit || 10))
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        console.error("getMedia error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a single media record by ID.
 * @param {string} mediaId - The ID of the media file
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The media object
 */
export const getMediaById = async (mediaId, signal) => {
    try {
        const res = await api.get(`${MEDIA_BASE_URL}/${mediaId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getMediaById', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        console.error("getMediaById error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a media record's metadata.
 * @param {string} mediaId - The ID of the media file to update
 * @param {object} updates - The updates to apply
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The updated media object
 */
export const updateMedia = async (mediaId, updates, signal) => {
    try {
        const res = await api.put(`${MEDIA_BASE_URL}/${mediaId}`, updates, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateMedia', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        console.error("updateMedia error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific media file.
 * @param {string} mediaId - The ID of the media file to delete
 * @returns {Promise<object>} Success message
 */
export const deleteMedia = async (mediaId) => {
    try {
        const res = await api.delete(`${MEDIA_BASE_URL}/${mediaId}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteMedia', response);
        
        return response;
    } catch (error) {
        console.error("deleteMedia error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Get media usage statistics
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Media usage statistics
 */
export const getMediaStats = async (signal) => {
    try {
        const res = await api.get(`${MEDIA_BASE_URL}/stats`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getMediaStats', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        console.error("getMediaStats error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Get media files related to a specific resource
 * @param {string} resourceType - The type of resource
 * @param {string} resourceId - The ID of the resource
 * @param {object} [params={}] - Additional query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Paginated list of media objects
 */
export const getMediaByResource = async (resourceType, resourceId, params = {}, signal) => {
    try {
        const res = await api.get(`${MEDIA_BASE_URL}/by-resource/${resourceType}/${resourceId}`, {
            params,
            signal
        });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getMediaByResource', { data, meta });
        
        return {
            data,
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.totalPages || Math.ceil((meta.total || 0) / (meta.limit || 10))
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        console.error("getMediaByResource error:", error);
        throw error.response?.data?.message || error.message;
    }
};

export default {
    getMedia,
    getMediaById,
    updateMedia,
    deleteMedia,
    getMediaStats,
    getMediaByResource
};