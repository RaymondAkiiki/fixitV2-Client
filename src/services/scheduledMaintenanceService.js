// client/src/services/scheduledMaintenanceService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'scheduledMaintenanceService';
const SCHEDULED_MAINTENANCE_BASE_URL = '/scheduled-maintenance';

/**
 * Formats a scheduled maintenance task for display purposes
 * @param {object} task - The task object from the API
 * @returns {object} Enhanced task object with formatted properties
 */
export const formatTask = (task) => {
    if (!task) return null;
    
    return {
        ...task,
        // Format status for display
        statusDisplay: getStatusDisplay(task.status),
        statusClass: getStatusClass(task.status),
        // Format dates
        scheduledDateFormatted: new Date(task.scheduledDate).toLocaleDateString(),
        createdAtFormatted: new Date(task.createdAt).toLocaleDateString(),
        updatedAtFormatted: new Date(task.updatedAt).toLocaleDateString(),
        lastExecutedAtFormatted: task.lastExecutedAt ? new Date(task.lastExecutedAt).toLocaleDateString() : null,
        nextDueDateFormatted: task.nextDueDate ? new Date(task.nextDueDate).toLocaleDateString() : null,
        // Format category and frequency
        categoryDisplay: getCategoryDisplay(task.category),
        frequencyDisplay: getFrequencyDisplay(task.frequency, task.recurring),
        // Get creator/assignee details
        creatorName: getCreatorName(task),
        assigneeName: getAssigneeName(task),
        propertyName: task.property?.name || 'Unknown Property',
        unitName: task.unit?.unitName || 'No Unit'
    };
};

/**
 * Gets display text for task status
 * @param {string} status - Status value
 * @returns {string} Display text
 */
const getStatusDisplay = (status) => {
    switch(status?.toLowerCase()) {
        case 'scheduled': return 'Scheduled';
        case 'in_progress': return 'In Progress';
        case 'completed': return 'Completed';
        case 'paused': return 'Paused';
        case 'cancelled': return 'Cancelled';
        default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
};

/**
 * Gets CSS class for task status
 * @param {string} status - Status value
 * @returns {string} CSS class
 */
const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
        case 'scheduled': return 'bg-blue-100 text-blue-800';
        case 'in_progress': return 'bg-yellow-100 text-yellow-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'paused': return 'bg-orange-100 text-orange-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
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
 * Gets display text for frequency
 * @param {object} frequency - Frequency object
 * @param {boolean} recurring - Whether task is recurring
 * @returns {string} Display text
 */
const getFrequencyDisplay = (frequency, recurring) => {
    if (!recurring) return 'One-time';
    if (!frequency || !frequency.type) return 'Unknown';
    
    const interval = frequency.interval || 1;
    
    switch(frequency.type.toLowerCase()) {
        case 'daily':
            return interval === 1 ? 'Daily' : `Every ${interval} days`;
        case 'weekly':
            return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
        case 'bi_weekly':
            return 'Bi-weekly';
        case 'monthly':
            return interval === 1 ? 'Monthly' : `Every ${interval} months`;
        case 'quarterly':
            return 'Quarterly';
        case 'yearly':
            return interval === 1 ? 'Yearly' : `Every ${interval} years`;
        case 'custom_days':
            if (Array.isArray(frequency.customDays) && frequency.customDays.length > 0) {
                return `Custom (${frequency.customDays.join(', ')} days)`;
            }
            return 'Custom schedule';
        default:
            return 'Custom';
    }
};

/**
 * Gets formatted creator name
 * @param {object} task - Task object
 * @returns {string} Creator name
 */
const getCreatorName = (task) => {
    if (!task) return 'Unknown';
    
    if (task.createdByPropertyUser?.user) {
        const user = task.createdByPropertyUser.user;
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
    }
    
    return 'Unknown Creator';
};

/**
 * Gets formatted assignee name
 * @param {object} task - Task object
 * @returns {string} Assignee name
 */
const getAssigneeName = (task) => {
    if (!task || !task.assignedTo) return 'Unassigned';
    
    if (task.assignedToModel === 'User' && task.assignedTo) {
        return `${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim() || 
            task.assignedTo.email || 'Unknown User';
    } else if (task.assignedToModel === 'Vendor' && task.assignedTo) {
        return task.assignedTo.name || 'Unknown Vendor';
    }
    
    return 'Unassigned';
};

/**
 * Creates a new scheduled maintenance task.
 * @param {object} taskData - Scheduled maintenance data.
 * @param {File[]} [files=[]] - Optional array of File objects for media upload.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The created task object.
 */
export const createScheduledMaintenance = async (taskData, files = [], signal) => {
    try {
        const formData = new FormData();
        
        // Append all text fields
        Object.keys(taskData).forEach(key => {
            const value = taskData[key];
            if (value === undefined || value === null) return;
            
            if (key === 'category' && typeof value === 'string') {
                formData.append(key, value.toLowerCase());
            } else if (key === 'frequency' && typeof value === 'object') {
                formData.append(key, JSON.stringify({
                    ...value,
                    type: value.type?.toLowerCase()
                }));
            } else {
                formData.append(key, value);
            }
        });
        
        // Append media files
        if (files && files.length > 0) {
            files.forEach(file => {
                formData.append('files', file);
            });
        }

        const res = await api.post(SCHEDULED_MAINTENANCE_BASE_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal
        });
        
        const { data } = extractApiResponse(res.data);
        
        // Format the task if it exists
        const formattedData = data ? formatTask(data) : null;
        
        logApiResponse(SERVICE_NAME, 'createScheduledMaintenance', { data: formattedData });
        
        return formattedData;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("createScheduledMaintenance error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves all scheduled maintenance tasks accessible to the authenticated user, with filtering.
 * @param {object} [params={}] - Query parameters for filtering.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} Paginated task objects with metadata.
 */
export const getAllScheduledMaintenance = async (params = {}, signal) => {
    try {
        const res = await api.get(SCHEDULED_MAINTENANCE_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Format each task in the data array
        const formattedTasks = Array.isArray(data) ? data.map(task => formatTask(task)) : [];
        
        logApiResponse(SERVICE_NAME, 'getAllScheduledMaintenance', { data: formattedTasks, meta });
        
        return {
            tasks: formattedTasks,
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
        
        console.error("getAllScheduledMaintenance error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The task object with formatted properties.
 */
export const getScheduledMaintenanceById = async (id, signal) => {
    try {
        const res = await api.get(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the task
        const formattedTask = data ? formatTask(data) : null;
        
        logApiResponse(SERVICE_NAME, 'getScheduledMaintenanceById', { data: formattedTask });
        
        return formattedTask;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("getScheduledMaintenanceById error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific scheduled maintenance task.
 * @param {string} id - The ID of the task to update.
 * @param {object} updates - Data to update.
 * @param {File[]} [files=[]] - Optional array of new File objects for media upload.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The updated task object.
 */
export const updateScheduledMaintenance = async (id, updates, files = [], signal) => {
    try {
        const formData = new FormData();
        
        // Append all update fields
        Object.keys(updates).forEach(key => {
            const value = updates[key];
            if (value === undefined || value === null) return;
            
            if ((key === 'category' || key === 'status') && typeof value === 'string') {
                formData.append(key, value.toLowerCase());
            } else if (key === 'frequency' && typeof value === 'object') {
                formData.append(key, JSON.stringify({
                    ...value,
                    type: value.type?.toLowerCase()
                }));
            } else {
                formData.append(key, value);
            }
        });
        
        // Append new media files
        if (files && files.length > 0) {
            files.forEach(file => {
                formData.append('files', file);
            });
        }

        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal
        });
        
        const { data } = extractApiResponse(res.data);
        
        // Format the updated task
        const formattedTask = data ? formatTask(data) : null;
        
        logApiResponse(SERVICE_NAME, 'updateScheduledMaintenance', { data: formattedTask });
        
        return formattedTask;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("updateScheduledMaintenance error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a scheduled maintenance task.
 * @param {string} id - The ID of the task to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteScheduledMaintenance = async (id) => {
    try {
        const res = await api.delete(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteScheduledMaintenance', response);
        
        return response;
    } catch (error) {
        console.error("deleteScheduledMaintenance error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Uploads additional media files to an existing scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @param {File[]} mediaFiles - Array of File objects to upload.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} Updated task with new media.
 */
export const uploadScheduledMaintenanceMedia = async (id, mediaFiles, signal) => {
    try {
        const formData = new FormData();
        
        if (mediaFiles && mediaFiles.length > 0) {
            mediaFiles.forEach(file => {
                formData.append('mediaFiles', file);
            });
        } else {
            throw new Error('No media files provided for upload.');
        }
        
        const res = await api.post(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/media`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            signal
        });
        
        const { data } = extractApiResponse(res.data);
        
        // Format the updated task
        const formattedTask = data ? formatTask(data) : null;
        
        logApiResponse(SERVICE_NAME, 'uploadScheduledMaintenanceMedia', { data: formattedTask });
        
        return formattedTask;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("uploadScheduledMaintenanceMedia error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific media file from a scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @param {string} mediaUrl - The URL of the media file to delete.
 * @returns {Promise<object>} Success message and updated task.
 */
export const deleteScheduledMaintenanceMedia = async (id, mediaUrl) => {
    try {
        const res = await api.delete(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/media`, { 
            data: { mediaUrl } 
        });
        
        const { data } = extractApiResponse(res.data);
        
        // Format the updated task
        const formattedTask = data ? formatTask(data) : null;
        
        logApiResponse(SERVICE_NAME, 'deleteScheduledMaintenanceMedia', { data: formattedTask });
        
        return formattedTask;
    } catch (error) {
        console.error("deleteScheduledMaintenanceMedia error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Adds a comment to a scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @param {string} message - The comment message.
 * @param {boolean} [isInternalNote=false] - Whether this is an internal note (only visible to management).
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The created comment.
 */
export const addScheduledMaintenanceComment = async (id, message, isInternalNote = false, signal) => {
    try {
        const res = await api.post(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/comments`, {
            message,
            isInternalNote
        }, { signal });
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'addScheduledMaintenanceComment', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("addScheduledMaintenanceComment error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a maintenance request from a scheduled maintenance task.
 * @param {string} id - The ID of the scheduled maintenance task.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} Object containing the created request and updated task.
 */
export const createRequestFromScheduledMaintenance = async (id, signal) => {
    try {
        const res = await api.post(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/create-request`, {}, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the task in the response if it exists
        if (data && data.task) {
            data.task = formatTask(data.task);
        }
        
        logApiResponse(SERVICE_NAME, 'createRequestFromScheduledMaintenance', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("createRequestFromScheduledMaintenance error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Enables a public link for a scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @param {number} [expiresInDays] - Optional number of days until the link expires.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The public link URL and success message.
 */
export const enableScheduledMaintenancePublicLink = async (id, expiresInDays, signal) => {
    try {
        const res = await api.post(
            `${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/enable-public-link`, 
            { expiresInDays }, 
            { signal }
        );
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'enableScheduledMaintenancePublicLink', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("enableScheduledMaintenancePublicLink error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Disables a public link for a scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @returns {Promise<object>} Success message.
 */
export const disableScheduledMaintenancePublicLink = async (id) => {
    try {
        const res = await api.post(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/disable-public-link`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'disableScheduledMaintenancePublicLink', response);
        
        return response;
    } catch (error) {
        console.error("disableScheduledMaintenancePublicLink error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets public view of a scheduled maintenance task by token.
 * @param {string} publicToken - The public token for the task.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} Public view data.
 */
export const getPublicScheduledMaintenanceView = async (publicToken, signal) => {
    try {
        const res = await api.get(`${SCHEDULED_MAINTENANCE_BASE_URL}/public/${publicToken}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the public view data with display properties
        const formattedData = data ? {
            ...data,
            statusDisplay: getStatusDisplay(data.status),
            statusClass: getStatusClass(data.status),
            categoryDisplay: getCategoryDisplay(data.category),
            frequencyDisplay: getFrequencyDisplay(data.frequency, data.recurring)
        } : null;
        
        logApiResponse(SERVICE_NAME, 'getPublicScheduledMaintenanceView', { data: formattedData });
        
        return formattedData;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("getPublicScheduledMaintenanceView error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a scheduled maintenance task via public link.
 * @param {string} publicToken - The public token for the task.
 * @param {object} updateData - Update data: { status?, commentMessage?, name, phone }.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} Success message.
 */
export const updatePublicScheduledMaintenance = async (publicToken, updateData, signal) => {
    try {
        const res = await api.post(
            `${SCHEDULED_MAINTENANCE_BASE_URL}/public/${publicToken}/update`, 
            updateData, 
            { signal }
        );
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updatePublicScheduledMaintenance', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("updatePublicScheduledMaintenance error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Pauses a scheduled maintenance task.
 * @param {string} id - The ID of the task to pause.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The updated task object.
 */
export const pauseScheduledMaintenance = async (id, signal) => {
    try {
        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/pause`, {}, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the updated task
        const formattedTask = data ? formatTask(data) : null;
        
        logApiResponse(SERVICE_NAME, 'pauseScheduledMaintenance', { data: formattedTask });
        
        return formattedTask;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("pauseScheduledMaintenance error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Resumes a paused scheduled maintenance task.
 * @param {string} id - The ID of the task to resume.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The updated task object.
 */
export const resumeScheduledMaintenance = async (id, signal) => {
    try {
        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/resume`, {}, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the updated task
        const formattedTask = data ? formatTask(data) : null;
        
        logApiResponse(SERVICE_NAME, 'resumeScheduledMaintenance', { data: formattedTask });
        
        return formattedTask;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('Request was canceled');
        }
        
        console.error("resumeScheduledMaintenance error:", error);
        throw error.response?.data?.message || error.message;
    }
};

export default {
    formatTask,
    createScheduledMaintenance,
    getAllScheduledMaintenance,
    getScheduledMaintenanceById,
    updateScheduledMaintenance,
    deleteScheduledMaintenance,
    uploadScheduledMaintenanceMedia,
    deleteScheduledMaintenanceMedia,
    addScheduledMaintenanceComment,
    createRequestFromScheduledMaintenance,
    enableScheduledMaintenancePublicLink,
    disableScheduledMaintenancePublicLink,
    getPublicScheduledMaintenanceView,
    updatePublicScheduledMaintenance,
    pauseScheduledMaintenance,
    resumeScheduledMaintenance
};