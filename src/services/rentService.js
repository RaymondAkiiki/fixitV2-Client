// client/src/services/rentService.js

import api from "../api/axios.js";
import axios from "axios";

const RENT_BASE_URL = '/rents';

/**
 * Creates a new rent record.
 * @param {object} rentData
 * @returns {Promise<object>}
 */
export const createRentRecord = async (rentData) => {
    try {
        const res = await api.post(RENT_BASE_URL, rentData);
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Retrieves a list of rent entries, with optional filtering.
 * @param {object} [params={}]
 * @param {AbortSignal} [signal]
 * @returns {Promise<object[]>}
 */
export const getRentEntries = async (params = {}, signal) => {
    try {
        const res = await api.get(RENT_BASE_URL, { params, signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Retrieves a single rent record by ID.
 * @param {string} rentId
 * @param {AbortSignal} [signal]
 * @returns {Promise<object>}
 */
export const getRentRecordById = async (rentId, signal) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/${rentId}`, { signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Updates a rent record.
 * @param {string} rentId
 * @param {object} updates
 * @returns {Promise<object>}
 */
export const updateRentRecord = async (rentId, updates) => {
    try {
        const res = await api.put(`${RENT_BASE_URL}/${rentId}`, updates);
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Records a rent payment for an existing rent record.
 * @param {string} rentId
 * @param {object} paymentData
 * @param {File} [paymentProofFile]
 * @returns {Promise<object>}
 */
export const recordPaymentForRentRecord = async (rentId, paymentData, paymentProofFile) => {
    try {
        const formData = new FormData();
        Object.keys(paymentData).forEach(key => {
            if (paymentData[key] !== undefined && paymentData[key] !== null) {
                formData.append(key, paymentData[key]);
            }
        });
        if (paymentProofFile) {
            formData.append('documentFile', paymentProofFile);
        }

        const res = await api.post(`${RENT_BASE_URL}/${rentId}/pay`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Deletes a rent record.
 * @param {string} rentId
 * @returns {Promise<object>}
 */
export const deleteRentRecord = async (rentId) => {
    try {
        const res = await api.delete(`${RENT_BASE_URL}/${rentId}`);
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Retrieves upcoming rent due dates.
 * @param {object} [params={}]
 * @param {AbortSignal} [signal]
 * @returns {Promise<object[]>}
 */
export const getUpcomingRent = async (params = {}, signal) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/upcoming`, { params, signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Retrieves rent history for a lease, tenant, or property.
 * @param {object} [params={}]
 * @param {AbortSignal} [signal]
 * @returns {Promise<object[]>}
 */
export const getRentHistory = async (params = {}, signal) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/history`, { params, signal });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Uploads payment proof for a rent record.
 * @param {string} rentId
 * @param {File} paymentProofFile
 * @returns {Promise<object>}
 */
export const uploadPaymentProof = async (rentId, paymentProofFile) => {
    try {
        const formData = new FormData();
        formData.append('documentFile', paymentProofFile);
        const res = await api.post(`${RENT_BASE_URL}/${rentId}/upload-proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};

/**
 * Downloads payment proof for a rent record.
 * @param {string} rentId
 * @returns {Promise<Blob>}
 */
export const downloadPaymentProof = async (rentId) => {
    try {
        const res = await api.get(`${RENT_BASE_URL}/${rentId}/download-proof`, {
            responseType: 'blob',
        });
        return res.data;
    } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) throw new Error("Request Aborted");
        throw error;
    }
};