// client/src/services/adminService.js

import api from "../api/axios.js";

const ADMIN_BASE_URL = "/admin";

// A helper to create a reusable function for making GET requests with cancellation support.
const createGetRequest = (endpoint) => async (idOrParams = {}, signal) => {
    let url = `${ADMIN_BASE_URL}${endpoint}`;
    const config = { signal };

    if (typeof idOrParams === 'string') {
        url = `${url}/${idOrParams}`;
    } else {
        config.params = idOrParams;
    }

    try {
        const res = await api.get(url, config);
        return res.data;
    } catch (error) {
        // Let the axios interceptor and calling component handle the error.
        throw error;
    }
};

// A helper to create a reusable function for POST, PUT, DELETE requests.
const createMutationRequest = (method, endpoint) => async (id, data) => {
    let url = `${ADMIN_BASE_URL}${endpoint}`;
    if (id) {
        url = `${url}/${id}`;
    }
    
    try {
        const res = await api[method](url, data);
        return res.data;
    } catch (error) {
        throw error;
    }
};

// === Dashboard & System ===
export const getDashboardStatistics = createGetRequest('/stats');
export const getSystemHealthSummary = createGetRequest('/system-health');
export const getMediaStorageStats = createGetRequest('/media/stats');
export const sendSystemBroadcastNotification = createMutationRequest('post', '/notifications/broadcast');

// === User Management ===
export const listAllUsersAdmin = createGetRequest('/users');
export const getUserDetailsAdmin = createGetRequest('/users');
export const createUserAdmin = createMutationRequest('post', '/users');
export const updateUserAdmin = createMutationRequest('put', '/users');
export const deactivateUserAdmin = createMutationRequest('put', '/users', '/deactivate');
export const activateUserAdmin = createMutationRequest('put', '/users', '/activate');
export const manuallyApproveUserAdmin = createMutationRequest('put', '/users', '/approve');
export const adminResetUserPassword = createMutationRequest('post', '/users', '/reset-password');
export const deleteUserAdmin = createMutationRequest('delete', '/users');

// === Property Management ===
export const listAllPropertiesAdmin = createGetRequest('/properties');
export const getPropertyDetailsAdmin = createGetRequest('/properties');
export const createPropertyAdmin = createMutationRequest('post', '/properties');
export const updatePropertyAdmin = createMutationRequest('put', '/properties');
export const deactivatePropertyAdmin = createMutationRequest('put', '/properties', '/deactivate');

// === Unit Management ===
export const listAllUnitsAdmin = createGetRequest('/units');
export const getUnitByIdAdmin = createGetRequest('/units');
export const createUnitAdmin = createMutationRequest('post', '/units');
export const updateUnitAdmin = createMutationRequest('put', '/units');
export const deactivateUnitAdmin = createMutationRequest('put', '/units', '/deactivate');

// === Vendor Management ===
export const listAllVendorsAdmin = createGetRequest('/vendors');
export const getVendorDetailsAdmin = createGetRequest('/vendors');
export const createVendorAdmin = createMutationRequest('post', '/vendors');
export const updateVendorAdmin = createMutationRequest('put', '/vendors');
export const deactivateVendorAdmin = createMutationRequest('put', '/vendors', '/deactivate');

// === Maintenance Request Management ===
export const listAllRequestsAdmin = createGetRequest('/requests');
export const getRequestAnalyticsAdmin = createGetRequest('/requests/analytics');
export const getRequestDetailsAdmin = createGetRequest('/requests');
export const updateRequestStatusAdmin = (requestId, status) => createMutationRequest('put', `/requests/${requestId}/status`) (null, { status });
export const assignRequestAdmin = (requestId, assignmentData) => createMutationRequest('put', `/requests/${requestId}/assign`) (null, assignmentData);
export const addCommentToRequestAdmin = (requestId, commentData) => createMutationRequest('post', `/requests/${requestId}/comments`) (null, commentData);

// === Lease Management ===
export const getAllLeasesAdmin = createGetRequest('/leases');
export const getLeaseByIdAdmin = createGetRequest('/leases');
export const createLeaseAdmin = createMutationRequest('post', '/leases');
export const updateLeaseAdmin = createMutationRequest('put', '/leases');
export const terminateLeaseAdmin = createMutationRequest('put', '/leases', '/terminate');

// === Rent Management ===
export const getAllRentsAdmin = createGetRequest('/rents');
export const getRentByIdAdmin = createGetRequest('/rents');
export const recordRentPaymentAdmin = createMutationRequest('post', '/rents');
export const updateRentPaymentAdmin = createMutationRequest('put', '/rents');

// === Scheduled Maintenance Management ===
export const getAllScheduledMaintenancesAdmin = createGetRequest('/scheduled-maintenances');
export const getScheduledMaintenanceByIdAdmin = createGetRequest('/scheduled-maintenances');
export const createScheduledMaintenanceAdmin = createMutationRequest('post', '/scheduled-maintenances');
export const updateScheduledMaintenanceAdmin = createMutationRequest('put', '/scheduled-maintenances');
export const pauseScheduledMaintenanceAdmin = createMutationRequest('put', '/scheduled-maintenances', '/pause');
export const resumeScheduledMaintenanceAdmin = createMutationRequest('put', '/scheduled-maintenances', '/resume');

// === Invite Management ===
export const getAllInvitesAdmin = createGetRequest('/invites');
export const getInviteByIdAdmin = createGetRequest('/invites');
export const createInviteAdmin = createMutationRequest('post', '/invites');
export const resendInviteAdmin = (inviteId) => createMutationRequest('post', `/invites/${inviteId}/resend`)();
export const revokeInviteAdmin = createMutationRequest('put', '/invites', '/revoke');

// === Comment & Media Management ===
export const getAllCommentsAdmin = createGetRequest('/comments');
export const deleteCommentAdmin = createMutationRequest('delete', '/comments');
export const getAllMediaAdmin = createGetRequest('/media');
export const deleteMediaAdmin = createMutationRequest('delete', '/media');

// === Property User Association Management ===
export const getAllPropertyUsersAdmin = createGetRequest('/property-users');
export const getPropertyUserByIdAdmin = createGetRequest('/property-users');
export const createPropertyUserAdmin = createMutationRequest('post', '/property-users');
export const updatePropertyUserAdmin = createMutationRequest('put', '/property-users');
export const deactivatePropertyUserAdmin = createMutationRequest('put', '/property-users', '/deactivate');