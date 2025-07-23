// client/src/services/leaseService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'leaseService';
const LEASE_BASE_URL = '/leases';

/**
 * Creates a new lease agreement
 * @param {Object} leaseData - Lease data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Created lease with success message
 * @throws {Error} If request fails
 */
export const createLease = async (leaseData, signal) => {
    try {
        const res = await api.post(LEASE_BASE_URL, leaseData, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createLease', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error creating lease:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets leases with filtering and pagination
 * @param {Object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Paginated leases
 * @throws {Error} If request fails
 */
export const getLeases = async (params = {}, signal) => {
    try {
        const res = await api.get(LEASE_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getLeases', { data, meta });
        
        return {
            data,
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.pages || 1
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error fetching leases:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets a specific lease by ID
 * @param {string} leaseId - Lease ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Lease details
 * @throws {Error} If request fails
 */
export const getLeaseById = async (leaseId, signal) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/${leaseId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getLeaseById', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error fetching lease:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a lease
 * @param {string} leaseId - Lease ID
 * @param {Object} updates - Update data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Updated lease
 * @throws {Error} If request fails
 */
export const updateLease = async (leaseId, updates, signal) => {
    try {
        const res = await api.put(`${LEASE_BASE_URL}/${leaseId}`, updates, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateLease', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error updating lease:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a lease (soft delete)
 * @param {string} leaseId - Lease ID
 * @returns {Promise<Object>} Success message
 * @throws {Error} If request fails
 */
export const deleteLease = async (leaseId) => {
    try {
        const res = await api.delete(`${LEASE_BASE_URL}/${leaseId}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteLease', response);
        
        return response;
    } catch (error) {
        console.error("Error deleting lease:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets leases that are expiring soon
 * @param {Object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Expiring leases data
 * @throws {Error} If request fails
 */
export const getExpiringLeases = async (params = {}, signal) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/expiring`, { params, signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getExpiringLeases', { data });
        
        return {
            data,
            count: data?.length || 0
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error fetching expiring leases:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks a lease as having renewal notice sent
 * @param {string} leaseId - Lease ID
 * @returns {Promise<Object>} Updated lease
 * @throws {Error} If request fails
 */
export const markRenewalNoticeSent = async (leaseId) => {
    try {
        const res = await api.put(`${LEASE_BASE_URL}/${leaseId}/mark-renewal-sent`);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'markRenewalNoticeSent', { data });
        
        return data;
    } catch (error) {
        console.error("Error marking renewal notice sent:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Uploads a document to a lease
 * @param {string} leaseId - Lease ID
 * @param {File} documentFile - Document file
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Created media document
 * @throws {Error} If request fails
 */
export const uploadLeaseDocument = async (leaseId, documentFile, signal) => {
    try {
        const formData = new FormData();
        formData.append('documentFile', documentFile);
        
        const res = await api.post(
            `${LEASE_BASE_URL}/${leaseId}/documents`, 
            formData, 
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal
            }
        );
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'uploadLeaseDocument', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error uploading document:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets download info for a lease document
 * @param {string} leaseId - Lease ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Download info
 * @throws {Error} If request fails
 */
export const getLeaseDocumentDownloadInfo = async (leaseId, documentId) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/${leaseId}/documents/${documentId}/download`);
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getLeaseDocumentDownloadInfo', { data, meta });
        
        return {
            downloadUrl: data?.downloadUrl || meta?.downloadUrl,
            fileName: data?.fileName || meta?.fileName,
            mimeType: data?.mimeType || meta?.mimeType
        };
    } catch (error) {
        console.error("Error getting document download info:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Downloads a lease document
 * @param {string} downloadUrl - Document download URL
 * @param {string} fileName - File name
 * @returns {Promise<void>} Initiates file download
 * @throws {Error} If download fails
 */
export const downloadLeaseDocument = async (downloadUrl, fileName) => {
    try {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = fileName || 'lease-document';
        link.rel = 'noopener noreferrer';
        
        // Trigger click to start download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    } catch (error) {
        console.error("Error downloading document:", error);
        throw new Error(`Failed to download document: ${error.message}`);
    }
};

/**
 * Generates a lease document from a template
 * @param {string} leaseId - Lease ID
 * @param {string} documentType - Document type
 * @returns {Promise<Object>} Generated document info
 * @throws {Error} If generation fails
 */
export const generateLeaseDocument = async (leaseId, documentType) => {
    try {
        const res = await api.post(`${LEASE_BASE_URL}/${leaseId}/generate-document`, { documentType });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'generateLeaseDocument', { data });
        
        return data;
    } catch (error) {
        console.error("Error generating document:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Adds an amendment to a lease
 * @param {string} leaseId - Lease ID
 * @param {Object} amendmentData - Amendment data
 * @param {string} amendmentData.description - Amendment description
 * @param {string} [amendmentData.documentId] - Optional document ID
 * @returns {Promise<Object>} Updated lease
 * @throws {Error} If request fails
 */
export const addLeaseAmendment = async (leaseId, amendmentData) => {
    try {
        const res = await api.post(`${LEASE_BASE_URL}/${leaseId}/amendments`, amendmentData);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'addLeaseAmendment', { data });
        
        return data;
    } catch (error) {
        console.error("Error adding lease amendment:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets rent report for a lease
 * @param {string} leaseId - Lease ID
 * @param {Object} [params={}] - Report parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} Rent report data
 * @throws {Error} If request fails
 */
export const getLeaseRentReport = async (leaseId, params = {}, signal) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/${leaseId}/rent-report`, { params, signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getLeaseRentReport', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error getting rent report:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Generates a rent report PDF
 * @param {string} leaseId - Lease ID
 * @param {Object} [params={}] - Report parameters
 * @returns {Promise<Object>} Generated document info
 * @throws {Error} If generation fails
 */
export const generateRentReportDocument = async (leaseId, params = {}) => {
    try {
        const res = await api.post(`${LEASE_BASE_URL}/${leaseId}/rent-report/generate`, params);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'generateRentReportDocument', { data });
        
        return data;
    } catch (error) {
        console.error("Error generating rent report:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Formats lease data for display
 * @param {Object} lease - Lease object
 * @returns {Object} Formatted lease
 */
export const formatLease = (lease) => {
    if (!lease) return null;
    
    return {
        ...lease,
        formattedStartDate: lease.leaseStartDate ? new Date(lease.leaseStartDate).toLocaleDateString() : 'N/A',
        formattedEndDate: lease.leaseEndDate ? new Date(lease.leaseEndDate).toLocaleDateString() : 'N/A',
        formattedRent: lease.monthlyRent ? `${lease.currency} ${lease.monthlyRent.toLocaleString()}` : 'N/A',
        formattedDeposit: lease.securityDeposit ? `${lease.currency} ${lease.securityDeposit.toLocaleString()}` : 'N/A',
        daysRemaining: calculateDaysRemaining(lease.leaseEndDate, lease.status),
        statusClass: getStatusClass(lease.status),
        statusDisplay: getStatusDisplay(lease.status),
        tenantName: lease.tenant ? 
            `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim() : 
            'Unknown Tenant',
        propertyName: lease.property?.name || 'Unknown Property',
        unitName: lease.unit?.unitName || 'Unknown Unit',
        hasDocuments: Array.isArray(lease.documents) && lease.documents.length > 0,
        hasAmendments: Array.isArray(lease.amendments) && lease.amendments.length > 0
    };
};

/**
 * Calculates days remaining in lease
 * @param {Date|string} leaseEndDate - Lease end date
 * @param {string} status - Lease status
 * @returns {number} Days remaining (0 if expired/terminated)
 */
const calculateDaysRemaining = (leaseEndDate, status) => {
    if (!leaseEndDate || status !== 'active') return 0;
    
    const today = new Date();
    const endDate = new Date(leaseEndDate);
    
    if (endDate <= today) return 0;
    
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Gets CSS class based on lease status
 * @param {string} status - Lease status
 * @returns {string} CSS class name
 */
const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'expired':
            return 'bg-gray-100 text-gray-800';
        case 'terminated':
            return 'bg-red-100 text-red-800';
        case 'pending_renewal':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Gets display text for lease status
 * @param {string} status - Lease status
 * @returns {string} Display text
 */
const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
        case 'active':
            return 'Active';
        case 'expired':
            return 'Expired';
        case 'terminated':
            return 'Terminated';
        case 'pending_renewal':
            return 'Pending Renewal';
        default:
            return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
};

export default {
    createLease,
    getLeases,
    getLeaseById,
    updateLease,
    deleteLease,
    getExpiringLeases,
    markRenewalNoticeSent,
    uploadLeaseDocument,
    getLeaseDocumentDownloadInfo,
    downloadLeaseDocument,
    generateLeaseDocument,
    addLeaseAmendment,
    getLeaseRentReport,
    generateRentReportDocument,
    formatLease
};