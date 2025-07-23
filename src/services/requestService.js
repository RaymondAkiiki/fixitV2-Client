// client/src/services/requestService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'requestService';
const REQUEST_BASE_URL = '/requests';

/**
 * Formats a request object for display purposes
 * @param {object} request - The request object from the API
 * @returns {object} Enhanced request object with formatted properties
 */
export const formatRequest = (request) => {
    if (!request) return null;
    
    return {
        ...request,
        // Format status for display
        statusDisplay: getStatusDisplay(request.status),
        statusClass: getStatusClass(request.status),
        // Format dates
        createdAtFormatted: new Date(request.createdAt).toLocaleDateString(),
        updatedAtFormatted: new Date(request.updatedAt).toLocaleDateString(),
        resolvedAtFormatted: request.resolvedAt ? new Date(request.resolvedAt).toLocaleDateString() : null,
        // Format categories and priorities
        categoryDisplay: getCategoryDisplay(request.category),
        priorityDisplay: getPriorityDisplay(request.priority),
        // Get user/creator details
        creatorName: getCreatorName(request),
        assigneeName: getAssigneeName(request),
        propertyName: request.property?.name || 'Unknown Property',
        unitName: request.unit?.unitName || 'No Unit'
    };
};

/**
 * Gets display text for request status
 * @param {string} status - Status value
 * @returns {string} Display text
 */
const getStatusDisplay = (status) => {
    switch(status?.toLowerCase()) {
        case 'new': return 'New';
        case 'assigned': return 'Assigned';
        case 'in_progress': return 'In Progress';
        case 'completed': return 'Completed';
        case 'verified': return 'Verified';
        case 'reopened': return 'Reopened';
        case 'archived': return 'Archived';
        default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
};

/**
 * Gets CSS class for request status
 * @param {string} status - Status value
 * @returns {string} CSS class
 */
const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
        case 'new': return 'bg-blue-100 text-blue-800';
        case 'assigned': return 'bg-purple-100 text-purple-800';
        case 'in_progress': return 'bg-yellow-100 text-yellow-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'verified': return 'bg-green-200 text-green-900';
        case 'reopened': return 'bg-orange-100 text-orange-800';
        case 'archived': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Gets display text for category
 * @param {string} category - Category value
 * @returns {string} Display text
 */
const getCategoryDisplay = (category) => {
    switch(category?.toLowerCase()) {
        case 'plumbing': return 'Plumbing';
        case 'electrical': return 'Electrical';
        case 'hvac': return 'HVAC';
        case 'appliance': return 'Appliance';
        case 'structural': return 'Structural';
        case 'pest': return 'Pest Control';
        case 'cleaning': return 'Cleaning';
        case 'safety': return 'Safety & Security';
        case 'general': return 'General Maintenance';
        default: return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown';
    }
};

/**
 * Gets display text for priority
 * @param {string} priority - Priority value
 * @returns {string} Display text
 */
const getPriorityDisplay = (priority) => {
    switch(priority?.toLowerCase()) {
        case 'emergency': return 'Emergency';
        case 'high': return 'High';
        case 'medium': return 'Medium';
        case 'low': return 'Low';
        default: return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Unknown';
    }
};

/**
 * Gets formatted creator name
 * @param {object} request - Request object
 * @returns {string} Creator name
 */
const getCreatorName = (request) => {
    if (!request) return 'Unknown';
    
    if (request.createdByPropertyUser?.user) {
        const user = request.createdByPropertyUser.user;
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
    }
    
    return 'Unknown Creator';
};

/**
 * Gets formatted assignee name
 * @param {object} request - Request object
 * @returns {string} Assignee name
 */
const getAssigneeName = (request) => {
    if (!request || !request.assignedTo) return 'Unassigned';
    
    if (request.assignedToModel === 'User' && request.assignedTo) {
        return `${request.assignedTo.firstName || ''} ${request.assignedTo.lastName || ''}`.trim() || 
            request.assignedTo.email || 'Unknown User';
    } else if (request.assignedToModel === 'Vendor' && request.assignedTo) {
        return request.assignedTo.name || 'Unknown Vendor';
    }
    
    return 'Unassigned';
};

/**
 * Retrieves all maintenance requests accessible to the authenticated user, with filtering.
 * @param {object} [params={}] - Query parameters for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Paginated request objects with metadata
 */
export const getAllRequests = async (params = {}, signal) => {
    try {
        const res = await api.get(REQUEST_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Format each request in the data array
        const formattedRequests = Array.isArray(data) ? data.map(request => formatRequest(request)) : [];
        
        logApiResponse(SERVICE_NAME, 'getAllRequests', { 
            requests: formattedRequests, 
            total: meta.total, 
            page: meta.page, 
            limit: meta.limit 
        });
        
        return {
            requests: formattedRequests,
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.pages || Math.ceil((meta.total || 0) / (meta.limit || 10))
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("getAllRequests error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific maintenance request.
 * @param {string} id - The ID of the request
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The request object with formatted properties
 */
export const getRequestById = async (id, signal) => {
    try {
        const res = await api.get(`${REQUEST_BASE_URL}/${id}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the request
        const formattedRequest = formatRequest(data);
        
        logApiResponse(SERVICE_NAME, 'getRequestById', { request: formattedRequest });
        
        return formattedRequest;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("getRequestById error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new maintenance request.
 * @param {object} requestData - Request details
 * @param {File[]} [files=[]] - Optional array of File objects for media upload
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The created request object
 */
export const createRequest = async (requestData, files = [], signal) => {
    try {
        const formData = new FormData();
        
        // Append all text fields
        Object.keys(requestData).forEach(key => {
            if (requestData[key] !== undefined && requestData[key] !== null) {
                // Ensure enum values are lowercase for backend
                if (['category', 'priority'].includes(key)) {
                    formData.append(key, String(requestData[key]).toLowerCase());
                } else {
                    formData.append(key, requestData[key]);
                }
            }
        });
        
        // Append media files
        if (files && files.length > 0) {
            files.forEach(file => {
                formData.append('files', file);
            });
        }

        const res = await api.post(REQUEST_BASE_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            signal
        });
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createRequest', { request: data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("createRequest error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific maintenance request.
 * @param {string} id - The ID of the request to update
 * @param {object} updates - Data to update
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The updated request object
 */
export const updateRequest = async (id, updates, signal) => {
    try {
        // Ensure enum values are lowercase for backend
        const payload = { ...updates };
        if (payload.category) payload.category = payload.category.toLowerCase();
        if (payload.priority) payload.priority = payload.priority.toLowerCase();
        if (payload.status) payload.status = payload.status.toLowerCase();

        const res = await api.put(`${REQUEST_BASE_URL}/${id}`, payload, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the updated request
        const formattedRequest = formatRequest(data);
        
        logApiResponse(SERVICE_NAME, 'updateRequest', { request: formattedRequest });
        
        return formattedRequest;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("updateRequest error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a maintenance request.
 * @param {string} id - The ID of the request to delete
 * @returns {Promise<object>} Success message
 */
export const deleteRequest = async (id) => {
    try {
        const res = await api.delete(`${REQUEST_BASE_URL}/${id}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteRequest', response);
        
        return response;
    } catch (error) {
        console.error("deleteRequest error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a request to a user (internal staff) or a vendor.
 * @param {string} id - The ID of the request
 * @param {object} assignmentData - Data: { assignedToId: string, assignedToModel: 'User' | 'Vendor' }
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The updated request object
 */
export const assignRequest = async (id, assignmentData, signal) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/assign`, assignmentData, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the updated request
        const formattedRequest = formatRequest(data);
        
        logApiResponse(SERVICE_NAME, 'assignRequest', { request: formattedRequest });
        
        return formattedRequest;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("assignRequest error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Uploads additional media files to an existing request.
 * @param {string} id - The ID of the request
 * @param {File[]} mediaFiles - Array of File objects to upload
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated request with new media
 */
export const uploadRequestMedia = async (id, mediaFiles, signal) => {
    try {
        const formData = new FormData();
        
        if (mediaFiles && mediaFiles.length > 0) {
            mediaFiles.forEach(file => {
                formData.append('mediaFiles', file);
            });
        } else {
            throw new Error('No media files provided for upload.');
        }
        
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/media`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            signal
        });
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'uploadRequestMedia', { success: true, data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("uploadRequestMedia error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific media file from a request.
 * @param {string} id - The ID of the request
 * @param {string} mediaUrl - The URL of the media file to delete
 * @returns {Promise<object>} Success message and updated request
 */
export const deleteRequestMedia = async (id, mediaUrl) => {
    try {
        const res = await api.delete(`${REQUEST_BASE_URL}/${id}/media`, { 
            data: { mediaUrl } 
        });
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteRequestMedia', { success: true, data });
        
        return data;
    } catch (error) {
        console.error("deleteRequestMedia error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Submits feedback for a completed request.
 * @param {string} id - The ID of the request
 * @param {object} feedbackData - Feedback data: { rating: number, comment?: string }
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Success message and updated request
 */
export const submitFeedback = async (id, feedbackData, signal) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/feedback`, feedbackData, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the updated request
        const formattedRequest = formatRequest(data);
        
        logApiResponse(SERVICE_NAME, 'submitFeedback', { request: formattedRequest });
        
        return formattedRequest;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("submitFeedback error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Enables a public link for a maintenance request.
 * @param {string} id - The ID of the request
 * @param {number} [expiresInDays] - Optional number of days until the link expires
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The public link URL and success message
 */
export const enableRequestPublicLink = async (id, expiresInDays, signal) => {
    try {
        const res = await api.post(
            `${REQUEST_BASE_URL}/${id}/enable-public-link`, 
            { expiresInDays }, 
            { signal }
        );
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'enableRequestPublicLink', { publicLink: data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("enableRequestPublicLink error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Disables a public link for a maintenance request.
 * @param {string} id - The ID of the request
 * @returns {Promise<object>} Success message
 */
export const disableRequestPublicLink = async (id) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/disable-public-link`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'disableRequestPublicLink', response);
        
        return response;
    } catch (error) {
        console.error("disableRequestPublicLink error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets public view of a request by token.
 * @param {string} publicToken - The public token for the request
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Public view data
 */
export const getPublicRequestView = async (publicToken, signal) => {
    try {
        const res = await api.get(`${REQUEST_BASE_URL}/public/${publicToken}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the public view data
        const formattedData = data ? {
            ...data,
            statusDisplay: getStatusDisplay(data.status),
            statusClass: getStatusClass(data.status),
            categoryDisplay: getCategoryDisplay(data.category),
            priorityDisplay: getPriorityDisplay(data.priority),
            createdAtFormatted: new Date(data.createdAt).toLocaleDateString(),
            updatedAtFormatted: new Date(data.updatedAt).toLocaleDateString()
        } : null;
        
        logApiResponse(SERVICE_NAME, 'getPublicRequestView', { data: formattedData });
        
        return formattedData;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("getPublicRequestView error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a request via public link.
 * @param {string} publicToken - The public token for the request
 * @param {object} updateData - Update data: { status?, commentMessage?, name, phone }
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Success message
 */
export const updatePublicRequest = async (publicToken, updateData, signal) => {
    try {
        const res = await api.post(
            `${REQUEST_BASE_URL}/public/${publicToken}/update`, 
            updateData, 
            { signal }
        );
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updatePublicRequest', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("updatePublicRequest error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Verifies a completed request.
 * @param {string} id - The ID of the request
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated request
 */
export const verifyRequest = async (id, signal) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/verify`, {}, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the updated request
        const formattedRequest = formatRequest(data);
        
        logApiResponse(SERVICE_NAME, 'verifyRequest', { request: formattedRequest });
        
        return formattedRequest;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("verifyRequest error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Reopens a request.
 * @param {string} id - The ID of the request
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated request
 */
export const reopenRequest = async (id, signal) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/reopen`, {}, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the updated request
        const formattedRequest = formatRequest(data);
        
        logApiResponse(SERVICE_NAME, 'reopenRequest', { request: formattedRequest });
        
        return formattedRequest;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("reopenRequest error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Archives a request.
 * @param {string} id - The ID of the request
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated request
 */
export const archiveRequest = async (id, signal) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/archive`, {}, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the updated request
        const formattedRequest = formatRequest(data);
        
        logApiResponse(SERVICE_NAME, 'archiveRequest', { request: formattedRequest });
        
        return formattedRequest;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("archiveRequest error:", error);
        throw error.response?.data?.message || error.message;
    }
};

export default {
    formatRequest,
    getAllRequests,
    getRequestById,
    createRequest,
    updateRequest,
    deleteRequest,
    assignRequest,
    uploadRequestMedia,
    deleteRequestMedia,
    submitFeedback,
    enableRequestPublicLink,
    disableRequestPublicLink,
    getPublicRequestView,
    updatePublicRequest,
    verifyRequest,
    reopenRequest,
    archiveRequest
};