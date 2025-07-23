import axios from 'axios';

/**
 * Extracts and normalizes data from API responses to provide a consistent structure
 * @param {Object} response - The API response object
 * @returns {Object} Object with data and metadata
 */
export const extractApiResponse = (response) => {
  if (!response) return { data: null, meta: {} };
  
  // Handle response with data field (standard backend format)
  if (response.data !== undefined) {
    return {
      data: response.data,
      meta: {
        success: response.success !== false,
        message: response.message,
        count: response.count,
        total: response.total,
        page: response.page || 1,
        limit: response.limit || 10,
        pages: response.pages || 1
      }
    };
  }
  
  // Handle array response (unusual but defensive)
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: {
        success: true,
        total: response.length,
        count: response.length,
        page: 1,
        limit: response.length,
        pages: 1
      }
    };
  }
  
  // Default case - the entire response is the data
  return {
    data: response,
    meta: {
      success: true,
      total: 0,
      count: 0,
      page: 1,
      limit: 10,
      pages: 1
    }
  };
};

/**
 * Logs API request and response details for debugging (can be toggled off in production)
 * @param {string} service - Service name
 * @param {string} method - Method name
 * @param {Object} data - Response data
 */
export const logApiResponse = (service, method, data) => {
  if (import.meta.env.DEV) {
    console.debug(`API Response [${service}.${method}]`, data);
  }
};

/**
 * Standardized error handler for API requests
 * @param {Error} error - The error object
 * @param {string} context - Context for logging (e.g., 'getAllProperties')
 * @returns {never} - Always throws
 */
export const handleApiError = (error, context) => {
  if (axios.isCancel?.(error)) {
    console.log('Request was canceled', error.message);
    throw new Error('Request canceled');
  }
  
  console.error(`${context} error:`, error);
  throw error.response?.data?.message || error.message;
};