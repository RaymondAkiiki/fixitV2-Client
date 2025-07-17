// client/src/services/inviteService.js

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