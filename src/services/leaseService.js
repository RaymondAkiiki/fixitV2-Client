// client/src/services/leaseService.js

import api from "../api/axios.js";
import axios from "axios";

const LEASE_BASE_URL = '/leases';

/**
 * Creates a new lease agreement.
 * @param {object} leaseData - Data for the new lease.
 * @returns {Promise<object>} The created lease object.
 */
export const createLease = async (leaseData) => {
    try {
        const res = await api.post(LEASE_BASE_URL, leaseData);
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Retrieves a list of lease agreements.
 * @param {object} [params={}] - Optional query parameters for filtering.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object[]>} An array of lease objects.
 */
export const getLeases = async (params = {}, signal) => {
    try {
        const res = await api.get(LEASE_BASE_URL, { params, signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Retrieves details for a specific lease agreement.
 * @param {string} leaseId - The ID of the lease.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object>} The lease object.
 */
export const getLeaseById = async (leaseId, signal) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/${leaseId}`, { signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Updates details for a specific lease agreement.
 * @param {string} leaseId - The ID of the lease to update.
 * @param {object} updates - Data to update.
 * @returns {Promise<object>} The updated lease object.
 */
export const updateLease = async (leaseId, updates) => {
    try {
        const res = await api.put(`${LEASE_BASE_URL}/${leaseId}`, updates);
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Deletes a lease agreement.
 * @param {string} leaseId - The ID of the lease to delete.
 * @returns {Promise<object>} Success message.
 */
export const deleteLease = async (leaseId) => {
    try {
        const res = await api.delete(`${LEASE_BASE_URL}/${leaseId}`);
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Retrieves upcoming lease expiries.
 * @param {object} [params={}] - Query parameters.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<object[]>} An array of expiring lease objects.
 */
export const getExpiringLeases = async (params = {}, signal) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/expiring`, { params, signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Marks a lease as renewal notice sent.
 * @param {string} leaseId - The ID of the lease.
 * @returns {Promise<object>} Updated lease object.
 */
export const markRenewalNoticeSent = async (leaseId) => {
    try {
        const res = await api.put(`${LEASE_BASE_URL}/${leaseId}/mark-renewal-sent`);
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Uploads a lease document.
 * @param {string} leaseId - The ID of the lease.
 * @param {File} documentFile - The lease document file.
 * @returns {Promise<object>} Updated lease object with document info.
 */
export const uploadLeaseDocument = async (leaseId, documentFile) => {
    try {
        const formData = new FormData();
        formData.append('documentFile', documentFile);
        const res = await api.post(`${LEASE_BASE_URL}/${leaseId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Downloads a lease document.
 * @param {string} leaseId - The ID of the lease.
 * @param {string} documentId - The ID of the document to download.
 * @returns {Promise<Blob>} The document as a Blob.
 */
export const downloadLeaseDocument = async (leaseId, documentId) => {
    try {
        const res = await api.get(`${LEASE_BASE_URL}/${leaseId}/documents/${documentId}/download`, {
            responseType: 'blob',
        });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Generates a lease-related document.
 * @param {string} leaseId - The ID of the lease.
 * @param {string} documentType - The type of document to generate.
 * @returns {Promise<Blob>} The generated document as a Blob.
 */
export const generateLeaseDocument = async (leaseId, documentType) => {
    try {
        const res = await api.post(`${LEASE_BASE_URL}/${leaseId}/generate-document`, { documentType }, {
            responseType: 'blob',
        });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};
