// frontend/src/api/axios.js

import axios from "axios";

/**
 * Helper to get the current user object from localStorage.
 * This user object should ideally contain role and other non-sensitive profile data.
 */
const getUserFromLocalStorage = () => {
    try {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem("user"); // Clear potentially corrupted data
        return null;
    }
};

/**
 * Helper to get the JWT token from localStorage.
 */
const getTokenFromLocalStorage = () => {
    try {
        return localStorage.getItem("token");
    } catch (error) {
        console.error("Error retrieving token from localStorage:", error);
        localStorage.removeItem("token"); // Clear potentially corrupted data
        return null;
    }
};

/**
 * Create an Axios instance for all API requests.
 * `baseURL` is set from your VITE environment variable.
 * `withCredentials: false` is standard for JWT in headers (set to true if using cookies/sessions).
 */
const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_API_URL}/api`, // Use VITE_BACKEND_API_URL for backend
    withCredentials: false, // JWTs are typically sent in headers, not cookies
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request Interceptor:
 * - Attaches JWT token to every request in the Authorization header.
 * - For admin users, if a static admin token is provided in env, uses that token (for "system admin" use case).
 * - For other users (tenant, landlord, property manager), uses their own token from localStorage.
 * - This ensures the correct token is always sent for the currently logged-in user.
 */
api.interceptors.request.use(
    (config) => {
        const user = getUserFromLocalStorage();
        let token = getTokenFromLocalStorage();

        // Priority 1: If user is admin AND VITE_ADMIN_TOKEN is set, use the static admin token
        if (user && user.role === "admin" && import.meta.env.VITE_ADMIN_TOKEN) {
            token = import.meta.env.VITE_ADMIN_TOKEN;
        }

        // Priority 2: Use the token retrieved from localStorage if it exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * - Handles global API errors, specifically 401 Unauthorized responses.
 * - If a 401 is received, it means the token is expired or invalid.
 * - It clears token and user from localStorage and redirects to login page.
 * - This keeps your app secure and ensures users are re-authenticated if the token expires or is invalid.
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Unauthorized API call, session expired or invalid. Logging out.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
            localStorage.setItem('authError', 'Session expired or invalid. Please log in again.');
        }
        return Promise.reject(error); // Re-throw the error so it can be caught by individual API calls
    }
);

export default api;


// frontend/src/services/authService.js

import api from "../api/axios.js"; // Corrected import path

/**
 * Validates the current JWT token with the backend.
 * This will use the Axios interceptor to automatically attach the token.
 * @returns {Promise<object>} Returns { user: object, message: string } if valid, throws on error.
 */
export const validateToken = async () => {
    try {
        // Corrected to use /users/profile as per backend userRoutes.js
        const res = await api.get("/users/profile");
        return { user: res.data, message: "Token is valid." }; // Wrap user data and message
    } catch (error) {
        console.error("validateToken error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message; // Re-throw to be caught by AuthContext
    }
};

/**
 * Sends login credentials to the backend.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} Returns user data and token from backend.
 * Expected: { _id, name, email, role, approved, token, ...associations }
 */
export const loginUser = async (email, password) => {
    try {
        const res = await api.post("/auth/login", { email, password });
        return res.data; // This data includes the token that AuthContext needs
    } catch (error) {
        console.error("loginUser error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Registers a new user with the backend.
 * @param {object} userData - User registration details: { name, email, password, role }.
 * @returns {Promise<object>} Returns user data and token from backend.
 * Expected: { _id, name, email, role, token, ... }
 */
export const registerUser = async (userData) => {
    try {
        const res = await api.post("/auth/register", userData);
        return res.data;
    } catch (error) {
        console.error("registerUser error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Requests a password reset link for the given email.
 * @param {string} email - Email for which to reset password.
 * @returns {Promise<object>} Backend response message.
 */
export const requestPasswordReset = async (email) => {
    try {
        const res = await api.post("/auth/forgot-password", { email });
        return res.data;
    } catch (error) {
        console.error("requestPasswordReset error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Resets the user's password using a reset token.
 * @param {string} token - The password reset token received via email.
 * @param {string} newPassword - The new password.
 * @returns {Promise<object>} Backend response message.
 */
export const resetPassword = async (token, newPassword) => {
    try {
        // Backend uses PUT /auth/reset-password/:token
        const res = await api.put(`/auth/reset-password/${token}`, { newPassword });
        return res.data;
    } catch (error) {
        console.error("resetPassword error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Changes the logged-in user's password.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The desired new password.
 * @returns {Promise<object>} Backend response message.
 */
export const changePassword = async (currentPassword, newPassword) => {
    try {
        const res = await api.put("/auth/change-password", { currentPassword, newPassword }); // Backend uses PUT
        return res.data;
    } catch (error) {
        console.error("changePassword error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Logs out the current user.
 * @returns {Promise<object>} Backend response message.
 */
export const logoutUser = async () => {
    try {
        const res = await api.post("/auth/logout");
        return res.data;
    } catch (error) {
        console.error("logoutUser error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Requests email verification for the logged-in user.
 * @returns {Promise<object>} Backend response message.
 */
export const sendVerificationEmail = async () => {
    try {
        const res = await api.post("/auth/send-verification-email");
        return res.data;
    } catch (error) {
        console.error("sendVerificationEmail error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Verifies user email using a token.
 * @param {string} token - The verification token from the URL.
 * @returns {Promise<object>} Backend response message.
 */
export const verifyEmail = async (token) => {
    try {
        const res = await api.get(`/auth/verify-email/${token}`);
        return res.data;
    } catch (error) {
        console.error("verifyEmail error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/commentService.js

import api from "../api/axios.js"; // Corrected import path

const COMMENT_BASE_URL = '/comments';

/**
 * Adds a new comment to a specified resource (e.g., request, scheduled maintenance).
 * @param {object} data - Comment data: { contextType: 'request'|'scheduledmaintenance'|'property'|'unit', contextId: string, message: string, isExternal?: boolean, externalUserName?: string, externalUserEmail?: string, isInternalNote?: boolean, media?: string[] }
 * @returns {Promise<object>} The created comment object.
 */
export const addComment = async (data) => {
    try {
        // Ensure contextType is sent in lowercase to match backend enum
        const payload = {
            ...data,
            contextType: data.contextType.toLowerCase(),
        };
        const res = await api.post(COMMENT_BASE_URL, payload);
        return res.data;
    } catch (error) {
        console.error("addComment error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves comments for a specified resource.
 * @param {object} params - Query parameters: { contextType: 'request'|'scheduledmaintenance'|'property'|'unit', contextId: string }
 * @returns {Promise<object[]>} An array of comment objects.
 */
export const getComments = async (params) => {
    try {
        // Ensure contextType in params is sent in lowercase
        const queryParams = {
            ...params,
            contextType: params.contextType.toLowerCase(),
        };
        const res = await api.get(COMMENT_BASE_URL, { params: queryParams });
        return res.data;
    } catch (error) {
        console.error("getComments error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates an existing comment.
 * @param {string} commentId - The ID of the comment to update.
 * @param {object} updates - The updates to apply to the comment: { message?: string, isInternalNote?: boolean, media?: string[] }.
 * @returns {Promise<object>} The updated comment object.
 */
export const updateComment = async (commentId, updates) => {
    try {
        const res = await api.put(`${COMMENT_BASE_URL}/${commentId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateComment error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a comment.
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteComment = async (commentId) => {
    try {
        const res = await api.delete(`${COMMENT_BASE_URL}/${commentId}`);
        return res.data;
    } catch (error) {
        console.error("deleteComment error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/documentGenerationService.js

import api from "../api/axios.js";

const DOCUMENT_BASE_URL = '/documents';

/**
 * Generates a document based on provided data and template.
 * @param {object} data - Data for document generation: { documentType, data, options }
 * @returns {Promise<Blob>} The generated document as a Blob (e.g., PDF, DOCX).
 */
export const generateDocument = async (data) => {
    try {
        const res = await api.post(`${DOCUMENT_BASE_URL}/generate`, data, {
            responseType: 'blob', // Important for file downloads
        });
        return res.data;
    } catch (error) {
        console.error("generateDocument error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a list of available document templates.
 * @returns {Promise<object[]>} An array of template objects.
 */
export const getDocumentTemplates = async () => {
    try {
        const res = await api.get(`${DOCUMENT_BASE_URL}/templates`);
        return res.data;
    } catch (error) {
        console.error("getDocumentTemplates error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/inviteService.js

import api from "../api/axios.js";

const INVITE_BASE_URL = '/invites';

/**
 * Sends an invitation to a new user.
 * @param {object} inviteData - Data for the invite: { email, roles: string[], propertyId: string, unitId?: string }
 * @returns {Promise<object>} Backend response, usually includes inviteId and inviteLink.
 */
export const createInvite = async (inviteData) => { // Renamed from sendInvite to createInvite
    try {
        // Ensure role is sent in lowercase to match backend enum
        const payload = {
            ...inviteData,
            roles: inviteData.roles.map(role => role.toLowerCase()), // Ensure roles array values are lowercase
        };
        const res = await api.post(INVITE_BASE_URL, payload); // Corrected endpoint to /invites (POST)
        return res.data;
    } catch (error) {
        console.error("createInvite error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Fetches all invites.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., status, propertyId, email).
 * @returns {Promise<object[]>} Returns an array of invite objects.
 */
export const getAllInvites = async (params = {}) => {
    try {
        const res = await api.get(INVITE_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getAllInvites error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Cancels an invitation.
 * @param {string} inviteId - The ID of the invite to cancel.
 * @returns {Promise<object>} Returns a success message or error.
 */
export const cancelInvite = async (inviteId) => { // Renamed from revokeInvite to cancelInvite
    try {
        const res = await api.patch(`${INVITE_BASE_URL}/${inviteId}/cancel`); // Corrected to PATCH /invites/:id/cancel
        return res.data;
    } catch (error) {
        console.error("cancelInvite error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Resends an existing invite.
 * @param {string} inviteId - The ID of the invite to resend.
 * @returns {Promise<object>} Returns a success message or error.
 */
export const resendInvite = async (inviteId) => {
    try {
        const res = await api.post(`${INVITE_BASE_URL}/${inviteId}/resend`); // Corrected endpoint to /invites/:id/resend
        return res.data;
    } catch (error) {
        console.error("resendInvite error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

// Public invitation routes (no authentication required, handled by publicService.js)
// Moved verifyInviteToken and acceptInvite to publicService.js


// frontend/src/services/leaseService.js

import api from "./axios.js";

const LEASE_BASE_URL = '/leases';

/**
 * Creates a new lease agreement.
 * @param {object} leaseData - Data for the new lease.
 * @returns {Promise<object>} The created lease object.
 */
export const createLease = async (leaseData) => {
    try {
        const res = await api.post(LEASE_BASE_URL, leaseData);
        return res.data;
    } catch (error) {
        console.error("createLease error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a list of lease agreements.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., propertyId, unitId, tenantId, status, expiryStartDate, expiryEndDate, sortBy, sortOrder, page, limit).
 * @returns {Promise<object[]>} An array of lease objects.
 */
export const getLeases = async (params = {}) => {
    try {
        const res = await api.get(LEASE_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getLeases error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific lease agreement.
 * @param {string} leaseId - The ID of the lease.
 * @returns {Promise<object>} The lease object.
 */
export const getLeaseById = async (leaseId) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/${leaseId}`);
        return res.data;
    } catch (error) {
        console.error("getLeaseById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific lease agreement.
 * @param {string} leaseId - The ID of the lease to update.
 * @param {object} updates - Data to update.
 * @returns {Promise<object>} The updated lease object.
 */
export const updateLease = async (leaseId, updates) => {
    try {
        const res = await api.put(`${LEASE_BASE_URL}/${leaseId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateLease error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a lease agreement.
 * @param {string} leaseId - The ID of the lease to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteLease = async (leaseId) => {
    try {
        const res = await api.delete(`${LEASE_BASE_URL}/${leaseId}`);
        return res.data;
    } catch (error) {
        console.error("deleteLease error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves upcoming lease expiries.
 * @param {object} [params={}] - Query parameters: propertyId, unitId, daysAhead.
 * @returns {Promise<object[]>} An array of expiring lease objects.
 */
export const getExpiringLeases = async (params = {}) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/expiring`, { params });
        return res.data;
    } catch (error) {
        console.error("getExpiringLeases error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks a lease as renewal notice sent.
 * @param {string} leaseId - The ID of the lease.
 * @returns {Promise<object>} Updated lease object.
 */
export const markRenewalNoticeSent = async (leaseId) => {
    try {
        const res = await api.put(`${LEASE_BASE_URL}/${leaseId}/mark-renewal-sent`);
        return res.data;
    } catch (error) {
        console.error("markRenewalNoticeSent error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Uploads a lease document.
 * @param {string} leaseId - The ID of the lease.
 * @param {File} documentFile - The lease document file.
 * @returns {Promise<object>} Updated lease object with document info.
 */
export const uploadLeaseDocument = async (leaseId, documentFile) => {
    try {
        const formData = new FormData();
        formData.append('documentFile', documentFile); // 'documentFile' matches backend field name
        const res = await api.post(`${LEASE_BASE_URL}/${leaseId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (error) {
        console.error("uploadLeaseDocument error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Downloads a lease document.
 * @param {string} leaseId - The ID of the lease.
 * @param {string} documentId - The ID of the document to download.
 * @returns {Promise<Blob>} The document as a Blob.
 */
export const downloadLeaseDocument = async (leaseId, documentId) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/${leaseId}/documents/${documentId}/download`, {
            responseType: 'blob',
        });
        return res.data;
    } catch (error) {
        console.error("downloadLeaseDocument error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Generates a lease-related document (e.g., renewal notice, exit letter).
 * @param {string} leaseId - The ID of the lease.
 * @param {string} documentType - The type of document to generate ('renewal_notice' or 'exit_letter').
 * @returns {Promise<Blob>} The generated document as a Blob.
 */
export const generateLeaseDocument = async (leaseId, documentType) => {
    try {
        const res = await api.post(`${LEASE_BASE_URL}/${leaseId}/generate-document`, { documentType }, {
            responseType: 'blob',
        });
        return res.data;
    } catch (error) {
        console.error("generateLeaseDocument error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/mediaService.js

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


// frontend/src/services/messageService.js

import api from "./axios.js";

const MESSAGE_BASE_URL = '/messages';

/**
 * Sends a new message.
 * @param {object} messageData - Data for the message: { recipientId, subject, body, contextType, contextId, propertyId, unitId, category }.
 * @returns {Promise<object>} The created message object.
 */
export const sendMessage = async (messageData) => {
    try {
        const res = await api.post(MESSAGE_BASE_URL, messageData);
        return res.data;
    } catch (error) {
        console.error("sendMessage error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves messages for the authenticated user, with optional filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., type: 'inbox'|'sent', propertyId, unitId, otherUserId).
 * @returns {Promise<object[]>} An array of message objects.
 */
export const getMessages = async (params = {}) => {
    try {
        const res = await api.get(MESSAGE_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getMessages error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a single message by ID.
 * @param {string} messageId - The ID of the message.
 * @returns {Promise<object>} The message object.
 */
export const getMessageById = async (messageId) => {
    try {
        const res = await api.get(`${MESSAGE_BASE_URL}/${messageId}`);
        return res.data;
    } catch (error) {
        console.error("getMessageById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks a specific message as read.
 * @param {string} messageId - The ID of the message to mark as read.
 * @returns {Promise<object>} The updated message object or success message.
 */
export const markMessageAsRead = async (messageId) => {
    try {
        const res = await api.patch(`${MESSAGE_BASE_URL}/${messageId}/read`); // Corrected to PATCH
        return res.data;
    } catch (error) {
        console.error("markMessageAsRead error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific message.
 * @param {string} messageId - The ID of the message to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteMessage = async (messageId) => {
    try {
        const res = await api.delete(`${MESSAGE_BASE_URL}/${messageId}`);
        return res.data;
    } catch (error) {
        console.error("deleteMessage error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/notificationService.js

import api from "../api/axios.js"; // Corrected import path

const NOTIFICATION_BASE_URL = '/notifications';

/**
 * Retrieves all notifications for the authenticated user.
 * @param {object} [params={}] - Query parameters for filtering (e.g., isRead, type, page, limit).
 * @returns {Promise<object[]>} An array of notification objects.
 */
export const getAllNotifications = async (params = {}) => {
    try {
        const res = await api.get(NOTIFICATION_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getAllNotifications error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a single notification by ID.
 * @param {string} notificationId - The ID of the notification.
 * @returns {Promise<object>} The notification object.
 */
export const getNotificationById = async (notificationId) => {
    try {
        const res = await api.get(`${NOTIFICATION_BASE_URL}/${notificationId}`);
        return res.data;
    } catch (error) {
        console.error("getNotificationById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks a specific notification as read.
 * @param {string} notificationId - The ID of the notification to mark as read.
 * @returns {Promise<object>} The updated notification object or success message.
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const res = await api.patch(`${NOTIFICATION_BASE_URL}/${notificationId}/read`); // Corrected to PATCH
        return res.data;
    } catch (error) {
        console.error("markNotificationAsRead error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks all notifications for the authenticated user as read.
 * @returns {Promise<object>} Success message.
 */
export const markAllNotificationsAsRead = async () => {
    try {
        const res = await api.patch(`${NOTIFICATION_BASE_URL}/mark-all-read`); // Corrected to PATCH
        return res.data;
    } catch (error) {
        console.error("markAllNotificationsAsRead error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves the count of unread notifications for the authenticated user.
 * @returns {Promise<number>} The count of unread notifications.
 */
export const getUnreadNotificationCount = async () => {
    try {
        const res = await api.get(`${NOTIFICATION_BASE_URL}/unread-count`); // Assuming this endpoint exists and returns count
        return res.data.count; // Assuming backend returns { count: number }
    } catch (error) {
        console.error("getUnreadNotificationCount error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific notification.
 * @param {string} notificationId - The ID of the notification to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteNotification = async (notificationId) => {
    try {
        const res = await api.delete(`${NOTIFICATION_BASE_URL}/${notificationId}`);
        return res.data;
    } catch (error) {
        console.error("deleteNotification error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/onboardingService.js

import api from "./axios.js";

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


// frontend/src/services/propertyService.js

import api from "../api/axios.js"; // Corrected import path

const PROPERTY_BASE_URL = '/properties';

/**
 * Retrieves a list of properties accessible by the authenticated user.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., { search, city, country, isActive, propertyType, sortBy, sortOrder, page, limit }).
 * @returns {Promise<object[]>} An array of property objects.
 */
export const getAllProperties = async (params = {}) => {
    try {
        const res = await api.get(PROPERTY_BASE_URL, { params });
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.properties)) return res.data.properties; // Handle paginated response
        return [];
    } catch (error) {
        console.error("getAllProperties error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific property.
 * @param {string} propertyId - The ID of the property.
 * @returns {Promise<object>} The property object.
 */
export const getPropertyById = async (propertyId) => {
    try {
        const res = await api.get(`${PROPERTY_BASE_URL}/${propertyId}`);
        return res.data;
    } catch (error) {
        console.error("getPropertyById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new property.
 * @param {object} propertyData - Data for the new property: { name, address: { street, city, state, country }, propertyType, yearBuilt, numberOfUnits, details, annualOperatingBudget, notes, mainContactUser, isActive }.
 * @returns {Promise<object>} The created property object.
 */
export const createProperty = async (propertyData) => {
    try {
        const res = await api.post(PROPERTY_BASE_URL, propertyData);
        return res.data;
    } catch (error) {
        console.error("createProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific property.
 * @param {string} propertyId - The ID of the property to update.
 * @param {object} propertyData - Data to update.
 * @returns {Promise<object>} The updated property object.
 */
export const updateProperty = async (propertyId, propertyData) => {
    try {
        const res = await api.put(`${PROPERTY_BASE_URL}/${propertyId}`, propertyData);
        return res.data;
    } catch (error) {
        console.error("updateProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a property.
 * @param {string} propertyId - The ID of the property to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteProperty = async (propertyId) => {
    try {
        const res = await api.delete(`${PROPERTY_BASE_URL}/${propertyId}`);
        return res.data;
    } catch (error) {
        console.error("deleteProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a user to a property with specific roles.
 * @param {string} propertyId - The ID of the property.
 * @param {string} userIdToAssign - The ID of the user to assign.
 * @param {string[]} roles - Array of roles to assign (e.g., ['propertymanager'], ['tenant']).
 * @param {string} [unitId] - Optional. Unit ID if assigning a tenant to a specific unit.
 * @returns {Promise<object>} Success message and updated property.
 */
export const assignUserToProperty = async (propertyId, userIdToAssign, roles, unitId = null) => {
    try {
        const payload = {
            userIdToAssign,
            roles: roles.map(role => role.toLowerCase()), // Ensure roles are lowercase
            ...(unitId && { unitId }) // Conditionally add unitId
        };
        const res = await api.post(`${PROPERTY_BASE_URL}/${propertyId}/assign-user`, payload);
        return res.data;
    } catch (error) {
        console.error("assignUserToProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Removes (deactivates) a user's association with a property/unit for specific roles.
 * @param {string} propertyId - The ID of the property.
 * @param {string} userIdToRemove - The ID of the user to remove.
 * @param {string[]} rolesToRemove - Array of roles to remove (e.g., ['propertymanager'], ['tenant']).
 * @param {string} [unitId] - Optional. Required if 'tenant' role is being removed.
 * @returns {Promise<object>} Success message.
 */
export const removeUserFromProperty = async (propertyId, userIdToRemove, rolesToRemove, unitId = null) => {
    try {
        const params = {
            rolesToRemove: rolesToRemove.map(role => role.toLowerCase()), // Ensure roles are lowercase
            ...(unitId && { unitId }) // Conditionally add unitId
        };
        // Backend uses DELETE with query parameters
        const res = await api.delete(`${PROPERTY_BASE_URL}/${propertyId}/remove-user/${userIdToRemove}`, { params });
        return res.data;
    } catch (error) {
        console.error("removeUserFromProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/publicService.js

import api from "../api/axios.js";

// Note: Public routes typically don't require authentication,
// but they still use the 'api' instance which has a baseURL.
// Ensure your backend's public routes are correctly configured
// to bypass authentication middleware.

const PUBLIC_BASE_URL = '/public'; // Base path for public routes

/**
 * Verifies an invitation token (public access).
 * @param {string} token - The invite token to verify.
 * @returns {Promise<object>} Returns a success message or error.
 */
export const verifyInviteToken = async (token) => {
    try {
        const res = await api.get(`${PUBLIC_BASE_URL}/invites/${token}/verify`); // Corrected endpoint
        return res.data;
    } catch (error) {
        console.error("verifyInviteToken error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Accepts an invitation and creates/updates user account (public access).
 * @param {string} token - The invite token.
 * @param {object} acceptData - Data for accepting invite: { email, password, firstName, lastName, confirmPassword }.
 * @returns {Promise<object>} Backend response including user details and potentially a new token.
 */
export const acceptInvite = async (token, acceptData) => {
    try {
        const res = await api.post(`${PUBLIC_BASE_URL}/invites/${token}/accept`, acceptData); // Corrected endpoint
        return res.data;
    } catch (error) {
        console.error("acceptInvite error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Declines an invitation (public access).
 * @param {string} token - The invite token.
 * @param {string} [reason] - Optional reason for declining.
 * @returns {Promise<object>} Success message.
 */
export const declineInvite = async (token, reason = '') => {
    try {
        const res = await api.post(`${PUBLIC_BASE_URL}/invites/${token}/decline`, { reason });
        return res.data;
    } catch (error) {
        console.error("declineInvite error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a public view of a maintenance request.
 * @param {string} publicToken - The public access token for the request.
 * @returns {Promise<object>} Limited request details for public viewing.
 */
export const getPublicRequestView = async (publicToken) => {
    try {
        const res = await api.get(`${PUBLIC_BASE_URL}/requests/${publicToken}`);
        return res.data;
    } catch (error) {
        console.error("getPublicRequestView error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Allows an external user (e.g., vendor) to update a maintenance request via public link.
 * @param {string} publicToken - The public access token.
 * @param {object} updateData - Data to update: { status, commentMessage, name, phone }.
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload.
 * @returns {Promise<object>} Success message.
 */
export const publicRequestUpdate = async (publicToken, updateData, mediaFiles = []) => {
    try {
        const formData = new FormData();
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && updateData[key] !== null) {
                if (key === 'status') {
                    formData.append(key, String(updateData[key]).toLowerCase());
                } else {
                    formData.append(key, updateData[key]);
                }
            }
        });
        mediaFiles.forEach(file => {
            formData.append('mediaFiles', file); // 'mediaFiles' must match multer field name
        });

        const res = await api.post(`${PUBLIC_BASE_URL}/requests/${publicToken}/update`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("publicRequestUpdate error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Adds a comment to a public maintenance request.
 * @param {string} publicToken - The public access token.
 * @param {object} commentData - Comment data: { message, externalUserName, externalUserEmail }.
 * @returns {Promise<object>} The created comment object.
 */
export const addPublicCommentToRequest = async (publicToken, commentData) => {
    try {
        const res = await api.post(`${PUBLIC_BASE_URL}/requests/${publicToken}/comments`, commentData);
        return res.data;
    } catch (error) {
        console.error("addPublicCommentToRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a public view of a scheduled maintenance task.
 * @param {string} publicToken - The public access token for the scheduled maintenance task.
 * @returns {Promise<object>} Limited task details for public viewing.
 */
export const getPublicScheduledMaintenanceView = async (publicToken) => {
    try {
        const res = await api.get(`${PUBLIC_BASE_URL}/scheduled-maintenance/${publicToken}`);
        return res.data;
    } catch (error) {
        console.error("getPublicScheduledMaintenanceView error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Allows an external user (e.g., vendor) to update a scheduled maintenance task via public link.
 * @param {string} publicToken - The public access token.
 * @param {object} updateData - Data to update: { status, commentMessage, name, phone }.
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload.
 * @returns {Promise<object>} Success message.
 */
export const publicScheduledMaintenanceUpdate = async (publicToken, updateData, mediaFiles = []) => {
    try {
        const formData = new FormData();
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && updateData[key] !== null) {
                if (key === 'status') {
                    formData.append(key, String(updateData[key]).toLowerCase());
                } else {
                    formData.append(key, updateData[key]);
                }
            }
        });
        mediaFiles.forEach(file => {
            formData.append('mediaFiles', file); // 'mediaFiles' must match multer field name
        });

        const res = await api.post(`${PUBLIC_BASE_URL}/scheduled-maintenance/${publicToken}/update`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("publicScheduledMaintenanceUpdate error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Adds a comment to a public scheduled maintenance task.
 * @param {string} publicToken - The public access token.
 * @param {object} commentData - Comment data: { message, externalUserName, externalUserEmail }.
 * @returns {Promise<object>} The created comment object.
 */
export const addPublicCommentToScheduledMaintenance = async (publicToken, commentData) => {
    try {
        const res = await api.post(`${PUBLIC_BASE_URL}/scheduled-maintenance/${publicToken}/comments`, commentData);
        return res.data;
    } catch (error) {
        console.error("addPublicCommentToScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/rentService.js

import api from "./axios.js";

const RENT_BASE_URL = '/rents';

/**
 * Creates a new rent record (e.g., for a new billing period).
 * @param {object} rentData - Data for the new rent entry: { lease, amountDue, dueDate, billingPeriod, status }.
 * @returns {Promise<object>} The created rent entry object.
 */
export const createRentRecord = async (rentData) => { // Renamed from recordRentPayment
    try {
        const res = await api.post(RENT_BASE_URL, rentData); // Corrected endpoint to /rents (POST)
        return res.data;
    } catch (error) {
        console.error("createRentRecord error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a list of rent entries, with optional filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., status, billingPeriod, leaseId, tenantId, propertyId, unitId, startDate, endDate, sortBy, sortOrder, page, limit).
 * @returns {Promise<object[]>} An array of rent entry objects.
 */
export const getRentEntries = async (params = {}) => {
    try {
        const res = await api.get(RENT_BASE_URL, { params });
        return res.data;
    } catch (error) {
        console.error("getRentEntries error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a single rent record by ID.
 * @param {string} rentId - The ID of the rent record.
 * @returns {Promise<object>} The rent record object.
 */
export const getRentRecordById = async (rentId) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/${rentId}`);
        return res.data;
    } catch (error) {
        console.error("getRentRecordById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a rent record.
 * @param {string} rentId - The ID of the rent record to update.
 * @param {object} updates - The updates to apply (e.g., amountDue, dueDate, billingPeriod, status, amountPaid, paymentDate, paymentMethod, transactionId, notes).
 * @returns {Promise<object>} The updated rent record object.
 */
export const updateRentRecord = async (rentId, updates) => {
    try {
        const res = await api.put(`${RENT_BASE_URL}/${rentId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateRentRecord error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Records a rent payment for an existing rent record.
 * @param {string} rentId - The ID of the rent record to pay.
 * @param {object} paymentData - Payment details: { amountPaid, paymentDate, paymentMethod, transactionId, notes }.
 * @param {File} [paymentProofFile] - Optional payment proof file.
 * @returns {Promise<object>} The updated rent record object.
 */
export const recordPaymentForRentRecord = async (rentId, paymentData, paymentProofFile) => {
    try {
        const formData = new FormData();
        Object.keys(paymentData).forEach(key => {
            if (paymentData[key] !== undefined && paymentData[key] !== null) {
                formData.append(key, paymentData[key]);
            }
        });
        if (paymentProofFile) {
            formData.append('documentFile', paymentProofFile); // 'documentFile' matches backend field name
        }

        const res = await api.post(`${RENT_BASE_URL}/${rentId}/pay`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (error) {
        console.error("recordPaymentForRentRecord error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a rent record.
 * @param {string} rentId - The ID of the rent record to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteRentRecord = async (rentId) => {
    try {
        const res = await api.delete(`${RENT_BASE_URL}/${rentId}`);
        return res.data;
    } catch (error) {
        console.error("deleteRentRecord error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves upcoming rent due dates.
 * @param {object} [params={}] - Query parameters: propertyId, unitId, daysAhead.
 * @returns {Promise<object[]>} An array of upcoming rent records.
 */
export const getUpcomingRent = async (params = {}) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/upcoming`, { params });
        return res.data;
    } catch (error) {
        console.error("getUpcomingRent error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves rent history for a lease, tenant, or property.
 * @param {object} [params={}] - Query parameters: leaseId, tenantId, propertyId, startDate, endDate.
 * @returns {Promise<object[]>} An array of rent history records.
 */
export const getRentHistory = async (params = {}) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/history`, { params });
        return res.data;
    } catch (error) {
        console.error("getRentHistory error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Uploads payment proof for a rent record.
 * @param {string} rentId - The ID of the rent record.
 * @param {File} paymentProofFile - The payment proof file.
 * @returns {Promise<object>} Updated rent record with payment proof info.
 */
export const uploadPaymentProof = async (rentId, paymentProofFile) => {
    try {
        const formData = new FormData();
        formData.append('documentFile', paymentProofFile); // 'documentFile' matches backend field name
        const res = await api.post(`${RENT_BASE_URL}/${rentId}/upload-proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (error) {
        console.error("uploadPaymentProof error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Downloads payment proof for a rent record.
 * @param {string} rentId - The ID of the rent record.
 * @returns {Promise<Blob>} The payment proof document as a Blob.
 */
export const downloadPaymentProof = async (rentId) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/${rentId}/download-proof`, {
            responseType: 'blob',
        });
        return res.data;
    } catch (error) {
        console.error("downloadPaymentProof error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/requestService.js

import api from "../api/axios.js"; // Corrected import path

const REQUEST_BASE_URL = '/requests';

/**
 * Retrieves all maintenance requests accessible to the authenticated user, with filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., status, category, priority, propertyId, unitId, search, startDate, endDate, assignedToId, assignedToType, page, limit).
 * @returns {Promise<object[]>} An array of request objects.
 */
export const getAllRequests = async (params = {}) => {
    try {
        const res = await api.get(REQUEST_BASE_URL, { params }); // This now handles all filtering
        return res.data;
    } catch (error) {
        console.error("getAllRequests error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific maintenance request.
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} The request object.
 */
export const getRequestById = async (id) => {
    try {
        const res = await api.get(`${REQUEST_BASE_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error("getRequestById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new maintenance request.
 * @param {object} requestData - Request details: { title, description, category, priority, propertyId, unitId }.
 * @param {File[]} [files=[]] - Optional array of File objects for media upload. (Backend expects 'files')
 * @returns {Promise<object>} The created request object.
 */
export const createRequest = async (requestData, files = []) => {
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
        files.forEach(file => {
            formData.append('files', file); // Corrected to 'files' to match backend multer field name
        });

        // Axios automatically sets Content-Type to multipart/form-data for FormData
        const res = await api.post(REQUEST_BASE_URL, formData);
        return res.data;
    } catch (error) {
        console.error("createRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific maintenance request.
 * @param {string} id - The ID of the request to update.
 * @param {object} updates - Data to update (e.g., title, description, category, priority, status).
 * @returns {Promise<object>} The updated request object.
 */
export const updateRequest = async (id, updates) => {
    try {
        // Ensure enum values are lowercase for backend
        const payload = { ...updates };
        if (payload.category) payload.category = payload.category.toLowerCase();
        if (payload.priority) payload.priority = payload.priority.toLowerCase();
        if (payload.status) payload.status = payload.status.toLowerCase();

        const res = await api.put(`${REQUEST_BASE_URL}/${id}`, payload);
        return res.data;
    } catch (error) {
        console.error("updateRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a request to a user (internal staff) or a vendor.
 * @param {string} id - The ID of the request.
 * @param {object} assignmentData - Data: { assignedToId: string, assignedToModel: 'User' | 'Vendor' }.
 * @returns {Promise<object>} The updated request object.
 */
export const assignRequest = async (id, assignmentData) => {
    try {
        // Backend uses POST /api/requests/:id/assign
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/assign`, assignmentData);
        return res.data;
    } catch (error) {
        console.error("assignRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Uploads additional media files to an existing request.
 * @param {string} id - The ID of the request.
 * @param {File[]} mediaFiles - Array of File objects to upload. (Backend expects 'mediaFiles')
 * @returns {Promise<object>} Updated request with new media URLs.
 */
export const uploadRequestMedia = async (id, mediaFiles) => {
    try {
        const formData = new FormData();
        mediaFiles.forEach(file => {
            formData.append('mediaFiles', file); // 'mediaFiles' matches multer field name
        });
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/media`, formData);
        return res.data;
    } catch (error) {
        console.error("uploadRequestMedia error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific media file from a request.
 * @param {string} id - The ID of the request.
 * @param {string} mediaUrl - The URL of the media file to delete.
 * @returns {Promise<object>} Success message and remaining media URLs.
 */
export const deleteRequestMedia = async (id, mediaUrl) => {
    try {
        const res = await api.delete(`${REQUEST_BASE_URL}/${id}/media`, { data: { mediaUrl } }); // DELETE with body
        return res.data;
    } catch (error) {
        console.error("deleteRequestMedia error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Enables a public link for a maintenance request.
 * @param {string} id - The ID of the request.
 * @param {number} [expiresInDays] - Optional number of days until the link expires.
 * @returns {Promise<object>} The public link URL.
 */
export const enableRequestPublicLink = async (id, expiresInDays) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/enable-public-link`, { expiresInDays });
        return res.data;
    } catch (error) {
        console.error("enableRequestPublicLink error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Disables a public link for a maintenance request.
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Success message.
 */
export const disableRequestPublicLink = async (id) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/disable-public-link`);
        return res.data;
    } catch (error) {
        console.error("disableRequestPublicLink error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Verifies a completed request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const verifyRequest = async (id) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/verify`);
        return res.data;
    } catch (error) {
        console.error("verifyRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Reopens a request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const reopenRequest = async (id) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/reopen`);
        return res.data;
    } catch (error) {
        console.error("reopenRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Archives a request (PM/Landlord/Admin).
 * @param {string} id - The ID of the request.
 * @returns {Promise<object>} Updated request object.
 */
export const archiveRequest = async (id) => {
    try {
        const res = await api.put(`${REQUEST_BASE_URL}/${id}/archive`);
        return res.data;
    } catch (error) {
        console.error("archiveRequest error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Submits feedback for a completed request.
 * @param {string} id - The ID of the request.
 * @param {object} feedbackData - Feedback data: { rating: number, comment?: string }.
 * @returns {Promise<object>} Success message.
 */
export const submitFeedback = async (id, feedbackData) => {
    try {
        const res = await api.post(`${REQUEST_BASE_URL}/${id}/feedback`, feedbackData);
        return res.data;
    } catch (error) {
        console.error("submitFeedback error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/scheduledMaintenanceService.js

import api from "../api/axios.js";

const SCHEDULED_MAINTENANCE_BASE_URL = '/scheduled-maintenance';

/**
 * Creates a new scheduled maintenance task.
 * @param {object} taskData - Scheduled maintenance data.
 * @param {File[]} [mediaFiles=[]] - Optional array of File objects for media upload. (Backend expects 'media')
 * @returns {Promise<object>} The created task object.
 */
export const createScheduledMaintenance = async (taskData, mediaFiles = []) => {
    try {
        const formData = new FormData();
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
        mediaFiles.forEach(file => {
            formData.append('media', file); // 'media' matches Multer field in backend
        });
        const res = await api.post(SCHEDULED_MAINTENANCE_BASE_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("createScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves all scheduled maintenance tasks accessible to the authenticated user, with filtering.
 * @param {object} [params={}] - Query parameters for filtering (e.g., status, recurring, propertyId, unitId, category, search, startDate, endDate, page, limit).
 * @returns {Promise<object>} An object: { tasks, total, currentPage, itemsPerPage }
 */
export const getAllScheduledMaintenance = async (params = {}) => {
    try {
        const res = await api.get(SCHEDULED_MAINTENANCE_BASE_URL, { params });
        if (Array.isArray(res.data)) return { tasks: res.data, total: res.data.length, currentPage: 1, itemsPerPage: res.data.length };
        if (res.data?.tasks && typeof res.data.total !== "undefined") return res.data;
        return { tasks: [], total: 0, currentPage: 1, itemsPerPage: 0 };
    } catch (error) {
        console.error("getAllScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @returns {Promise<object>} The task object.
 */
export const getScheduledMaintenanceById = async (id) => {
    try {
        const res = await api.get(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error("getScheduledMaintenanceById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific scheduled maintenance task.
 * @param {string} id - The ID of the task to update.
 * @param {object} updates - Data to update.
 * @param {File[]} [mediaFiles=[]] - Optional array of new File objects for media upload. (Backend expects 'media')
 * @returns {Promise<object>} The updated task object.
 */
export const updateScheduledMaintenance = async (id, updates, mediaFiles = []) => {
    try {
        const formData = new FormData();
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
        mediaFiles.forEach(file => {
            formData.append('media', file); // 'media' matches Multer field in backend
        });
        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error("updateScheduledMaintenance error:", error.response?.data || error.message);
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
        return res.data;
    } catch (error) {
        console.error("deleteScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Enables a public link for a scheduled maintenance task.
 * @param {string} id - The ID of the task.
 * @param {number} [expiresInDays] - Optional number of days until the link expires.
 * @returns {Promise<object>} The public link URL.
 */
export const enableScheduledMaintenancePublicLink = async (id, expiresInDays) => {
    try {
        const res = await api.post(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/enable-public-link`, { expiresInDays });
        return res.data;
    } catch (error) {
        console.error("enableScheduledMaintenancePublicLink error:", error.response?.data || error.message);
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
        return res.data;
    } catch (error) {
        console.error("disableScheduledMaintenancePublicLink error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Pauses a scheduled maintenance task.
 * @param {string} id - The ID of the task to pause.
 * @returns {Promise<object>} The updated task object.
 */
export const pauseScheduledMaintenance = async (id) => {
    try {
        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/pause`);
        return res.data;
    } catch (error) {
        console.error("pauseScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Resumes a paused scheduled maintenance task.
 * @param {string} id - The ID of the task to resume.
 * @returns {Promise<object>} The updated task object.
 */
export const resumeScheduledMaintenance = async (id) => {
    try {
        const res = await api.put(`${SCHEDULED_MAINTENANCE_BASE_URL}/${id}/resume`);
        return res.data;
    } catch (error) {
        console.error("resumeScheduledMaintenance error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/unitService.js

import api from "../api/axios.js"; // Corrected import path

const PROPERTY_UNIT_BASE_URL = '/properties'; // For nested unit routes

/**
 * Creates a new unit within a specific property.
 * @param {string} propertyId - The ID of the property the unit belongs to.
 * @param {object} unitData - Data for the new unit: { unitName, floor, details, numBedrooms, numBathrooms, squareFootage, rentAmount }.
 * @returns {Promise<object>} The created unit object.
 */
export const createUnit = async (propertyId, unitData) => {
    try {
        const res = await api.post(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units`, unitData); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("createUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a list of units for a specific property.
 * @param {string} propertyId - The ID of the property.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., status, numBedrooms, search, page, limit).
 * @returns {Promise<object[]>} An array of unit objects.
 */
export const getUnitsForProperty = async (propertyId, params = {}) => {
    try {
        const res = await api.get(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units`, { params }); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("getUnitsForProperty error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves details for a specific unit.
 * @param {string} propertyId - The ID of the parent property.
 * @param {string} unitId - The ID of the unit.
 * @returns {Promise<object>} The unit object.
 */
export const getUnitById = async (propertyId, unitId) => {
    try {
        const res = await api.get(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("getUnitById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates details for a specific unit.
 * @param {string} propertyId - The ID of the parent property.
 * @param {string} unitId - The ID of the unit to update.
 * @param {object} updates - Data to update.
 * @returns {Promise<object>} The updated unit object.
 */
export const updateUnit = async (propertyId, unitId, updates) => {
    try {
        const res = await api.put(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`, updates); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("updateUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a specific unit.
 * @param {string} propertyId - The ID of the parent property.
 * @param {string} unitId - The ID of the unit to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteUnit = async (propertyId, unitId) => {
    try {
        const res = await api.delete(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`); // Nested endpoint
        return res.data;
    } catch (error) {
        console.error("deleteUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a tenant to a unit.
 * @param {string} propertyId - The ID of the property.
 * @param {string} unitId - The ID of the unit.
 * @param {string} tenantId - The ID of the user (tenant) to assign.
 * @returns {Promise<object>} Success message and updated unit.
 */
export const assignTenantToUnit = async (propertyId, unitId, tenantId) => {
    try {
        // Backend uses POST /properties/:propertyId/units/:unitId/assign-tenant
        const res = await api.post(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}/assign-tenant`, { tenantId });
        return res.data;
    } catch (error) {
        console.error("assignTenantToUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Removes a tenant from a unit.
 * @param {string} propertyId - The ID of the property.
 * @param {string} unitId - The ID of the unit.
 * @param {string} tenantId - The ID of the user (tenant) to remove.
 * @returns {Promise<object>} Success message and updated unit.
 */
export const removeTenantFromUnit = async (propertyId, unitId, tenantId) => {
    try {
        // Backend uses DELETE /properties/:propertyId/units/:unitId/remove-tenant/:tenantId
        const res = await api.delete(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}/remove-tenant/${tenantId}`);
        return res.data;
    } catch (error) {
        console.error("removeTenantFromUnit error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/userService.js

import api from "../api/axios.js"; // Corrected import path

const USER_BASE_URL = '/users';

/**
 * Get current user's profile.
 * Maps to backend's GET /api/users/profile route.
 * @returns {Promise<object>} User profile data.
 */
export const getMyProfile = async () => {
    try {
        const res = await api.get(`${USER_BASE_URL}/profile`); // Corrected endpoint to /users/profile
        return res.data; // This data will be like { _id, name, email, role, associations, ... }
    } catch (error) {
        console.error("getMyProfile error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Update current user's own profile (name, phone, preferences, avatar).
 * Maps to backend's PUT /api/users/profile route.
 * @param {object} profileData - Data to update (e.g., { firstName, lastName, phone, avatar, preferences }).
 * @returns {Promise<object>} Updated user profile data.
 */
export const updateMyProfile = async (profileData) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/profile`, profileData); // Corrected endpoint to /users/profile
        return res.data;
    } catch (error) {
        console.error("updateMyProfile error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * For ADMIN, PropertyManager, Landlord: Get all users with filtering.
 * Maps to backend's GET /api/users route.
 * @param {object} [params={}] - Optional query parameters for filtering (e.g., { role, propertyId, unitId, search }).
 * @returns {Promise<object[]>} Array of user objects.
 */
export const getAllUsers = async (params = {}) => {
    try {
        const res = await api.get(USER_BASE_URL, { params }); // Consolidated route for all users with filters
        return res.data;
    } catch (error) {
        console.error("getAllUsers error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new user manually (Admin, Landlord, or PM can add tenants/vendors).
 * @param {object} userData - User registration details: { firstName, lastName, email, phone, role, propertyId, unitId }.
 * @returns {Promise<object>} The created user object.
 */
export const createUser = async (userData) => { // Renamed from createTenant
    try {
        const res = await api.post(USER_BASE_URL, userData);
        return res.data;
    } catch (error) {
        console.error("createUser error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Get specific user details by ID.
 * Maps to backend's GET /api/users/:id route.
 * @param {string} userId - ID of the user to retrieve.
 * @returns {Promise<object>} User details object.
 */
export const getUserById = async (userId) => {
    try {
        const res = await api.get(`${USER_BASE_URL}/${userId}`);
        return res.data;
    } catch (error) {
        console.error("getUserById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Update a user's profile by ID (Admin for full update; Landlord/PM for limited fields on associated users).
 * Maps to backend's PUT /api/users/:id route.
 * @param {string} userId - ID of the user to update.
 * @param {object} updates - Data to update (e.g., { firstName, lastName, phone, avatar, preferences, role, status }).
 * @returns {Promise<object>} Updated user data.
 */
export const updateUserById = async (userId, updates) => { // Renamed from updateUser
    try {
        // Ensure role is lowercase if provided before sending to backend
        const payload = { ...updates };
        if (payload.role) payload.role = payload.role.toLowerCase();

        const res = await api.put(`${USER_BASE_URL}/${userId}`, payload);
        return res.data;
    } catch (error) {
        console.error("updateUserById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Approve a pending user.
 * Maps to backend's PUT /api/users/:id/approve route.
 * @param {string} userId - ID of the user to approve.
 * @returns {Promise<object>} Backend response.
 */
export const approveUser = async (userId) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/approve`); // Corrected to PUT
        return res.data;
    } catch (error) {
        console.error("approveUser error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Update a user's global role (Admin only).
 * Maps to backend's PUT /api/users/:id/role route.
 * @param {string} userId - ID of the user to update.
 * @param {string} role - New role (e.g., 'landlord', 'propertymanager').
 * @returns {Promise<object>} Backend response.
 */
export const updateUserRole = async (userId, role) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/role`, { role: role.toLowerCase() }); // Corrected to PUT
        return res.data;
    } catch (error) {
        console.error("updateUserRole error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Delete user by ID (Admin only).
 * Maps to backend's DELETE /api/users/:id route.
 * @param {string} userId - ID of the user to delete.
 * @returns {Promise<object>} Backend response.
 */
export const deleteUserById = async (userId) => { // Renamed from deleteUser
    try {
        const res = await api.delete(`${USER_BASE_URL}/${userId}`);
        return res.data;
    } catch (error) {
        console.error("deleteUserById error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deactivate a user.
 * @param {string} userId - The ID of the user to deactivate.
 * @returns {Promise<object>} Updated user object.
 */
export const deactivateUser = async (userId) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/deactivate`);
        return res.data;
    } catch (error) {
        console.error("deactivateUser error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Activate a user.
 * @param {string} userId - The ID of the user to activate.
 * @returns {Promise<object>} Updated user object.
 */
export const activateUser = async (userId) => {
    try {
        const res = await api.put(`${USER_BASE_URL}/${userId}/activate`);
        return res.data;
    } catch (error) {
        console.error("activateUser error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Admin can reset a user's password.
 * @param {string} userId - The ID of the user whose password to reset.
 * @param {string} newPassword - The new password.
 * @returns {Promise<object>} Success message.
 */
export const adminResetUserPassword = async (userId, newPassword) => {
    try {
        const res = await api.post(`${USER_BASE_URL}/${userId}/reset-password`, { newPassword });
        return res.data;
    } catch (error) {
        console.error("adminResetUserPassword error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/vendorService.js

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


// frontend/src/services/reportService.js

import api from "../api/axios.js";

const REPORT_BASE_URL = '/reports';

/**
 * Fetches a comprehensive maintenance summary report with all details and supports filters & pagination.
 * @param {object} params - Query params: propertyId, status, category, assignedToId, assignedToModel, startDate, endDate, format, page, limit
 * @returns {Promise<object>} { data: [...], pagination: {...} }
 */
export const getMaintenanceSummaryReport = async (params = {}) => { // Renamed from generateMaintenanceSummaryReport
    try {
        const res = await api.get(`${REPORT_BASE_URL}/maintenance-summary`, { params });
        return res.data; // { data: [...], pagination: {...} }
    } catch (error) {
        console.error("getMaintenanceSummaryReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Generates a report on vendor performance (average resolution times, ratings).
 * @param {object} params - Query params: propertyId, vendorId, startDate, endDate
 * @returns {Promise<object[]>} Array of vendor performance data.
 */
export const getVendorPerformanceReport = async (params = {}) => {
    try {
        const res = await api.get(`${REPORT_BASE_URL}/vendor-performance`, { params });
        return res.data;
    } catch (error) {
        console.error("getVendorPerformanceReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Generates a report on most frequent issue categories.
 * @param {object} params - Query params: propertyId, startDate, endDate
 * @returns {Promise<object[]>} Array of { category, count, averageResolutionTimeHours }
 */
export const getCommonIssuesReport = async (params = {}) => {
    try {
        const res = await api.get(`${REPORT_BASE_URL}/common-issues`, { params });
        return res.data;
    } catch (error) {
        console.error("getCommonIssuesReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a rent collection report.
 * @param {object} params - Query params: propertyId, unitId, status, tenantId, billingPeriod, startDate, endDate.
 * @returns {Promise<object[]>} Array of rent collection data.
 */
export const getRentCollectionReport = async (params = {}) => {
    try {
        const res = await api.get(`${REPORT_BASE_URL}/rent-collection`, { params });
        return res.data;
    } catch (error) {
        console.error("getRentCollectionReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a lease expiry report.
 * @param {object} params - Query params: propertyId, unitId, status, tenantId, expiryStartDate, expiryEndDate.
 * @returns {Promise<object[]>} Array of lease expiry data.
 */
export const getLeaseExpiryReport = async (params = {}) => {
    try {
        const res = await api.get(`${REPORT_BASE_URL}/lease-expiry`, { params });
        return res.data;
    } catch (error) {
        console.error("getLeaseExpiryReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Exports a report as a PDF or CSV.
 * @param {string} type - The type of report to export ('maintenance_summary', 'vendor_performance', 'common_issues', 'rent_collection', 'lease_expiry').
 * @param {string} format - The export format ('csv' or 'pdf').
 * @param {object} [params={}] - Additional query parameters for the report.
 * @returns {Promise<void>} Automatically triggers download in the browser.
 */
export const exportReport = async (type, format, params = {}) => {
    try {
        const p = { ...params, type, format };
        const res = await api.get(`${REPORT_BASE_URL}/export`, {
            params: p,
            responseType: 'blob',
        });
        const blobType = format === 'pdf' ? 'application/pdf' : 'text/csv';
        const fileName = `${type}_report.${format}`;

        const url = window.URL.createObjectURL(new Blob([res.data], { type: blobType }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    } catch (error) {
        console.error("exportReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};


// frontend/src/services/adminService.js

import api from "../api/axios.js";

const ADMIN_BASE_URL = "/admin";

/**
 * Fetches dashboard statistics for the admin.
 * @returns {Promise<object>} Statistics data.
 */
export const getDashboardStatistics = async () => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/stats`);
        return res.data;
    } catch (error) {
        console.error("getDashboardStatistics error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets the currently authenticated admin user's profile.
 * @returns {Promise<object>} User profile data.
 */
export const getCurrentAdminUser = async () => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/me`);
        return res.data;
    } catch (error) {
        console.error("getCurrentAdminUser error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Lists all users with optional filtering (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of user objects.
 */
export const listAllUsersAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/users`, { params });
        return res.data;
    } catch (error) {
        console.error("listAllUsersAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets currently active users (admin view).
 * @returns {Promise<object[]>} Array of active user objects.
 */
export const getCurrentlyActiveUsers = async () => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/users/active`);
        return res.data;
    } catch (error) {
        console.error("getCurrentlyActiveUsers error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific user (admin view).
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} User details object.
 */
export const getUserDetailsAdmin = async (userId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/users/${userId}`);
        return res.data;
    } catch (error) {
        console.error("getUserDetailsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new user (admin only).
 * @param {object} userData - User data.
 * @returns {Promise<object>} The created user object.
 */
export const createUserAdmin = async (userData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/users`, userData);
        return res.data;
    } catch (error) {
        console.error("createUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a user's profile (admin only).
 * @param {string} userId - The ID of the user.
 * @param {object} updates - Updates to apply.
 * @returns {Promise<object>} Updated user object.
 */
export const updateUserAdmin = async (userId, updates) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/users/${userId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deactivates a user (admin only).
 * @param {string} userId - The ID of the user to deactivate.
 * @returns {Promise<object>} Updated user object.
 */
export const deactivateUserAdmin = async (userId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/users/${userId}/deactivate`);
        return res.data;
    } catch (error) {
        console.error("deactivateUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Activates a user (admin only).
 * @param {string} userId - The ID of the user to activate.
 * @returns {Promise<object>} Updated user object.
 */
export const activateUserAdmin = async (userId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/users/${userId}/activate`);
        return res.data;
    } catch (error) {
        console.error("activateUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Manually approves a user (admin only).
 * @param {string} userId - The ID of the user to approve.
 * @returns {Promise<object>} Updated user object.
 */
export const manuallyApproveUserAdmin = async (userId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/users/${userId}/approve`);
        return res.data;
    } catch (error) {
        console.error("manuallyApproveUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Admin can reset a user's password.
 * @param {string} userId - The ID of the user whose password to reset.
 * @param {string} newPassword - The new password.
 * @returns {Promise<object>} Success message.
 */
export const adminResetUserPassword = async (userId, newPassword) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/users/${userId}/reset-password`, { newPassword });
        return res.data;
    } catch (error) {
        console.error("adminResetUserPassword error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a user (admin only).
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteUserAdmin = async (userId) => {
    try {
        const res = await api.delete(`${ADMIN_BASE_URL}/users/${userId}`);
        return res.data;
    } catch (error) {
        console.error("deleteUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Lists all properties (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of property objects.
 */
export const listAllPropertiesAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/properties`, { params });
        return res.data;
    } catch (error) {
        console.error("listAllPropertiesAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific property (admin view).
 * @param {string} propertyId - The ID of the property.
 * @returns {Promise<object>} Property details object.
 */
export const getPropertyDetailsAdmin = async (propertyId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/properties/${propertyId}`);
        return res.data;
    } catch (error) {
        console.error("getPropertyDetailsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new property (admin only).
 * @param {object} propertyData - Property data.
 * @returns {Promise<object>} The created property object.
 */
export const createPropertyAdmin = async (propertyData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/properties`, propertyData);
        return res.data;
    } catch (error) {
        console.error("createPropertyAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a property (admin only).
 * @param {string} propertyId - The ID of the property.
 * @param {object} updates - Updates to apply.
 * @returns {Promise<object>} Updated property object.
 */
export const updatePropertyAdmin = async (propertyId, updates) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/properties/${propertyId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updatePropertyAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deactivates a property (admin only).
 * @param {string} propertyId - The ID of the property to deactivate.
 * @returns {Promise<object>} Updated property object.
 */
export const deactivatePropertyAdmin = async (propertyId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/properties/${propertyId}/deactivate`);
        return res.data;
    } catch (error) {
        console.error("deactivatePropertyAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Lists all units (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of unit objects.
 */
export const listAllUnitsAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/units`, { params });
        return res.data;
    } catch (error) {
        console.error("listAllUnitsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific unit (admin view).
 * @param {string} unitId - The ID of the unit.
 * @returns {Promise<object>} Unit details object.
 */
export const getUnitByIdAdmin = async (unitId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/units/${unitId}`);
        return res.data;
    } catch (error) {
        console.error("getUnitByIdAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new unit (admin only).
 * @param {object} unitData - Unit data.
 * @returns {Promise<object>} The created unit object.
 */
export const createUnitAdmin = async (unitData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/units`, unitData);
        return res.data;
    } catch (error) {
        console.error("createUnitAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a unit (admin only).
 * @param {string} unitId - The ID of the unit.
 * @param {object} updates - Updates to apply.
 * @returns {Promise<object>} Updated unit object.
 */
export const updateUnitAdmin = async (unitId, updates) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/units/${unitId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateUnitAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deactivates a unit (admin only).
 * @param {string} unitId - The ID of the unit to deactivate.
 * @returns {Promise<object>} Updated unit object.
 */
export const deactivateUnitAdmin = async (unitId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/units/${unitId}/deactivate`);
        return res.data;
    } catch (error) {
        console.error("deactivateUnitAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Lists all vendors (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of vendor objects.
 */
export const listAllVendorsAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/vendors`, { params });
        return res.data;
    } catch (error) {
        console.error("listAllVendorsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific vendor (admin view).
 * @param {string} vendorId - The ID of the vendor.
 * @returns {Promise<object>} Vendor details object.
 */
export const getVendorDetailsAdmin = async (vendorId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/vendors/${vendorId}`);
        return res.data;
    } catch (error) {
        console.error("getVendorDetailsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new vendor (admin only).
 * @param {object} vendorData - Vendor data.
 * @returns {Promise<object>} The created vendor object.
 */
export const createVendorAdmin = async (vendorData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/vendors`, vendorData);
        return res.data;
    } catch (error) {
        console.error("createVendorAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a vendor (admin only).
 * @param {string} vendorId - The ID of the vendor.
 * @param {object} updates - Updates to apply.
 * @returns {Promise<object>} Updated vendor object.
 */
export const updateVendorAdmin = async (vendorId, updates) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/vendors/${vendorId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateVendorAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deactivates a vendor (admin only).
 * @param {string} vendorId - The ID of the vendor to deactivate.
 * @returns {Promise<object>} Updated vendor object.
 */
export const deactivateVendorAdmin = async (vendorId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/vendors/${vendorId}/deactivate`);
        return res.data;
    } catch (error) {
        console.error("deactivateVendorAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Lists all maintenance requests (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of request objects.
 */
export const listAllRequestsAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/requests`, { params });
        return res.data;
    } catch (error) {
        console.error("listAllRequestsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets request analytics (admin view).
 * @param {object} [params={}] - Query parameters for analytics.
 * @returns {Promise<object>} Analytics data.
 */
export const getRequestAnalyticsAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/requests/analytics`, { params });
        return res.data;
    } catch (error) {
        console.error("getRequestAnalyticsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific request (admin view).
 * @param {string} requestId - The ID of the request.
 * @returns {Promise<object>} Request details object.
 */
export const getRequestDetailsAdmin = async (requestId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/requests/${requestId}`);
        return res.data;
    } catch (error) {
        console.error("getRequestDetailsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a maintenance request status (admin only).
 * @param {string} requestId - The ID of the request.
 * @param {string} status - The new status.
 * @returns {Promise<object>} Updated request object.
 */
export const updateRequestStatusAdmin = async (requestId, status) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/requests/${requestId}/status`, { status });
        return res.data;
    } catch (error) {
        console.error("updateRequestStatusAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a request to a vendor or internal staff (admin only).
 * @param {string} requestId - The ID of the request.
 * @param {object} assignmentData - Data: { assignedToId: string, assignedToModel: 'User' | 'Vendor' }.
 * @returns {Promise<object>} Updated request object.
 */
export const assignRequestAdmin = async (requestId, assignmentData) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/requests/${requestId}/assign`, assignmentData); // Backend uses PUT
        return res.data;
    } catch (error) {
        console.error("assignRequestAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Adds a comment to a request (admin only).
 * @param {string} requestId - The ID of the request.
 * @param {object} commentData - Comment data.
 * @returns {Promise<object>} The created comment object.
 */
export const addCommentToRequestAdmin = async (requestId, commentData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/requests/${requestId}/comments`, commentData);
        return res.data;
    } catch (error) {
        console.error("addCommentToRequestAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Lists all leases (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of lease objects.
 */
export const getAllLeasesAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/leases`, { params });
        return res.data;
    } catch (error) {
        console.error("getAllLeasesAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific lease (admin view).
 * @param {string} leaseId - The ID of the lease.
 * @returns {Promise<object>} Lease details object.
 */
export const getLeaseByIdAdmin = async (leaseId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/leases/${leaseId}`);
        return res.data;
    } catch (error) {
        console.error("getLeaseByIdAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new lease (admin only).
 * @param {object} leaseData - Lease data.
 * @returns {Promise<object>} The created lease object.
 */
export const createLeaseAdmin = async (leaseData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/leases`, leaseData);
        return res.data;
    } catch (error) {
        console.error("createLeaseAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a lease (admin only).
 * @param {string} leaseId - The ID of the lease.
 * @param {object} updates - Updates to apply.
 * @returns {Promise<object>} Updated lease object.
 */
export const updateLeaseAdmin = async (leaseId, updates) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/leases/${leaseId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateLeaseAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Terminates a lease (admin only).
 * @param {string} leaseId - The ID of the lease to terminate.
 * @returns {Promise<object>} Updated lease object.
 */
export const terminateLeaseAdmin = async (leaseId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/leases/${leaseId}/terminate`);
        return res.data;
    } catch (error) {
        console.error("terminateLeaseAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Lists all rent records (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of rent records.
 */
export const getAllRentsAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/rents`, { params });
        return res.data;
    } catch (error) {
        console.error("getAllRentsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific rent record (admin view).
 * @param {string} rentId - The ID of the rent record.
 * @returns {Promise<object>} Rent record details object.
 */
export const getRentByIdAdmin = async (rentId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/rents/${rentId}`);
        return res.data;
    } catch (error) {
        console.error("getRentByIdAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Records a rent payment (admin only).
 * @param {object} rentData - Rent payment data.
 * @returns {Promise<object>} The recorded rent payment object.
 */
export const recordRentPaymentAdmin = async (rentData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/rents`, rentData);
        return res.data;
    } catch (error) {
        console.error("recordRentPaymentAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a rent payment (admin only).
 * @param {string} rentId - The ID of the rent record.
 * @param {object} updates - Updates to apply.
 * @returns {Promise<object>} Updated rent record.
 */
export const updateRentPaymentAdmin = async (rentId, updates) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/rents/${rentId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateRentPaymentAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Lists all scheduled maintenance tasks (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of scheduled maintenance tasks.
 */
export const getAllScheduledMaintenancesAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/scheduled-maintenances`, { params });
        return res.data;
    } catch (error) {
        console.error("getAllScheduledMaintenancesAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific scheduled maintenance task (admin view).
 * @param {string} scheduledMaintenanceId - The ID of the task.
 * @returns {Promise<object>} Scheduled maintenance task details object.
 */
export const getScheduledMaintenanceByIdAdmin = async (scheduledMaintenanceId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/scheduled-maintenances/${scheduledMaintenanceId}`);
        return res.data;
    } catch (error) {
        console.error("getScheduledMaintenanceByIdAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new scheduled maintenance task (admin only).
 * @param {object} taskData - Task data.
 * @returns {Promise<object>} The created task object.
 */
export const createScheduledMaintenanceAdmin = async (taskData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/scheduled-maintenances`, taskData);
        return res.data;
    } catch (error) {
        console.error("createScheduledMaintenanceAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a scheduled maintenance task (admin only).
 * @param {string} scheduledMaintenanceId - The ID of the task.
 * @param {object} updates - Updates to apply.
 * @returns {Promise<object>} Updated task object.
 */
export const updateScheduledMaintenanceAdmin = async (scheduledMaintenanceId, updates) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/scheduled-maintenances/${scheduledMaintenanceId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updateScheduledMaintenanceAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Pauses a scheduled maintenance task (admin only).
 * @param {string} scheduledMaintenanceId - The ID of the task to pause.
 * @returns {Promise<object>} Updated task object.
 */
export const pauseScheduledMaintenanceAdmin = async (scheduledMaintenanceId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/scheduled-maintenances/${scheduledMaintenanceId}/pause`);
        return res.data;
    } catch (error) {
        console.error("pauseScheduledMaintenanceAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Resumes a paused scheduled maintenance task (admin only).
 * @param {string} scheduledMaintenanceId - The ID of the task to resume.
 * @returns {Promise<object>} Updated task object.
 */
export const resumeScheduledMaintenanceAdmin = async (scheduledMaintenanceId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/scheduled-maintenances/${scheduledMaintenanceId}/resume`);
        return res.data;
    } catch (error) {
        console.error("resumeScheduledMaintenanceAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates and sends an invite (admin only).
 * @param {object} inviteData - Invite data.
 * @returns {Promise<object>} The created invite object.
 */
export const createInviteAdmin = async (inviteData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/invites`, inviteData);
        return res.data;
    } catch (error) {
        console.error("createInviteAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific invite (admin view).
 * @param {string} inviteId - The ID of the invite.
 * @returns {Promise<object>} Invite details object.
 */
export const getInviteByIdAdmin = async (inviteId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/invites/${inviteId}`);
        return res.data;
    } catch (error) {
        console.error("getInviteByIdAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Resends an invite (admin only).
 * @param {string} inviteId - The ID of the invite to resend.
 * @returns {Promise<object>} Success message.
 */
export const resendInviteAdmin = async (inviteId) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/invites/${inviteId}/resend`);
        return res.data;
    } catch (error) {
        console.error("resendInviteAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Revokes an invite (admin only).
 * @param {string} inviteId - The ID of the invite to revoke.
 * @returns {Promise<object>} Success message.
 */
export const revokeInviteAdmin = async (inviteId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/invites/${inviteId}/revoke`); // Backend uses PUT
        return res.data;
    } catch (error) {
        console.error("revokeInviteAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets all comments (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of comment objects.
 */
export const getAllCommentsAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/comments`, { params });
        return res.data;
    } catch (error) {
        console.error("getAllCommentsAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a comment (admin only).
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteCommentAdmin = async (commentId) => {
    try {
        const res = await api.delete(`${ADMIN_BASE_URL}/comments/${commentId}`);
        return res.data;
    } catch (error) {
        console.error("deleteCommentAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets all media files (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of media objects.
 */
export const getAllMediaAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/media`, { params }); // Corrected to /admin/media
        return res.data;
    } catch (error) {
        console.error("getAllMediaAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a media file (admin only).
 * @param {string} mediaId - The ID of the media file to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteMediaAdmin = async (mediaId) => {
    try {
        const res = await api.delete(`${ADMIN_BASE_URL}/media/${mediaId}`); // Corrected to /admin/media/:id
        return res.data;
    } catch (error) {
        console.error("deleteMediaAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets all property user associations (admin view).
 * @param {object} [params={}] - Query parameters for filtering.
 * @returns {Promise<object[]>} Array of property user associations.
 */
export const getAllPropertyUsersAdmin = async (params = {}) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/property-users`, { params });
        return res.data;
    } catch (error) {
        console.error("getAllPropertyUsersAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets details for a specific property user association (admin view).
 * @param {string} propertyUserId - The ID of the property user association.
 * @returns {Promise<object>} Property user association object.
 */
export const getPropertyUserByIdAdmin = async (propertyUserId) => {
    try {
        const res = await api.get(`${ADMIN_BASE_URL}/property-users/${propertyUserId}`);
        return res.data;
    } catch (error) {
        console.error("getPropertyUserByIdAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Creates a new property user association (admin only).
 * @param {object} associationData - Association data.
 * @returns {Promise<object>} The created association object.
 */
export const createPropertyUserAdmin = async (associationData) => {
    try {
        const res = await api.post(`${ADMIN_BASE_URL}/property-users`, associationData);
        return res.data;
    } catch (error) {
        console.error("createPropertyUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a property user association (admin only).
 * @param {string} propertyUserId - The ID of the association.
 * @param {object} updates - Updates to apply.
 * @returns {Promise<object>} Updated association object.
 */
export const updatePropertyUserAdmin = async (propertyUserId, updates) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/property-users/${propertyUserId}`, updates);
        return res.data;
    } catch (error) {
        console.error("updatePropertyUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deactivates a property user association (admin only).
 * @param {string} propertyUserId - The ID of the association to deactivate.
 * @returns {Promise<object>} Updated association object.
 */
export const deactivatePropertyUserAdmin = async (propertyUserId) => {
    try {
        const res = await api.put(`${ADMIN_BASE_URL}/property-users/${propertyUserId}/deactivate`);
        return res.data;
    } catch (error) {
        console.error("deactivatePropertyUserAdmin error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};
