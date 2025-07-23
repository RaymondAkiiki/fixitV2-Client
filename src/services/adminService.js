// client/src/services/adminService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'adminService';
const ADMIN_BASE_URL = "/api/admin";

/**
 * Helper to create standardized GET requests with cancellation support
 * @param {string} endpoint - API endpoint
 * @returns {function} Function to make the request
 */
const createGetRequest = (endpoint) => async (idOrParams = {}, signal) => {
    let url = `${ADMIN_BASE_URL}${endpoint}`;
    const config = { signal };

    // If first parameter is a string ID, append it to URL
    // Otherwise, treat it as query parameters
    if (typeof idOrParams === 'string' || idOrParams instanceof String) {
        url = `${url}/${idOrParams}`;
    } else if (typeof idOrParams === 'object' && Object.keys(idOrParams).length > 0) {
        config.params = idOrParams;
    }

    try {
        const res = await api.get(url, config);
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, `GET ${endpoint}`, { 
            id: typeof idOrParams === 'string' ? idOrParams : null,
            params: typeof idOrParams === 'object' ? Object.keys(idOrParams) : null,
            success: meta.success
        });
        
        return {
            data,
            pagination: {
                page: meta.page || 1,
                limit: meta.limit || 10,
                total: meta.total || 0,
                pages: meta.pages || 1
            }
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error(`Error fetching from ${url}:`, error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Helper to create standardized POST, PUT, DELETE requests
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @returns {function} Function to make the request
 */
const createMutationRequest = (method, endpoint) => async (idOrData, data = null, signal) => {
    let url = `${ADMIN_BASE_URL}${endpoint}`;
    let payload = data;
    const config = { signal };
    
    // Handle ID in URL if provided
    if (typeof idOrData === 'string' || idOrData instanceof String) {
        url = `${url}/${idOrData}`;
    } 
    // If no second parameter but first is an object, it's the payload
    else if (data === null && typeof idOrData === 'object') {
        payload = idOrData;
    }
    
    try {
        const res = await api[method](url, payload, config);
        const { data: responseData, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, `${method.toUpperCase()} ${endpoint}`, { 
            id: typeof idOrData === 'string' ? idOrData : null,
            success: meta.success,
            message: meta.message
        });
        
        return {
            success: meta.success,
            message: meta.message,
            data: responseData
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error(`Error with ${method.toUpperCase()} to ${url}:`, error);
        throw error.response?.data?.message || error.message;
    }
};

// === Dashboard & System Management ===
export const getDashboardStatistics = createGetRequest('/stats');
export const getSystemHealthSummary = createGetRequest('/system-health');
export const getMediaStorageStats = createGetRequest('/media/stats');
export const sendSystemBroadcastNotification = createMutationRequest('post', '/notifications/broadcast');
export const getCurrentlyActiveUsers = createGetRequest('/users/active');

// === User Management ===
export const getAllUsers = createGetRequest('/users');
export const getUserById = createGetRequest('/users');
export const createUser = createMutationRequest('post', '/users');
export const updateUser = createMutationRequest('put', '/users');
export const deactivateUser = (userId, signal) => createMutationRequest('put', `/users/${userId}/deactivate`)({}, null, signal);
export const activateUser = (userId, signal) => createMutationRequest('put', `/users/${userId}/activate`)({}, null, signal);
export const approveUser = (userId, signal) => createMutationRequest('put', `/users/${userId}/approve`)({}, null, signal);
export const resetUserPassword = (userId, newPassword, signal) => 
    createMutationRequest('post', `/users/${userId}/reset-password`)({ newPassword }, null, signal);

// === Property Management ===
export const getAllProperties = createGetRequest('/properties');
export const getPropertyById = createGetRequest('/properties');
export const createProperty = createMutationRequest('post', '/properties');
export const updateProperty = createMutationRequest('put', '/properties');
export const deactivateProperty = (propertyId, signal) => 
    createMutationRequest('put', `/properties/${propertyId}/deactivate`)({}, null, signal);

// === Unit Management ===
export const getAllUnits = createGetRequest('/units');
export const getUnitById = createGetRequest('/units');
export const createUnit = createMutationRequest('post', '/units');
export const updateUnit = createMutationRequest('put', '/units');
export const deactivateUnit = (unitId, signal) => 
    createMutationRequest('put', `/units/${unitId}/deactivate`)({}, null, signal);

// === Maintenance Request Management ===
export const getAllRequests = createGetRequest('/requests');
export const getRequestAnalytics = createGetRequest('/requests/analytics');
export const getRequestById = createGetRequest('/requests');
export const updateRequestStatus = (requestId, status, signal) => 
    createMutationRequest('put', `/requests/${requestId}/status`)({ status }, null, signal);
export const assignRequest = (requestId, assignmentData, signal) => 
    createMutationRequest('put', `/requests/${requestId}/assign`)(assignmentData, null, signal);
export const addCommentToRequest = (requestId, commentData, signal) => 
    createMutationRequest('post', `/requests/${requestId}/comments`)(commentData, null, signal);

// === Vendor Management ===
export const getAllVendors = createGetRequest('/vendors');
export const getVendorById = createGetRequest('/vendors');
export const createVendor = createMutationRequest('post', '/vendors');
export const updateVendor = createMutationRequest('put', '/vendors');
export const deactivateVendor = (vendorId, signal) => 
    createMutationRequest('put', `/vendors/${vendorId}/deactivate`)({}, null, signal);

// === Invite Management ===
export const getAllInvites = createGetRequest('/invites');
export const getInviteById = createGetRequest('/invites');
export const createInvite = createMutationRequest('post', '/invites');
export const resendInvite = (inviteId, signal) => 
    createMutationRequest('post', `/invites/${inviteId}/resend`)({}, null, signal);
export const revokeInvite = (inviteId, signal) => 
    createMutationRequest('put', `/invites/${inviteId}/revoke`)({}, null, signal);

// === Audit Log Management ===
export const getAuditLogs = createGetRequest('/audit-logs');

// === Media Management ===
export const getAllMedia = createGetRequest('/media');
export const deleteMedia = createMutationRequest('delete', '/media');

// === Lease Management ===
export const getAllLeases = createGetRequest('/leases');
export const getLeaseById = createGetRequest('/leases');
export const createLease = createMutationRequest('post', '/leases');
export const updateLease = createMutationRequest('put', '/leases');
export const terminateLease = (leaseId, signal) => 
    createMutationRequest('put', `/leases/${leaseId}/terminate`)({}, null, signal);

// === Rent Management ===
export const getAllRents = createGetRequest('/rents');
export const getRentById = createGetRequest('/rents');
export const recordRentPayment = createMutationRequest('post', '/rents');
export const updateRentPayment = createMutationRequest('put', '/rents');

// === Scheduled Maintenance Management ===
export const getAllScheduledMaintenances = createGetRequest('/scheduled-maintenances');
export const getScheduledMaintenanceById = createGetRequest('/scheduled-maintenances');
export const createScheduledMaintenance = createMutationRequest('post', '/scheduled-maintenances');
export const updateScheduledMaintenance = createMutationRequest('put', '/scheduled-maintenances');
export const pauseScheduledMaintenance = (maintenanceId, signal) => 
    createMutationRequest('put', `/scheduled-maintenances/${maintenanceId}/pause`)({}, null, signal);
export const resumeScheduledMaintenance = (maintenanceId, signal) => 
    createMutationRequest('put', `/scheduled-maintenances/${maintenanceId}/resume`)({}, null, signal);

// === Property User Association Management ===
export const getAllPropertyUsers = createGetRequest('/property-users');
export const getPropertyUserById = createGetRequest('/property-users');
export const createPropertyUser = createMutationRequest('post', '/property-users');
export const updatePropertyUser = createMutationRequest('put', '/property-users');
export const deactivatePropertyUser = (propertyUserId, signal) => 
    createMutationRequest('put', `/property-users/${propertyUserId}/deactivate`)({}, null, signal);

// === Comment Management ===
export const getAllComments = createGetRequest('/comments');
export const deleteComment = createMutationRequest('delete', '/comments');

/**
 * Formats a response with pagination information for consistent structure
 * @param {Object} data - Response data
 * @param {Object} pagination - Pagination information
 * @returns {Object} Formatted response
 */
const formatPaginatedResponse = (data, pagination) => {
    return {
        data,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: pagination.pages
    };
};

/**
 * Formats user data for the client application
 * @param {Object} user - User data
 * @returns {Object} Formatted user
 */
export const formatUser = (user) => {
    if (!user) return null;
    
    return {
        ...user,
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
        fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        roleDisplay: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User',
        statusDisplay: user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1).replace(/_/g, ' ') : 'Unknown',
        isActive: user.isActive || false,
        createdAtFormatted: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown',
        lastLoginFormatted: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
    };
};

/**
 * Formats property data for the client application
 * @param {Object} property - Property data
 * @returns {Object} Formatted property
 */
export const formatProperty = (property) => {
    if (!property) return null;
    
    const address = property.address || {};
    const fullAddress = [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country
    ].filter(Boolean).join(', ');
    
    return {
        ...property,
        fullAddress,
        typeDisplay: property.propertyType ? 
            property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) : 
            'Residential',
        unitCount: property.unitCount || 0,
        statusDisplay: property.isActive ? 'Active' : 'Inactive',
        statusClass: property.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    };
};

// Export default object for convenience
export default {
    // Dashboard & System
    getDashboardStatistics,
    getSystemHealthSummary,
    getMediaStorageStats,
    sendSystemBroadcastNotification,
    getCurrentlyActiveUsers,
    
    // User Management
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deactivateUser,
    activateUser,
    approveUser,
    resetUserPassword,
    
    // Property Management
    getAllProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deactivateProperty,
    
    // Unit Management
    getAllUnits,
    getUnitById,
    createUnit,
    updateUnit,
    deactivateUnit,
    
    // Maintenance Request Management
    getAllRequests,
    getRequestAnalytics,
    getRequestById,
    updateRequestStatus,
    assignRequest,
    addCommentToRequest,
    
    // Vendor Management
    getAllVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deactivateVendor,
    
    // Invite Management
    getAllInvites,
    getInviteById,
    createInvite,
    resendInvite,
    revokeInvite,
    
    // Audit Log Management
    getAuditLogs,
    
    // Media Management
    getAllMedia,
    deleteMedia,
    
    // Lease Management
    getAllLeases,
    getLeaseById,
    createLease,
    updateLease,
    terminateLease,
    
    // Rent Management
    getAllRents,
    getRentById,
    recordRentPayment,
    updateRentPayment,
    
    // Scheduled Maintenance Management
    getAllScheduledMaintenances,
    getScheduledMaintenanceById,
    createScheduledMaintenance,
    updateScheduledMaintenance,
    pauseScheduledMaintenance,
    resumeScheduledMaintenance,
    
    // Property User Association Management
    getAllPropertyUsers,
    getPropertyUserById,
    createPropertyUser,
    updatePropertyUser,
    deactivatePropertyUser,
    
    // Comment Management
    getAllComments,
    deleteComment,
    
    // Utility functions
    formatUser,
    formatProperty,
    formatPaginatedResponse
};