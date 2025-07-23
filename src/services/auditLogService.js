// client/src/services/auditLogService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'auditLogService';
const AUDIT_BASE_URL = '/audit-logs';

/**
 * Get audit logs with filtering and pagination
 * @param {Object} options - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} - The processed API response
 */
export const getAuditLogs = async (options = {}, signal) => {
  try {
    const res = await api.get(AUDIT_BASE_URL, { params: options, signal });
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getAuditLogs', { 
      count: Array.isArray(data) ? data.length : 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
      filterKeys: Object.keys(options)
    });
    
    return {
      data,
      pagination: {
        page: meta.page || 1,
        limit: meta.limit || 20,
        total: meta.total || 0,
        pages: meta.pages || 1
      }
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    console.error('Error fetching audit logs:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get a single audit log by ID
 * @param {string} id - The audit log ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} - The processed API response
 */
export const getAuditLogById = async (id, signal) => {
  try {
    const res = await api.get(`${AUDIT_BASE_URL}/${id}`, { signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getAuditLogById', { 
      id, 
      success: !!data
    });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    console.error(`Error fetching audit log ${id}:`, error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get audit history for a specific resource
 * @param {string} resourceType - The type of resource
 * @param {string} resourceId - The ID of the resource
 * @param {Object} options - Additional options like limit
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} - The processed API response
 */
export const getResourceHistory = async (resourceType, resourceId, options = {}, signal) => {
  try {
    const res = await api.get(
      `${AUDIT_BASE_URL}/resources/${resourceType}/${resourceId}`, 
      { params: options, signal }
    );
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getResourceHistory', { 
      resourceType, 
      resourceId,
      historyCount: Array.isArray(data) ? data.length : 0,
      options: Object.keys(options)
    });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    console.error(`Error fetching history for ${resourceType}:${resourceId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get all audit logs for a specific user
 * @param {string} userId - The user ID
 * @param {Object} options - Pagination and sorting options
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} - The processed API response
 */
export const getUserAuditLogs = async (userId, options = {}, signal) => {
  try {
    const res = await api.get(
      `${AUDIT_BASE_URL}/users/${userId}`,
      { params: options, signal }
    );
    
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getUserAuditLogs', { 
      userId, 
      logsCount: Array.isArray(data) ? data.length : 0,
      options: Object.keys(options)
    });
    
    return {
      data,
      pagination: {
        page: meta.page || 1,
        limit: meta.limit || 20,
        total: meta.total || 0,
        pages: meta.pages || 1
      }
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    console.error(`Error fetching audit logs for user ${userId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get summary statistics for the dashboard
 * @param {number} days - Number of days to include in the summary
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} - The processed API response
 */
export const getDashboardSummary = async (days = 30, signal) => {
  try {
    const res = await api.get(
      `${AUDIT_BASE_URL}/dashboard/summary`,
      { params: { days }, signal }
    );
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getDashboardSummary', { 
      days,
      totalActions: data?.totalActions,
      errorCount: data?.errorCount
    });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    console.error('Error fetching audit log dashboard summary:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get all available action types for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<string[]>} - Array of action types
 */
export const getActionTypes = async (signal) => {
  try {
    // Get a sample of logs to extract action types
    const response = await getAuditLogs({ limit: 1000 }, signal);
    
    // Extract unique action types
    const logs = response.data || [];
    const actions = [...new Set(logs.map(log => log.action).filter(Boolean))];
    
    logApiResponse(SERVICE_NAME, 'getActionTypes', { 
      count: actions.length 
    });
    
    return actions.sort();
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    console.error('Error fetching audit log action types:', error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get all available resource types for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<string[]>} - Array of resource types
 */
export const getResourceTypes = async (signal) => {
  try {
    // Get a sample of logs to extract resource types
    const response = await getAuditLogs({ limit: 1000 }, signal);
    
    // Extract unique resource types
    const logs = response.data || [];
    const resourceTypes = [...new Set(logs.map(log => log.resourceType).filter(Boolean))];
    
    logApiResponse(SERVICE_NAME, 'getResourceTypes', { 
      count: resourceTypes.length 
    });
    
    return resourceTypes.sort();
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    console.error('Error fetching audit log resource types:', error);
    throw error.response?.data?.message || error.message;
  }
};

export default {
  getAuditLogs,
  getAuditLogById,
  getResourceHistory,
  getUserAuditLogs,
  getDashboardSummary,
  getActionTypes,
  getResourceTypes
};