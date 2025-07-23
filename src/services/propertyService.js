// client/src/services/propertyService.js

import api from "../api/axios.js";
import { extractApiResponse, logApiResponse, handleApiError } from "../utils/apiUtils.js";

const SERVICE_NAME = 'propertyService';
const PROPERTY_BASE_URL = '/properties';

/**
 * Retrieves a list of properties accessible by the authenticated user
 * @param {Object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Paginated properties with metadata
 * @throws {Error} If request fails
 */
export const getAllProperties = async (params = {}, signal) => {
    try {
        const res = await api.get(PROPERTY_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getAllProperties', { data, meta });
        
        return {
            properties: data || [],
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.pages || 1
        };
    } catch (error) {
        handleApiError(error, 'getAllProperties');
    }
};

/**
 * Retrieves details for a specific property
 * @param {string} propertyId - Property ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Property details
 * @throws {Error} If request fails
 */
export const getPropertyById = async (propertyId, signal) => {
    try {
        const res = await api.get(`${PROPERTY_BASE_URL}/${propertyId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getPropertyById', { data });
        
        return data;
    } catch (error) {
        handleApiError(error, 'getPropertyById');
    }
};

/**
 * Creates a new property
 * @param {Object} propertyData - Property data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Created property
 * @throws {Error} If request fails
 */
export const createProperty = async (propertyData, signal) => {
    try {
        const res = await api.post(PROPERTY_BASE_URL, propertyData, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createProperty', { data });
        
        return data;
    } catch (error) {
        handleApiError(error, 'createProperty');
    }
};

/**
 * Updates a property
 * @param {string} propertyId - Property ID
 * @param {Object} propertyData - Update data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Updated property
 * @throws {Error} If request fails
 */
export const updateProperty = async (propertyId, propertyData, signal) => {
    try {
        const res = await api.put(`${PROPERTY_BASE_URL}/${propertyId}`, propertyData, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateProperty', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        
        console.error("updateProperty error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Object>} Success message
 * @throws {Error} If request fails
 */
export const deleteProperty = async (propertyId) => {
    try {
        const res = await api.delete(`${PROPERTY_BASE_URL}/${propertyId}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteProperty', response);
        
        return response; // Return full response for delete operations
    } catch (error) {
        console.error("deleteProperty error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a user to a property with specific roles
 * @param {string} propertyId - Property ID
 * @param {string} userIdToAssign - User ID to assign
 * @param {string[]} roles - Roles to assign
 * @param {string} [unitId] - Unit ID (required for tenant role)
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Updated PropertyUser record
 * @throws {Error} If request fails
 */
export const assignUserToProperty = async (propertyId, userIdToAssign, roles, unitId = null, signal) => {
    try {
        const payload = {
            userIdToAssign,
            roles: roles.map(role => role.toLowerCase()),
            ...(unitId && { unitId })
        };
        
        const res = await api.post(`${PROPERTY_BASE_URL}/${propertyId}/assign-user`, payload, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'assignUserToProperty', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        
        console.error("assignUserToProperty error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Removes user roles from a property
 * @param {string} propertyId - Property ID
 * @param {string} userIdToRemove - User ID to remove
 * @param {string[]} rolesToRemove - Roles to remove
 * @param {string} [unitId] - Unit ID (for tenant role)
 * @returns {Promise<Object>} Success message
 * @throws {Error} If request fails
 */
export const removeUserFromProperty = async (propertyId, userIdToRemove, rolesToRemove, unitId = null) => {
    try {
        const params = {
            rolesToRemove: rolesToRemove.map(role => role.toLowerCase()),
            ...(unitId && { unitId })
        };
        
        const res = await api.delete(`${PROPERTY_BASE_URL}/${propertyId}/remove-user/${userIdToRemove}`, { params });
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'removeUserFromProperty', response);
        
        return response; // Return full response for delete operations
    } catch (error) {
        console.error("removeUserFromProperty error:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Formats property data for display
 * @param {Object} property - Property object
 * @returns {Object} Formatted property
 */
export const formatProperty = (property) => {
    if (!property) return null;
    
    const address = property.address || {};
    const fullAddress = [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country
    ].filter(Boolean).join(', ');
    
    return {
        ...property,
        fullAddress,
        typeDisplay: capitalizeFirstLetter(property.propertyType || 'residential'),
        unitCount: property.units?.length || 0,
        formattedBudget: property.annualOperatingBudget ? 
            `$${property.annualOperatingBudget.toLocaleString()}` : 
            'Not specified',
        status: property.isActive ? 'Active' : 'Inactive',
        statusClass: property.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
        hasAmenities: Array.isArray(property.amenities) && property.amenities.length > 0,
        userRoles: Array.isArray(property.userRoles) ? property.userRoles : []
    };
};

/**
 * Groups properties by city or country
 * @param {Array<Object>} properties - Array of properties
 * @param {string} [groupBy='city'] - Field to group by ('city', 'country', 'type')
 * @returns {Object} Properties grouped by the specified field
 */
export const groupProperties = (properties, groupBy = 'city') => {
    if (!Array.isArray(properties) || properties.length === 0) return {};
    
    const grouped = {};
    
    properties.forEach(property => {
        let key;
        
        if (groupBy === 'city') {
            key = property.address?.city || 'Unspecified';
        } else if (groupBy === 'country') {
            key = property.address?.country || 'Unspecified';
        } else if (groupBy === 'type') {
            key = property.propertyType || 'residential';
            key = capitalizeFirstLetter(key);
        } else {
            key = 'All Properties';
        }
        
        if (!grouped[key]) {
            grouped[key] = [];
        }
        
        grouped[key].push(property);
    });
    
    return grouped;
};

/**
 * Helper function to capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export default {
    getAllProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    assignUserToProperty,
    removeUserFromProperty,
    formatProperty,
    groupProperties
};