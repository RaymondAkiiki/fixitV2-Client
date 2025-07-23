// client/src/services/messageService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'messageService';
const MESSAGE_BASE_URL = '/messages';

/**
 * Sends a new message
 * @param {Object} messageData - Message data
 * @param {string} messageData.recipientId - Recipient user ID
 * @param {string} messageData.content - Message content
 * @param {string} [messageData.propertyId] - Optional property context
 * @param {string} [messageData.unitId] - Optional unit context
 * @param {string} [messageData.category='general'] - Message category
 * @param {string[]} [messageData.attachments] - Optional array of media IDs
 * @param {string} [messageData.parentMessage] - Optional parent message ID for replies
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The created message
 * @throws {Error} If the request fails
 */
export const sendMessage = async (messageData, signal) => {
    try {
        const res = await api.post(MESSAGE_BASE_URL, messageData, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'sendMessage', { 
            success: meta.success, 
            recipientId: messageData.recipientId 
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Message sent successfully',
            data
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("sendMessage error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves messages for the authenticated user with filtering and pagination
 * @param {Object} [params={}] - Query parameters
 * @param {string} [params.type='inbox'] - 'inbox' or 'sent'
 * @param {string} [params.propertyId] - Filter by property
 * @param {string} [params.unitId] - Filter by unit
 * @param {string} [params.otherUserId] - Filter by conversation partner
 * @param {string} [params.category] - Filter by category
 * @param {boolean} [params.unreadOnly=false] - Filter to unread messages only
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=50] - Results per page
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Paginated messages with metadata
 * @throws {Error} If the request fails
 */
export const getMessages = async (params = {}, signal) => {
    try {
        const res = await api.get(MESSAGE_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Format messages using the formatMessage function
        const formattedMessages = Array.isArray(data) 
            ? data.map(message => formatMessage(message))
            : [];
        
        logApiResponse(SERVICE_NAME, 'getMessages', { 
            count: formattedMessages.length,
            page: meta.page,
            limit: meta.limit
        });
        
        return {
            data: formattedMessages,
            pagination: {
                total: meta.total || formattedMessages.length,
                page: meta.page || 1,
                limit: meta.limit || 50,
                pages: meta.pages || Math.ceil((meta.total || formattedMessages.length) / (meta.limit || 50))
            }
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("getMessages error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a single message by ID
 * @param {string} messageId - Message ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The message
 * @throws {Error} If the request fails
 */
export const getMessageById = async (messageId, signal) => {
    try {
        const res = await api.get(`${MESSAGE_BASE_URL}/${messageId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the message using the formatMessage function
        const formattedMessage = formatMessage(data);
        
        logApiResponse(SERVICE_NAME, 'getMessageById', { 
            messageId,
            success: !!formattedMessage
        });
        
        return formattedMessage;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("getMessageById error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks a specific message as read
 * @param {string} messageId - Message ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The updated message
 * @throws {Error} If the request fails
 */
export const markMessageAsRead = async (messageId, signal) => {
    try {
        const res = await api.patch(`${MESSAGE_BASE_URL}/${messageId}/read`, {}, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Format the message using the formatMessage function
        const formattedMessage = formatMessage(data);
        
        logApiResponse(SERVICE_NAME, 'markMessageAsRead', { 
            messageId,
            success: meta.success
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Message marked as read',
            data: formattedMessage
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("markMessageAsRead error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks all messages in a conversation as read
 * @param {Object} data - Request data
 * @param {string} data.otherUserId - Conversation partner ID
 * @param {string} [data.propertyId] - Optional property filter
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Response with count of marked messages
 * @throws {Error} If the request fails
 */
export const markConversationAsRead = async (data, signal) => {
    try {
        const res = await api.post(`${MESSAGE_BASE_URL}/mark-conversation-read`, data, { signal });
        const { meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'markConversationAsRead', { 
            otherUserId: data.otherUserId,
            success: meta.success,
            count: meta.count
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Conversation marked as read',
            count: meta.count || 0
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("markConversationAsRead error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets the count of unread messages
 * @param {Object} [params={}] - Query parameters
 * @param {string} [params.propertyId] - Filter by property
 * @param {string} [params.category] - Filter by category
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<number>} Unread message count
 * @throws {Error} If the request fails
 */
export const getUnreadMessageCount = async (params = {}, signal) => {
    try {
        const res = await api.get(`${MESSAGE_BASE_URL}/unread/count`, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Extract count from either data object or meta
        const count = data?.count !== undefined ? data.count : (meta.count || 0);
        
        logApiResponse(SERVICE_NAME, 'getUnreadMessageCount', { count });
        
        return count;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("getUnreadMessageCount error:", error);
        // Return 0 on error instead of throwing to prevent UI disruption
        return 0;
    }
};

/**
 * Deletes a specific message
 * @param {string} messageId - Message ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Success message
 * @throws {Error} If the request fails
 */
export const deleteMessage = async (messageId, signal) => {
    try {
        const res = await api.delete(`${MESSAGE_BASE_URL}/${messageId}`, { signal });
        const { meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteMessage', { 
            messageId,
            success: meta.success
        });
        
        return {
            success: meta.success,
            message: meta.message || 'Message deleted successfully'
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error("deleteMessage error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Formats a message for display
 * @param {Object} message - Message object
 * @returns {Object} Formatted message
 */
export const formatMessage = (message) => {
    if (!message) return null;
    
    const senderName = message.sender
        ? `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email
        : 'Unknown User';
        
    const recipientName = message.recipient
        ? `${message.recipient.firstName || ''} ${message.recipient.lastName || ''}`.trim() || message.recipient.email
        : 'Unknown User';
        
    const formattedDate = new Date(message.createdAt).toLocaleString();
    const readStatus = message.isRead ? 'Read' : 'Unread';
    const readDate = message.readAt ? new Date(message.readAt).toLocaleString() : null;
    
    const contextInfo = [];
    if (message.property?.name) {
        contextInfo.push(message.property.name);
    }
    if (message.unit?.unitName) {
        contextInfo.push(`Unit ${message.unit.unitName}`);
    }
    
    return {
        ...message,
        senderName,
        recipientName,
        formattedDate,
        readStatus,
        readDate,
        contextInfo: contextInfo.join(' - '),
        hasAttachments: Array.isArray(message.attachments) && message.attachments.length > 0
    };
};

/**
 * Groups messages by conversation
 * @param {Array<Object>} messages - Array of messages
 * @param {string} currentUserId - Current user ID
 * @returns {Object} Grouped conversations
 */
export const groupMessagesByConversation = (messages, currentUserId) => {
    if (!Array.isArray(messages) || !currentUserId) return {};
    
    const conversations = {};
    
    messages.forEach(message => {
        // Determine the other party in the conversation
        const otherPartyId = message.sender?._id === currentUserId
            ? message.recipient?._id
            : message.sender?._id;
            
        if (!otherPartyId) return;
        
        // Initialize conversation if it doesn't exist
        if (!conversations[otherPartyId]) {
            const otherParty = message.sender?._id === currentUserId
                ? message.recipient
                : message.sender;
                
            conversations[otherPartyId] = {
                otherParty,
                messages: [],
                unreadCount: 0,
                lastMessage: null
            };
        }
        
        // Add message to conversation
        conversations[otherPartyId].messages.push(message);
        
        // Update unread count if this is an unread message to the current user
        if (!message.isRead && message.recipient?._id === currentUserId) {
            conversations[otherPartyId].unreadCount++;
        }
        
        // Update last message if this is more recent
        if (!conversations[otherPartyId].lastMessage || 
            new Date(message.createdAt) > new Date(conversations[otherPartyId].lastMessage.createdAt)) {
            conversations[otherPartyId].lastMessage = message;
        }
    });
    
    // Sort messages within each conversation
    Object.values(conversations).forEach(convo => {
        convo.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    
    return conversations;
};

export default {
    sendMessage,
    getMessages,
    getMessageById,
    markMessageAsRead,
    markConversationAsRead,
    getUnreadMessageCount,
    deleteMessage,
    formatMessage,
    groupMessagesByConversation
};