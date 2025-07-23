// client/src/services/vendorService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'vendorService';
const VENDOR_BASE_URL = '/vendors';

/**
 * Retrieves all vendors accessible by the authenticated user, with filtering.
 * @param {Object} [params={}] - Optional query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Paginated vendors data with metadata
 */
export const getAllVendors = async (params = {}, signal) => {
  try {
    const res = await api.get(VENDOR_BASE_URL, { params, signal });
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getAllVendors', { data, meta });
    
    return {
      data,
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 10,
      pages: meta.totalPages || Math.ceil((meta.total || 0) / (meta.limit || 10))
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getAllVendors error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Retrieves details for a specific vendor.
 * @param {string} vendorId - The ID of the vendor
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The vendor object
 */
export const getVendorById = async (vendorId, signal) => {
  try {
    const res = await api.get(`${VENDOR_BASE_URL}/${vendorId}`, { signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getVendorById', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getVendorById error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Creates a new vendor.
 * @param {Object} vendorData - Data for the new vendor
 * @returns {Promise<Object>} The created vendor object
 */
export const createVendor = async (vendorData) => {
  try {
    // Ensure services array values are lowercase
    const payload = {
      ...vendorData,
      services: vendorData.services ? vendorData.services.map(s => String(s).toLowerCase()) : [],
    };
    const res = await api.post(VENDOR_BASE_URL, payload);
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'createVendor', { data });
    
    return data;
  } catch (error) {
    console.error("createVendor error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Updates details for a specific vendor.
 * @param {string} vendorId - The ID of the vendor to update
 * @param {Object} vendorData - Data to update
 * @returns {Promise<Object>} The updated vendor object
 */
export const updateVendor = async (vendorId, vendorData) => {
  try {
    // Ensure services array values are lowercase if provided
    const payload = { ...vendorData };
    if (payload.services) {
      payload.services = payload.services.map(s => String(s).toLowerCase());
    }
    const res = await api.put(`${VENDOR_BASE_URL}/${vendorId}`, payload);
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'updateVendor', { data });
    
    return data;
  } catch (error) {
    console.error("updateVendor error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Deletes a vendor.
 * @param {string} vendorId - The ID of the vendor to delete
 * @returns {Promise<Object>} Success message
 */
export const deleteVendor = async (vendorId) => {
  try {
    const res = await api.delete(`${VENDOR_BASE_URL}/${vendorId}`);
    const response = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'deleteVendor', response);
    
    return response;
  } catch (error) {
    console.error("deleteVendor error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Rates a vendor's performance.
 * @param {string} vendorId - The ID of the vendor to rate
 * @param {Object} ratingData - Data for the rating
 * @returns {Promise<Object>} Success message
 */
export const rateVendor = async (vendorId, ratingData) => {
  try {
    const res = await api.post(`${VENDOR_BASE_URL}/${vendorId}/rate`, ratingData);
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'rateVendor', { data });
    
    return data;
  } catch (error) {
    console.error("rateVendor error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Deactivates a vendor.
 * @param {string} vendorId - The ID of the vendor to deactivate
 * @returns {Promise<Object>} Updated vendor object
 */
export const deactivateVendor = async (vendorId) => {
  try {
    const res = await api.put(`${VENDOR_BASE_URL}/${vendorId}/deactivate`);
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'deactivateVendor', { data });
    
    return data;
  } catch (error) {
    console.error("deactivateVendor error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Gets vendor statistics.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Vendor statistics
 */
export const getVendorStats = async (signal) => {
  try {
    const res = await api.get(`${VENDOR_BASE_URL}/stats`, { signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getVendorStats', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getVendorStats error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get vendors associated with a specific property.
 * @param {string} propertyId - The ID of the property
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Paginated vendors data with metadata
 */
export const getVendorsByProperty = async (propertyId, signal) => {
  try {
    const params = { propertyId, limit: 100 }; // Get more vendors for property-specific listing
    const res = await api.get(VENDOR_BASE_URL, { params, signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getVendorsByProperty', { data });
    
    return {
      data,
      count: data?.length || 0
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getVendorsByProperty error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get vendors by service type.
 * @param {string} service - The service type
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Paginated vendors data with metadata
 */
export const getVendorsByService = async (service, signal) => {
  try {
    const params = { service, limit: 100 }; // Get more vendors for service-specific listing
    const res = await api.get(VENDOR_BASE_URL, { params, signal });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getVendorsByService', { data });
    
    return {
      data,
      count: data?.length || 0
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getVendorsByService error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Associates a vendor with a property.
 * @param {string} vendorId - The ID of the vendor
 * @param {string} propertyId - The ID of the property
 * @returns {Promise<Object>} Updated vendor object
 */
export const associateVendorWithProperty = async (vendorId, propertyId) => {
  try {
    // First get the current vendor to see existing associated properties
    const vendor = await getVendorById(vendorId);
    
    // Create a new array of associated properties including the new one
    const associatedProperties = [...(vendor.associatedProperties || [])];
    
    // Check if property is already associated
    if (!associatedProperties.some(prop => 
      typeof prop === 'string' ? prop === propertyId : prop._id === propertyId
    )) {
      associatedProperties.push(propertyId);
    }
    
    // Update the vendor with the new property association
    const res = await api.put(`${VENDOR_BASE_URL}/${vendorId}`, { 
      associatedProperties 
    });
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'associateVendorWithProperty', { data });
    
    return data;
  } catch (error) {
    console.error("associateVendorWithProperty error:", error);
    throw error.response?.data?.message || error.message;
  }
};

export default {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  rateVendor,
  deactivateVendor,
  getVendorStats,
  getVendorsByProperty,
  getVendorsByService,
  associateVendorWithProperty
};