// client/src/services/documentGenerationService.js

import api from "../api/axios.js";

const DOCUMENT_BASE_URL = '/documents';

/**
 * Generates a document based on provided data and template.
 * @param {object} data - Data for document generation: { documentType, data, options }
 * @returns {Promise<Blob>} The generated document as a Blob (e.g., PDF, DOCX).
 */
export const generateDocument = async (data) => {
    try {
        const res = await api.post(`${DOCUMENT_BASE_URL}/generate`, data, {
            responseType: 'blob', // Important for file downloads
        });
        return res.data;
    } catch (error) {
        console.error("generateDocument error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a list of available document templates.
 * @returns {Promise<object[]>} An array of template objects.
 */
export const getDocumentTemplates = async () => {
    try {
        const res = await api.get(`${DOCUMENT_BASE_URL}/templates`);
        return res.data;
    } catch (error) {
        console.error("getDocumentTemplates error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};
