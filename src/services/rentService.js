// client/src/services/rentService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'rentService';
const RENT_BASE_URL = '/rents';
const RENT_SCHEDULE_BASE_URL = '/rent-schedules';

/**
 * Formats a rent record with additional display properties
 * @param {object} rent - The rent record to format
 * @returns {object} Formatted rent record
 */
export const formatRent = (rent) => {
    if (!rent) return null;
    
    return {
        ...rent,
        formattedDueDate: rent.dueDate ? new Date(rent.dueDate).toLocaleDateString() : 'N/A',
        formattedPaymentDate: rent.paymentDate ? new Date(rent.paymentDate).toLocaleDateString() : 'N/A',
        formattedAmount: rent.amountDue ? `${rent.currency || 'UGX'} ${rent.amountDue.toLocaleString()}` : 'N/A',
        formattedAmountPaid: rent.amountPaid ? `${rent.currency || 'UGX'} ${rent.amountPaid.toLocaleString()}` : `${rent.currency || 'UGX'} 0`,
        balance: Math.max(0, (rent.amountDue || 0) - (rent.amountPaid || 0)),
        formattedBalance: `${rent.currency || 'UGX'} ${Math.max(0, (rent.amountDue || 0) - (rent.amountPaid || 0)).toLocaleString()}`,
        isOverdue: rent.status === 'due' && new Date() > new Date(rent.dueDate),
        isPaid: rent.status === 'paid',
        isPartiallyPaid: rent.status === 'partially_paid',
        statusClass: getStatusClass(rent.status),
        statusDisplay: getStatusDisplay(rent.status),
        tenantName: rent.tenant ? 
            `${rent.tenant.firstName || ''} ${rent.tenant.lastName || ''}`.trim() : 
            'Unknown Tenant',
        propertyName: rent.property?.name || 'Unknown Property',
        unitName: rent.unit?.unitName || 'Unknown Unit',
        hasPaymentProof: !!rent.paymentProof
    };
};

/**
 * Gets CSS class based on payment status
 * @param {string} status - Payment status
 * @returns {string} CSS class name
 */
const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'due':
            return 'bg-yellow-100 text-yellow-800';
        case 'overdue':
            return 'bg-red-100 text-red-800';
        case 'partially_paid':
            return 'bg-blue-100 text-blue-800';
        case 'waived':
            return 'bg-purple-100 text-purple-800';
        case 'refunded':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Gets display text for payment status
 * @param {string} status - Payment status
 * @returns {string} Display text
 */
const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
        case 'paid':
            return 'Paid';
        case 'due':
            return 'Due';
        case 'overdue':
            return 'Overdue';
        case 'partially_paid':
            return 'Partially Paid';
        case 'waived':
            return 'Waived';
        case 'refunded':
            return 'Refunded';
        default:
            return status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : 'Unknown';
    }
};

/**
 * Creates a new rent record
 * @param {object} rentData - Rent data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Created rent record
 * @throws {Error} If request fails
 */
export const createRentRecord = async (rentData, signal) => {
    try {
        const res = await api.post(RENT_BASE_URL, rentData, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createRentRecord', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error creating rent record:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets rent records with filtering and pagination
 * @param {object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Paginated rent records
 * @throws {Error} If request fails
 */
export const getRentEntries = async (params = {}, signal) => {
    try {
        const res = await api.get(RENT_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        // Format rent records
        const formattedData = Array.isArray(data) ? data.map(rent => formatRent(rent)) : [];
        
        logApiResponse(SERVICE_NAME, 'getRentEntries', { data: formattedData, meta });
        
        return {
            data: formattedData,
            total: meta.total || 0,
            page: meta.page || 1,
            limit: meta.limit || 10,
            pages: meta.pages || 1
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error fetching rent records:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets a specific rent record by ID
 * @param {string} rentId - Rent record ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Rent record details
 * @throws {Error} If request fails
 */
export const getRentRecordById = async (rentId, signal) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/${rentId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        // Format the rent record
        const formattedRent = formatRent(data);
        
        logApiResponse(SERVICE_NAME, 'getRentRecordById', { data: formattedRent });
        
        return {
            data: formattedRent
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error fetching rent record:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a rent record
 * @param {string} rentId - Rent record ID
 * @param {object} updateData - Update data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated rent record
 * @throws {Error} If request fails
 */
export const updateRentRecord = async (rentId, updateData, signal) => {
    try {
        const res = await api.put(`${RENT_BASE_URL}/${rentId}`, updateData, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateRentRecord', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error updating rent record:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Records a payment for a rent record
 * @param {string} rentId - Rent record ID
 * @param {object} paymentData - Payment data
 * @param {File} [paymentProofFile] - Optional payment proof file
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated rent record
 * @throws {Error} If request fails
 */
export const recordPaymentForRentRecord = async (rentId, paymentData, paymentProofFile, signal) => {
    try {
        const formData = new FormData();
        
        // Add payment data to form
        Object.keys(paymentData).forEach(key => {
            if (paymentData[key] !== undefined && paymentData[key] !== null) {
                formData.append(key, paymentData[key]);
            }
        });
        
        // Add file if provided
        if (paymentProofFile) {
            formData.append('documentFile', paymentProofFile);
        }

        const res = await api.post(`${RENT_BASE_URL}/${rentId}/pay`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal
        });
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'recordPaymentForRentRecord', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error recording payment:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a rent record
 * @param {string} rentId - Rent record ID
 * @returns {Promise<object>} Success message
 * @throws {Error} If request fails
 */
export const deleteRentRecord = async (rentId) => {
    try {
        const res = await api.delete(`${RENT_BASE_URL}/${rentId}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteRentRecord', response);
        
        return response;
    } catch (error) {
        console.error("Error deleting rent record:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets upcoming rent due dates
 * @param {object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Upcoming rent records
 * @throws {Error} If request fails
 */
export const getUpcomingRent = async (params = {}, signal) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/upcoming`, { params, signal });
        const { data } = extractApiResponse(res.data);
        
        // Format rent records
        const formattedData = Array.isArray(data) ? data.map(rent => formatRent(rent)) : [];
        
        logApiResponse(SERVICE_NAME, 'getUpcomingRent', { data: formattedData });
        
        return {
            data: formattedData,
            count: formattedData.length
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error fetching upcoming rent:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets rent history with filtering
 * @param {object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Rent history records
 * @throws {Error} If request fails
 */
export const getRentHistory = async (params = {}, signal) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/history`, { params, signal });
        const { data } = extractApiResponse(res.data);
        
        // Format rent records
        const formattedData = Array.isArray(data) ? data.map(rent => formatRent(rent)) : [];
        
        logApiResponse(SERVICE_NAME, 'getRentHistory', { data: formattedData });
        
        return {
            data: formattedData,
            count: formattedData.length
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error fetching rent history:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Uploads payment proof for a rent record
 * @param {string} rentId - Rent record ID
 * @param {File} paymentProofFile - Payment proof file
 * @param {object} [metadata={}] - Additional metadata
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated rent record
 * @throws {Error} If request fails
 */
export const uploadPaymentProof = async (rentId, paymentProofFile, metadata = {}, signal) => {
    try {
        const formData = new FormData();
        formData.append('documentFile', paymentProofFile);
        
        // Add metadata if provided
        Object.keys(metadata).forEach(key => {
            if (metadata[key] !== undefined && metadata[key] !== null) {
                formData.append(key, metadata[key]);
            }
        });
        
        const res = await api.post(`${RENT_BASE_URL}/${rentId}/upload-proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal
        });
        
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'uploadPaymentProof', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error uploading payment proof:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets download info for a payment proof
 * @param {string} rentId - Rent record ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Download info
 * @throws {Error} If request fails
 */
export const getPaymentProofDownloadInfo = async (rentId, signal) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/${rentId}/download-proof`, { signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getPaymentProofDownloadInfo', { data, meta });
        
        return {
            downloadUrl: data?.downloadUrl || meta?.downloadUrl,
            fileName: data?.fileName || meta?.fileName,
            mimeType: data?.mimeType || meta?.mimeType
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error getting payment proof download info:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Downloads payment proof
 * @param {string} downloadUrl - Download URL
 * @param {string} fileName - File name
 * @returns {Promise<void>} Initiates file download
 * @throws {Error} If download fails
 */
export const downloadPaymentProof = async (downloadUrl, fileName) => {
    try {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = fileName || 'payment-proof';
        link.rel = 'noopener noreferrer';
        
        // Trigger click to start download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    } catch (error) {
        console.error("Error downloading payment proof:", error);
        throw new Error(`Failed to download payment proof: ${error.message}`);
    }
};

/**
 * Creates a rent schedule
 * @param {object} scheduleData - Schedule data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Created rent schedule
 * @throws {Error} If request fails
 */
export const createRentSchedule = async (scheduleData, signal) => {
    try {
        const res = await api.post(RENT_SCHEDULE_BASE_URL, scheduleData, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'createRentSchedule', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error creating rent schedule:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets rent schedules with filtering and pagination
 * @param {object} [params={}] - Query parameters
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Paginated rent schedules
 * @throws {Error} If request fails
 */
export const getRentSchedules = async (params = {}, signal) => {
    try {
        const res = await api.get(RENT_SCHEDULE_BASE_URL, { params, signal });
        const { data, meta } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getRentSchedules', { data, meta });
        
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
        console.error("Error fetching rent schedules:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Gets a specific rent schedule by ID
 * @param {string} scheduleId - Rent schedule ID
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Rent schedule details
 * @throws {Error} If request fails
 */
export const getRentScheduleById = async (scheduleId, signal) => {
    try {
        const res = await api.get(`${RENT_SCHEDULE_BASE_URL}/${scheduleId}`, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'getRentScheduleById', { data });
        
        return {
            data
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error fetching rent schedule:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Updates a rent schedule
 * @param {string} scheduleId - Rent schedule ID
 * @param {object} updateData - Update data
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Updated rent schedule
 * @throws {Error} If request fails
 */
export const updateRentSchedule = async (scheduleId, updateData, signal) => {
    try {
        const res = await api.put(`${RENT_SCHEDULE_BASE_URL}/${scheduleId}`, updateData, { signal });
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'updateRentSchedule', { data });
        
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Request was canceled");
        }
        console.error("Error updating rent schedule:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Deletes a rent schedule
 * @param {string} scheduleId - Rent schedule ID
 * @returns {Promise<object>} Success message
 * @throws {Error} If request fails
 */
export const deleteRentSchedule = async (scheduleId) => {
    try {
        const res = await api.delete(`${RENT_SCHEDULE_BASE_URL}/${scheduleId}`);
        const response = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'deleteRentSchedule', response);
        
        return response;
    } catch (error) {
        console.error("Error deleting rent schedule:", error);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Generates rent records based on schedules
 * @param {object} [options={}] - Generation options
 * @returns {Promise<object>} Generation results
 * @throws {Error} If generation fails
 */
export const generateRentRecords = async (options = {}) => {
    try {
        const res = await api.post(`${RENT_BASE_URL}/generate`, options);
        const { data } = extractApiResponse(res.data);
        
        logApiResponse(SERVICE_NAME, 'generateRentRecords', { data });
        
        return data;
    } catch (error) {
        console.error("Error generating rent records:", error);
        throw error.response?.data?.message || error.message;
    }
};

export default {
    formatRent,
    createRentRecord,
    getRentEntries,
    getRentRecordById,
    updateRentRecord,
    recordPaymentForRentRecord,
    deleteRentRecord,
    getUpcomingRent,
    getRentHistory,
    uploadPaymentProof,
    getPaymentProofDownloadInfo,
    downloadPaymentProof,
    createRentSchedule,
    getRentSchedules,
    getRentScheduleById,
    updateRentSchedule,
    deleteRentSchedule,
    generateRentRecords
};