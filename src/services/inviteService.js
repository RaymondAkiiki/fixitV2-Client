import api from "../api/axios"; // Import the configured Axios instance

/**
 * Sends an invitation to a new user.
 * @param {object} inviteData - Data for the invite: { email, role, propertyId, unitId (optional) }
 * @returns {Promise<object>} Backend response, usually includes inviteId and inviteLink.
 */
export const sendInvite = async (inviteData) => {
    try {
        // Ensure role is sent in lowercase to match backend enum
        const payload = {
            ...inviteData,
            role: inviteData.role.toLowerCase(),
        };
        const res = await api.post('/invites/send', payload); // Updated endpoint to /invites/send
        return res.data;
    } catch (error) {
        console.error("sendInvite error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Accepts an invitation and creates/updates a user account.
 * @param {object} acceptData - Data for accepting invite: { token, email, password, name (optional), phone (optional) }
 * @returns {Promise<object>} Backend response including user details and potentially a new token.
 */
export const acceptInvite = async (acceptData) => {
    try {
        const res = await api.post('/invites/accept', acceptData); // Endpoint is /invites/accept
        return res.data;
    } catch (error) {
        console.error("acceptInvite error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetches all invites.
 * @returns {Promise<object[]>} Returns an array of invite objects.
 */
export const getAllInvites = async () => {
    try {
        const res = await api.get('/invites'); // Assuming a GET endpoint to fetch all invites
        return res.data;
    } catch (error) {
        console.error("getAllInvites error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Revokes an existing invite.
 * @param {string} inviteId - The ID of the invite to revoke.
 * @returns {Promise<object>} Returns a success message or error.
 */
export const revokeInvite = async (inviteId) => {
    try {
        const res = await api.delete(`/invites/${inviteId}`); // Assuming a DELETE endpoint to revoke an invite
        return res.data;
    } catch (error) {
        console.error("revokeInvite error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Resends an existing invite.
 * @param {string} inviteId - The ID of the invite to resend.
 * @returns {Promise<object>} Returns a success message or error.
 */
export const resendInvite = async (inviteId) => {
    try {
        const res = await api.post(`/invites/resend/${inviteId}`); // Assuming a POST endpoint to resend an invite
        return res.data;
    } catch (error) {
        console.error("resendInvite error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Verifies the invite token.
 * @param {string} token - The invite token to verify.
 * @returns {Promise<object>} Returns a success message or error.
 */
export const verifyInviteToken = async (token) => {
    try {
        const res = await api.get(`/invites/verify/${token}`); // Assuming a GET endpoint to verify an invite token
        return res.data;
    } catch (error) {
        console.error("verifyInviteToken error:", error.response?.data || error.message);
        throw error;
    }
};