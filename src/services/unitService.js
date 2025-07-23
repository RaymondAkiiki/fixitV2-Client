// client/src/services/unitService.js

import api from '../api/axios';
import axios from 'axios';
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'unitService';
const PROPERTY_UNIT_BASE_URL = '/properties';

/**
 * Creates a new unit within a property
 * @param {string} propertyId - Property ID
 * @param {Object} unitData - Unit data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Created unit
 * @throws {Error} If request fails
 */
export const createUnit = async (propertyId, unitData, signal) => {
    try {
        const res = await api.post(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units`, unitData, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createUnit', { data });
        
        return data?.unit || data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error('Error creating unit:', error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets units for a property with filtering and pagination
 * @param {string} propertyId - Property ID
 * @param {Object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Paginated units
 * @throws {Error} If request fails
 */
export const getUnitsForProperty = async (propertyId, params = {}, signal) => {
    try {
        const res = await api.get(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units`, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getUnitsForProperty', { data, meta });
        
        return {
            units: data || [],
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.pages || 1
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error('Error getting units:', error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets a specific unit by ID
 * @param {string} propertyId - Property ID
 * @param {string} unitId - Unit ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Unit details
 * @throws {Error} If request fails
 */
export const getUnitById = async (propertyId, unitId, signal) => {
    try {
        const res = await api.get(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getUnitById', { data });
        
        return data?.unit || data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error('Request canceled');
        }
        console.error('Error getting unit details:', error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a unit
 * @param {string} propertyId - Property ID
 * @param {string} unitId - Unit ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated unit
 * @throws {Error} If request fails
 */
export const updateUnit = async (propertyId, unitId, updates) => {
    try {
        const res = await api.put(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`, updates);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateUnit', { data });
        
        return data?.unit || data;
    } catch (error) {
        console.error('Error updating unit:', error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a unit
 * @param {string} propertyId - Property ID
 * @param {string} unitId - Unit ID
 * @returns {Promise<Object>} Success message
 * @throws {Error} If request fails
 */
export const deleteUnit = async (propertyId, unitId) => {
    try {
        const res = await api.delete(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteUnit', response);
        
        return response;
    } catch (error) {
        console.error('Error deleting unit:', error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Assigns a tenant to a unit
 * @param {string} propertyId - Property ID
 * @param {string} unitId - Unit ID
 * @param {string} tenantId - Tenant user ID
 * @returns {Promise<Object>} Updated unit
 * @throws {Error} If request fails
 */
export const assignTenantToUnit = async (propertyId, unitId, tenantId) => {
    try {
        const res = await api.post(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}/assign-tenant`, { tenantId });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'assignTenantToUnit', { data });
        
        return data?.unit || data;
    } catch (error) {
        console.error('Error assigning tenant to unit:', error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Removes a tenant from a unit
 * @param {string} propertyId - Property ID
 * @param {string} unitId - Unit ID
 * @param {string} tenantId - Tenant user ID
 * @returns {Promise<Object>} Updated unit
 * @throws {Error} If request fails
 */
export const removeTenantFromUnit = async (propertyId, unitId, tenantId) => {
    try {
        const res = await api.delete(`${PROPERTY_UNIT_BASE_URL}/${propertyId}/units/${unitId}/remove-tenant/${tenantId}`);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'removeTenantFromUnit', { data });
        
        return data?.unit || data;
    } catch (error) {
        console.error('Error removing tenant from unit:', error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Formats unit data for display
 * @param {Object} unit - Unit object
 * @returns {Object} Formatted unit
 */
export const formatUnit = (unit) => {
    if (!unit) return null;
    
    return {
        ...unit,
        formattedRent: unit.rentAmount ? `$${unit.rentAmount.toLocaleString()}` : 'N/A',
        formattedDeposit: unit.depositAmount ? `$${unit.depositAmount.toLocaleString()}` : 'N/A',
        occupancyStatus: unit.tenants && unit.tenants.length > 0 ? 'Occupied' : 'Vacant',
        tenantCount: unit.tenants ? unit.tenants.length : 0,
        formattedLastInspection: unit.lastInspected ? new Date(unit.lastInspected).toLocaleDateString() : 'Never',
        formattedNextInspection: unit.nextInspectionDate ? new Date(unit.nextInspectionDate).toLocaleDateString() : 'Not scheduled',
        daysSinceLastInspection: unit.lastInspected 
            ? Math.floor((new Date() - new Date(unit.lastInspected)) / (1000 * 60 * 60 * 24)) 
            : null,
        statusClass: getStatusClass(unit.status)
    };
};

/**
 * Gets CSS class based on unit status
 * @param {string} status - Unit status
 * @returns {string} CSS class name
 */
const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'vacant':
            return 'bg-green-100 text-green-800';
        case 'occupied':
            return 'bg-blue-100 text-blue-800';
        case 'under_maintenance':
            return 'bg-yellow-100 text-yellow-800';
        case 'unavailable':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Groups units by floor
 * @param {Array<Object>} units - Array of units
 * @returns {Object} Units grouped by floor
 */
export const groupUnitsByFloor = (units) => {
    if (!Array.isArray(units) || units.length === 0) return {};
    
    const grouped = {};
    
    units.forEach(unit => {
        const floor = unit.floor || 'Unspecified';
        if (!grouped[floor]) {
            grouped[floor] = [];
        }
        grouped[floor].push(unit);
    });
    
    return grouped;
};

export default {
    createUnit,
    getUnitsForProperty,
    getUnitById,
    updateUnit,
    deleteUnit,
    assignTenantToUnit,
    removeTenantFromUnit,
    formatUnit,
    groupUnitsByFloor
};