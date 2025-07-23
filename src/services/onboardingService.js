// client/src/services/onboardingService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'onboardingService';
const ONBOARDING_BASE_URL = '/onboarding';

/**
 * Formats an onboarding document with additional display properties
 * @param {object} document - The onboarding document to format
 * @returns {object} Formatted onboarding document
 */
export const formatOnboardingDocument = (document) => {
    if (!document) return null;
    
    return {
        ...document,
        formattedCreatedAt: document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'N/A',
        formattedCompletedAt: document.completedAt ? new Date(document.completedAt).toLocaleDateString() : 'N/A',
        statusClass: document.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
        statusDisplay: document.isCompleted ? 'Completed' : 'Pending',
        creatorName: document.createdBy ? 
            `${document.createdBy.firstName || ''} ${document.createdBy.lastName || ''}`.trim() : 
            'Unknown',
        propertyName: document.property?.name || 'All Properties',
        unitName: document.unit?.unitName || 'All Units',
        tenantName: document.tenant ? 
            `${document.tenant.firstName || ''} ${document.tenant.lastName || ''}`.trim() : 
            'All Tenants',
        visibilityDisplay: getVisibilityDisplay(document.visibility),
        categoryDisplay: getCategoryDisplay(document.category),
        mediaUrl: document.media?.url || null,
        fileName: document.media?.originalname || document.media?.filename || 'Document'
    };
};

/**
 * Gets display text for visibility setting
 * @param {string} visibility - Visibility setting
 * @returns {string} Display text
 */
const getVisibilityDisplay = (visibility) => {
    switch (visibility?.toLowerCase()) {
        case 'all_tenants':
            return 'All Tenants';
        case 'property_tenants':
            return 'Property Tenants';
        case 'unit_tenants':
            return 'Unit Tenants';
        case 'specific_tenant':
            return 'Specific Tenant';
        default:
            return visibility ? visibility.charAt(0).toUpperCase() + visibility.slice(1).replace(/_/g, ' ') : 'Unknown';
    }
};

/**
 * Gets display text for document category
 * @param {string} category - Document category
 * @returns {string} Display text
 */
const getCategoryDisplay = (category) => {
    switch (category?.toLowerCase()) {
        case 'sop':
            return 'Standard Operating Procedure';
        case 'training':
            return 'Training Material';
        case 'guidelines':
            return 'Guidelines';
        case 'policy':
            return 'Policy Document';
        case 'welcome':
            return 'Welcome Package';
        default:
            return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown';
    }
};

/**
 * Creates a new onboarding document
 * @param {object} documentData - Document data
 * @param {string} documentData.title - Title
 * @param {string} [documentData.description] - Description
 * @param {string} documentData.category - Category
 * @param {string} documentData.visibility - Visibility setting
 * @param {string} [documentData.propertyId] - Property ID
 * @param {string} [documentData.unitId] - Unit ID
 * @param {string} [documentData.tenantId] - Tenant ID
 * @param {File} documentData.documentFile - Document file
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Created onboarding document
 * @throws {Error} If request fails
 */
export const createOnboarding = async (documentData, signal) => {
    try {
        const formData = new FormData();
        
        // Add all fields to form data
        for (const key in documentData) {
            if (key === 'documentFile') {
                if (documentData[key] instanceof File) {
                    formData.append('documentFile', documentData[key]);
                }
            } else if (Array.isArray(documentData[key])) {
                documentData[key].forEach(item => {
                    if (item !== undefined && item !== null) {
                        formData.append(`${key}[]`, item);
                    }
                });
            } else if (documentData[key] !== undefined && documentData[key] !== null) {
                formData.append(key, documentData[key]);
            }
        }
        
        // Ensure file is included
        if (!formData.has('documentFile')) {
            throw new Error('Document file is required');
        }
        
        const res = await api.post(ONBOARDING_BASE_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            signal
        });
        
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createOnboarding', { 
            success: meta.success, 
            data: formatOnboardingDocument(data)
        });
        
        return {
            success: meta.success,
            message: meta.message,
            data: formatOnboardingDocument(data)
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        
        console.error("Error creating onboarding document:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets onboarding documents with filtering and pagination
 * @param {object} [params={}] - Query parameters
 * @param {string} [params.category] - Filter by category
 * @param {string} [params.propertyId] - Filter by property
 * @param {string} [params.unitId] - Filter by unit
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Paginated onboarding documents with formatted data
 * @throws {Error} If request fails
 */
export const getOnboarding = async (params = {}, signal) => {
    try {
        const res = await api.get(ONBOARDING_BASE_URL, { 
            params,
            signal
        });
        
        const { data, meta } = extractApiResponse(res.data);
        
        // Format documents if available
        const formattedDocuments = Array.isArray(data) 
            ? data.map(doc => formatOnboardingDocument(doc)) 
            : [];
        
        logApiResponse(SERVICE_NAME, 'getOnboarding', { 
            documents: formattedDocuments, 
            page: meta.page,
            limit: meta.limit,
            total: meta.total
        });
        
        return {
            data: formattedDocuments,
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.pages || Math.ceil((meta.total || 0) / (meta.limit || 10))
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        
        console.error("Error fetching onboarding documents:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets a specific onboarding document by ID
 * @param {string} documentId - Onboarding document ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Onboarding document details
 * @throws {Error} If request fails
 */
export const getOnboardingById = async (documentId, signal) => {
    try {
        const res = await api.get(`${ONBOARDING_BASE_URL}/${documentId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format document
        const formattedDocument = formatOnboardingDocument(data);
        
        logApiResponse(SERVICE_NAME, 'getOnboardingById', { document: formattedDocument });
        
        return formattedDocument;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        
        console.error("Error fetching onboarding document:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates an onboarding document
 * @param {string} documentId - Onboarding document ID
 * @param {object} updateData - Update data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated onboarding document
 * @throws {Error} If request fails
 */
export const updateOnboarding = async (documentId, updateData, signal) => {
    try {
        // For regular updates without file
        if (!updateData.documentFile) {
            const res = await api.put(`${ONBOARDING_BASE_URL}/${documentId}`, updateData, { signal });
            const { data, meta } = extractApiResponse(res.data);
            
            const formattedDocument = formatOnboardingDocument(data);
            
            logApiResponse(SERVICE_NAME, 'updateOnboarding', { 
                success: meta.success, 
                document: formattedDocument 
            });
            
            return {
                success: meta.success,
                message: meta.message,
                data: formattedDocument
            };
        }
        
        // For updates with file upload
        const formData = new FormData();
        
        // Add all fields to form data
        for (const key in updateData) {
            if (key === 'documentFile') {
                if (updateData[key] instanceof File) {
                    formData.append('documentFile', updateData[key]);
                }
            } else if (Array.isArray(updateData[key])) {
                updateData[key].forEach(item => {
                    if (item !== undefined && item !== null) {
                        formData.append(`${key}[]`, item);
                    }
                });
            } else if (updateData[key] !== undefined && updateData[key] !== null) {
                formData.append(key, updateData[key]);
            }
        }
        
        const res = await api.put(`${ONBOARDING_BASE_URL}/${documentId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            signal
        });
        
        const { data, meta } = extractApiResponse(res.data);
        const formattedDocument = formatOnboardingDocument(data);
        
        logApiResponse(SERVICE_NAME, 'updateOnboarding', { 
            success: meta.success, 
            document: formattedDocument 
        });
        
        return {
            success: meta.success,
            message: meta.message,
            data: formattedDocument
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        
        console.error("Error updating onboarding document:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes an onboarding document
 * @param {string} documentId - Onboarding document ID
 * @returns {Promise<object>} Success message
 * @throws {Error} If request fails
 */
export const deleteOnboarding = async (documentId) => {
    try {
        const res = await api.delete(`${ONBOARDING_BASE_URL}/${documentId}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteOnboarding', { 
            success: response.meta.success, 
            message: response.meta.message 
        });
        
        return {
            success: response.meta.success,
            message: response.meta.message
        };
    } catch (error) {
        console.error("Error deleting onboarding document:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Marks an onboarding document as completed
 * @param {string} documentId - Onboarding document ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated onboarding document
 * @throws {Error} If request fails
 */
export const markOnboardingCompleted = async (documentId, signal) => {
    try {
        const res = await api.patch(`${ONBOARDING_BASE_URL}/${documentId}/complete`, {}, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Format document
        const formattedDocument = formatOnboardingDocument(data);
        
        logApiResponse(SERVICE_NAME, 'markOnboardingCompleted', { 
            success: meta.success, 
            document: formattedDocument 
        });
        
        return {
            success: meta.success,
            message: meta.message,
            data: formattedDocument
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        
        console.error("Error marking onboarding document as completed:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets download info for an onboarding document
 * @param {string} documentId - Onboarding document ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Download info
 * @throws {Error} If request fails
 */
export const getOnboardingDocumentDownloadInfo = async (documentId, signal) => {
    try {
        const res = await api.get(`${ONBOARDING_BASE_URL}/${documentId}/download`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getOnboardingDocumentDownloadInfo', { 
            downloadUrl: data.downloadUrl,
            fileName: data.fileName
        });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request was canceled', error.message);
            throw new Error("Request canceled");
        }
        
        console.error("Error getting document download info:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Downloads an onboarding document
 * @param {string} downloadUrl - Download URL
 * @param {string} fileName - File name
 * @returns {Promise<void>} Initiates file download
 * @throws {Error} If download fails
 */
export const downloadOnboardingDocument = async (downloadUrl, fileName) => {
    try {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = fileName || 'onboarding-document';
        link.rel = 'noopener noreferrer';
        
        // Trigger click to start download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
        
        logApiResponse(SERVICE_NAME, 'downloadOnboardingDocument', { success: true, fileName });
        
        return { success: true };
    } catch (error) {
        console.error("Error downloading document:", error);
        throw new Error(`Failed to download document: ${error.message}`);
    }
};

export default {
    formatOnboardingDocument,
    createOnboarding,
    getOnboarding,
    getOnboardingById,
    updateOnboarding,
    deleteOnboarding,
    markOnboardingCompleted,
    getOnboardingDocumentDownloadInfo,
    downloadOnboardingDocument
};