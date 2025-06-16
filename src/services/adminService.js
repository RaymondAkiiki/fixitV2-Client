import api from "../api/axios";

const ADMIN_BASE = "/admin";

const adminService = {
  // --- Dashboard & Statistics ---
  getDashboardStatistics: () => {
    return api.get(`${ADMIN_BASE}/stats`);
  },

  getCurrentAdminUser: () => {
    return api.get(`${ADMIN_BASE}/me`);
  },

  // --- User Management ---
  listAllUsers: (params = {}) => {
    return api.get(`${ADMIN_BASE}/users`, { params });
  },

  getCurrentlyActiveUsers: () => {
    return api.get(`${ADMIN_BASE}/users/active`);
  },

  getUserDetailsAdmin: (userId) => {
    return api.get(`${ADMIN_BASE}/users/${userId}`);
  },

  updateUserRole: (userId, role) => {
    return api.put(`${ADMIN_BASE}/users/${userId}/role`, { role });
  },

  toggleUserActiveStatus: (userId, isActive) => {
    return api.put(`${ADMIN_BASE}/users/${userId}/status`, { isActive });
  },

  manuallyApproveUser: (userId) => {
    return api.put(`${ADMIN_BASE}/users/${userId}/approve`);
  },

  deleteUser: (userId) => {
    return api.delete(`${ADMIN_BASE}/users/${userId}`);
  },

  // --- Property & Unit Management ---
  listAllPropertiesAdmin: (params = {}) => {
    return api.get(`${ADMIN_BASE}/properties`, { params });
  },

  getPropertyDetailsAdmin: (propertyId) => {
    return api.get(`${ADMIN_BASE}/properties/${propertyId}`);
  },

  listAllUnitsAdmin: (params = {}) => {
    return api.get(`${ADMIN_BASE}/units`, { params });
  },

  // --- Maintenance Request Management ---
  listAllRequestsAdmin: (params = {}) => {
    return api.get(`${ADMIN_BASE}/requests`, { params });
  },

  getRequestDetailsAdmin: (requestId) => {
    return api.get(`${ADMIN_BASE}/requests/${requestId}`);
  },

  getRequestAnalytics: (params = {}) => {
    return api.get(`${ADMIN_BASE}/requests/analytics`, { params });
  },

  // --- Vendor Management ---
  listAllVendorsAdmin: (params = {}) => {
    return api.get(`${ADMIN_BASE}/vendors`, { params });
  },

  getVendorDetailsAdmin: (vendorId) => {
    return api.get(`${ADMIN_BASE}/vendors/${vendorId}`);
  },

  // --- Invite Management ---
  listAllInvitesAdmin: (params = {}) => {
    return api.get(`${ADMIN_BASE}/invites`, { params });
  },

  resendInviteAdmin: (inviteId) => {
    return api.post(`${ADMIN_BASE}/invites/${inviteId}/resend`);
  },

  revokeInviteAdmin: (inviteId) => {
    return api.delete(`${ADMIN_BASE}/invites/${inviteId}/revoke`);
  },

  // --- Audit Log Management ---
  getAuditLogsAdmin: (params = {}) => {
    return api.get(`${ADMIN_BASE}/audit-logs`, { params });
  },

  // --- System Health & Notifications ---
  getSystemHealthSummary: () => {
    return api.get(`${ADMIN_BASE}/system-health`);
  },

  sendSystemBroadcastNotification: (notificationData) => {
    return api.post(`${ADMIN_BASE}/notifications/broadcast`, notificationData);
  },

  // --- Media Management ---
  listAllMediaAdmin: (params = {}) => {
    return api.get(`${ADMIN_BASE}/media/all`, { params });
  },

  deleteMediaFileAdmin: (requestId, mediaId) => {
    return api.delete(`${ADMIN_BASE}/media/${requestId}/${mediaId}`);
  },

  getMediaStorageStats: () => {
    return api.get(`${ADMIN_BASE}/media/stats`);
  },
};

export default adminService;