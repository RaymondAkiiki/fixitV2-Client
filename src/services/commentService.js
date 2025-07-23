// client/src/services/commentService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'commentService';
const COMMENT_BASE_URL = '/comments';

/**
 * Adds a new comment to a specified resource
 * @param {Object} data - Comment data
 * @param {string} data.contextType - Resource type ('request', 'scheduledmaintenance', 'property', 'unit')
 * @param {string} data.contextId - Resource ID
 * @param {string} data.message - Comment message
 * @param {boolean} [data.isExternal=false] - Whether comment is from external user
 * @param {string} [data.externalUserName] - External user name (required if isExternal=true)
 * @param {string} [data.externalUserEmail] - External user email (required if isExternal=true)
 * @param {boolean} [data.isInternalNote=false] - Whether comment is an internal note
 * @param {string[]} [data.media=[]] - Array of media IDs
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The created comment
 * @throws {Error} If request fails
 */
export const addComment = async (data, signal) => {
    try {
        // Normalize contextType to lowercase
        const payload = {
            ...data,
            contextType: data.contextType.toLowerCase(),
        };
        
        const res = await api.post(COMMENT_BASE_URL, payload, { signal });
        const { data: responseData, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'addComment', { 
            contextType: data.contextType,
            contextId: data.contextId,
            isInternal: !!data.isInternalNote,
            isExternal: !!data.isExternal,
            hasMedia: Array.isArray(data.media) && data.media.length > 0,
            success: meta.success
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Comment added successfully',
            data: responseData
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        
        console.error("addComment error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves comments for a specified resource
 * @param {Object} params - Query parameters
 * @param {string} params.contextType - Resource type ('request', 'scheduledmaintenance', 'property', 'unit')
 * @param {string} params.contextId - Resource ID
 * @param {boolean} [params.includeInternal=true] - Whether to include internal notes
 * @param {number} [params.limit=100] - Maximum number of comments to return
 * @param {string} [params.sort='createdAt'] - Sort field ('createdAt', 'updatedAt')
 * @param {string} [params.order='asc'] - Sort order ('asc', 'desc')
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Response with comments array
 * @throws {Error} If request fails
 */
export const getComments = async (params, signal) => {
    try {
        // Normalize contextType to lowercase
        const queryParams = {
            ...params,
            contextType: params.contextType.toLowerCase(),
        };
        
        const res = await api.get(COMMENT_BASE_URL, { params: queryParams, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Format comments for display
        const formattedComments = Array.isArray(data) 
            ? data.map(comment => formatComment(comment))
            : [];
        
        logApiResponse(SERVICE_NAME, 'getComments', { 
            contextType: params.contextType,
            contextId: params.contextId,
            count: formattedComments.length,
            includeInternal: params.includeInternal
        });
        
        return {
            success: meta.success,
            count: formattedComments.length,
            data: formattedComments
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        
        console.error("getComments error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates an existing comment
 * @param {string} commentId - Comment ID
 * @param {Object} updates - Updates to apply
 * @param {string} [updates.message] - Updated message
 * @param {boolean} [updates.isInternalNote] - Updated internal note status
 * @param {string[]} [updates.media] - Updated media IDs
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The updated comment
 * @throws {Error} If request fails
 */
export const updateComment = async (commentId, updates, signal) => {
    try {
        const res = await api.put(`${COMMENT_BASE_URL}/${commentId}`, updates, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Format the updated comment
        const formattedComment = formatComment(data);
        
        logApiResponse(SERVICE_NAME, 'updateComment', { 
            commentId,
            updateFields: Object.keys(updates),
            success: meta.success
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Comment updated successfully',
            data: formattedComment
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        
        console.error("updateComment error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a comment
 * @param {string} commentId - Comment ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Success message
 * @throws {Error} If request fails
 */
export const deleteComment = async (commentId, signal) => {
    try {
        const res = await api.delete(`${COMMENT_BASE_URL}/${commentId}`, { signal });
        const { meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteComment', { 
            commentId,
            success: meta.success
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Comment deleted successfully'
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        
        console.error("deleteComment error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets the count of unread mentions for the current user
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<number>} Unread mention count
 * @throws {Error} If request fails
 */
export const getUnreadMentionCount = async (signal) => {
    try {
        const res = await api.get(`${COMMENT_BASE_URL}/mentions/count`, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Extract count from either data object or meta
        const count = data?.count !== undefined ? data.count : (meta.count || 0);
        
        logApiResponse(SERVICE_NAME, 'getUnreadMentionCount', { count });
        
        return count;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        
        console.error("getUnreadMentionCount error:", error);
        // Return 0 on error instead of throwing to prevent UI disruption
        return 0;
    }
};

/**
 * Marks mentions as read for the current user in a specific context
 * @param {Object} params - Parameters
 * @param {string} params.contextType - Resource type
 * @param {string} params.contextId - Resource ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Response with count of marked mentions
 * @throws {Error} If request fails
 */
export const markMentionsAsRead = async (params, signal) => {
    try {
        // Normalize contextType to lowercase
        const payload = {
            ...params,
            contextType: params.contextType.toLowerCase(),
        };
        
        const res = await api.post(`${COMMENT_BASE_URL}/mentions/mark-read`, payload, { signal });
        const { meta } = extractApiResponse(res.data);
        
        // Get count from the response
        const count = meta.count || 0;
        
        logApiResponse(SERVICE_NAME, 'markMentionsAsRead', { 
            contextType: params.contextType,
            contextId: params.contextId,
            count
        });
        
        return {
            success: meta.success,
            message: meta.message || `Marked ${count} mentions as read`,
            count
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        
        console.error("markMentionsAsRead error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Utility function to extract mentioned users from a comment message
 * @param {string} message - Comment message
 * @returns {string[]} Array of usernames or IDs mentioned
 */
export const extractMentions = (message) => {
    if (!message) return [];
    
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const matches = [...message.matchAll(mentionRegex)];
    
    return matches.map(match => match[1]);
};

/**
 * Formats a comment for display
 * @param {Object} comment - Comment object
 * @returns {Object} Formatted comment
 */
export const formatComment = (comment) => {
    if (!comment) return null;
    
    // Extract mentioned users' display names
    const mentionedUsers = comment.mentions?.map(mention => ({
        id: mention.user?._id || mention.user,
        name: mention.user?.firstName 
            ? `${mention.user.firstName} ${mention.user.lastName || ''}`.trim()
            : 'Unknown User',
        isRead: !!mention.readAt
    })) || [];
    
    // Format sender info
    const senderName = comment.isExternal
        ? comment.externalUserName
        : comment.sender
            ? `${comment.sender.firstName || ''} ${comment.sender.lastName || ''}`.trim() || comment.sender.email
            : 'Unknown User';
            
    const formattedDate = new Date(comment.createdAt).toLocaleString();
    const editedDate = comment.lastEditedAt ? new Date(comment.lastEditedAt).toLocaleString() : null;
    
    return {
        ...comment,
        senderName,
        formattedDate,
        editedDate,
        mentionedUsers,
        hasMedia: Array.isArray(comment.media) && comment.media.length > 0
    };
};

/**
 * Highlights @mentions in comment text
 * @param {string} text - Comment text
 * @returns {string} HTML with highlighted mentions
 */
export const highlightMentions = (text) => {
    if (!text) return '';
    
    // Replace @mentions with highlighted spans
    return text.replace(
        /@([a-zA-Z0-9_.-]+)/g, 
        '<span class="mention">@$1</span>'
    );
};

export default {
    addComment,
    getComments,
    updateComment,
    deleteComment,
    getUnreadMentionCount,
    markMentionsAsRead,
    extractMentions,
    formatComment,
    highlightMentions
};