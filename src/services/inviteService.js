// client/src/services/inviteService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'inviteService';
const INVITE_BASE_URL = '/invites';
const PUBLIC_INVITE_BASE_URL = '/invites/public';

/**
 * Creates and sends an invitation to a new user
 * @param {Object} inviteData - Invitation details
 * @param {string} inviteData.email - Recipient's email address
 * @param {string[]} inviteData.roles - Roles to assign to the invitee
 * @param {string} [inviteData.propertyId] - ID of associated property
 * @param {string} [inviteData.unitId] - ID of associated unit (required for tenant role)
 * @param {string} [inviteData.phone] - Optional phone number for SMS invitation
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Response with created invitation details
 */
export const createInvite = async (inviteData, signal) => {
    try {
        // Ensure roles are lowercase to match backend enum
        const payload = {
            ...inviteData,
            roles: inviteData.roles.map(role => role.toLowerCase()),
        };
        
        const res = await api.post(INVITE_BASE_URL, payload, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createInvite', { success: meta.success, data });
        
        return {
            success: meta.success,
            message: meta.message || 'Invitation created successfully',
            data
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("createInvite error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Fetches all invites with optional filtering and pagination
 * @param {Object} [params={}] - Query parameters
 * @param {string} [params.status] - Filter by invite status
 * @param {string} [params.propertyId] - Filter by property ID
 * @param {string} [params.email] - Filter by recipient email
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Response with invites and pagination data
 */
export const getAllInvites = async (params = {}, signal) => {
    try {
        const res = await api.get(INVITE_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getAllInvites', { 
            count: meta.count, 
            total: meta.total, 
            page: meta.page
        });
        
        return {
            data,
            total: meta.total || 0,
            count: meta.count || (data ? data.length : 0),
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.pages || 1
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("getAllInvites error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets a single invite by ID
 * @param {string} inviteId - Invite ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Invite details
 */
export const getInviteById = async (inviteId, signal) => {
    try {
        const res = await api.get(`${INVITE_BASE_URL}/${inviteId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getInviteById', { inviteId, data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("getInviteById error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Cancels an invitation
 * @param {string} inviteId - ID of the invite to cancel
 * @returns {Promise<Object>} Response with success message
 */
export const cancelInvite = async (inviteId) => {
    try {
        const res = await api.patch(`${INVITE_BASE_URL}/${inviteId}/cancel`);
        const { meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'cancelInvite', { 
            inviteId, 
            success: meta.success, 
            message: meta.message 
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Invitation cancelled successfully'
        };
    } catch (error) {
        console.error("cancelInvite error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Resends an existing invite
 * @param {string} inviteId - ID of the invite to resend
 * @returns {Promise<Object>} Response with updated invite details
 */
export const resendInvite = async (inviteId) => {
    try {
        const res = await api.patch(`${INVITE_BASE_URL}/${inviteId}/resend`);
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'resendInvite', { 
            inviteId, 
            success: meta.success, 
            data 
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Invitation resent successfully',
            data
        };
    } catch (error) {
        console.error("resendInvite error:", error);
        throw error.response?.data?.message || error.message;
    }
};

// --- Public invitation endpoints (no authentication required) ---

/**
 * Verifies an invitation token
 * @param {string} token - Invitation token
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Verified invite details
 */
export const verifyInviteToken = async (token, signal) => {
    try {
        const res = await api.get(`${PUBLIC_INVITE_BASE_URL}/${token}/verify`, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'verifyInviteToken', { 
            token: token.substring(0, 4) + '***', // Log partial token for privacy
            success: meta.success
        });
        
        return {
            success: meta.success,
            message: meta.message,
            data
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("verifyInviteToken error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Accepts an invitation
 * @param {string} token - Invitation token
 * @param {Object} userData - User account details
 * @param {string} userData.email - User's email (must match invitation)
 * @param {string} [userData.firstName] - User's first name
 * @param {string} [userData.lastName] - User's last name
 * @param {string} [userData.password] - Password for new account
 * @param {string} [userData.confirmPassword] - Password confirmation
 * @param {string} [userData.phone] - User's phone number
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Response with user account and token
 */
export const acceptInvite = async (token, userData, signal) => {
    try {
        const res = await api.post(`${PUBLIC_INVITE_BASE_URL}/${token}/accept`, userData, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'acceptInvite', { 
            token: token.substring(0, 4) + '***', // Log partial token for privacy
            success: meta.success,
            isNewUser: data?.isNewUser
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Invitation accepted successfully',
            data
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("acceptInvite error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Declines an invitation
 * @param {string} token - Invitation token
 * @param {Object} [data={}] - Additional data
 * @param {string} [data.reason] - Reason for declining
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Response with success message
 */
export const declineInvite = async (token, data = {}, signal) => {
    try {
        const res = await api.post(`${PUBLIC_INVITE_BASE_URL}/${token}/decline`, data, { signal });
        const { meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'declineInvite', { 
            token: token.substring(0, 4) + '***', // Log partial token for privacy
            success: meta.success
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Invitation declined successfully'
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("declineInvite error:", error);
        throw error.response?.data?.message || error.message;
    }
};

export default {
    createInvite,
    getAllInvites,
    getInviteById,
    cancelInvite,
    resendInvite,
    verifyInviteToken,
    acceptInvite,
    declineInvite
};