// client/src/services/documentGenerationService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'documentGenerationService';
const DOCUMENT_BASE_URL = '/documents';

/**
 * Generates a document based on provided data and template.
 * @param {string} documentType - Type of document to generate (e.g., 'lease_notice', 'rent_report')
 * @param {object} data - Data to populate the document template
 * @param {object} [options={}] - Additional options for document generation
 * @param {string} [options.relatedResourceId] - ID of related resource (e.g., Lease ID)
 * @param {string} [options.relatedResourceType] - Type of related resource (e.g., 'Lease')
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The generated document metadata including URL
 */
export const generateDocument = async (documentType, data, options = {}, signal) => {
  try {
    const requestPayload = {
      documentType,
      data,
      options
    };
    
    const res = await api.post(`${DOCUMENT_BASE_URL}/generate`, requestPayload, { signal });
    const { data: responseData, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'generateDocument', { 
      documentType, 
      success: meta.success,
      options: Object.keys(options),
      hasData: !!responseData
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Document generated successfully',
      data: responseData
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    
    console.error("generateDocument error:", error);
    
    // Extract the error message from the response if available
    let errorMessage = error.response?.data?.message || error.message;
    
    // Handle blob responses that might contain error messages
    if (error.response?.data instanceof Blob) {
      errorMessage = await readBlobAsText(error.response.data);
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Utility to read a Blob as text (for error handling)
 * @param {Blob} blob - The blob to read
 * @returns {Promise<string>} The blob content as text
 */
const readBlobAsText = async (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('Unknown error occurred');
    reader.readAsText(blob);
  });
};

/**
 * Retrieves a list of available document templates.
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Object containing template data
 */
export const getDocumentTemplates = async (signal) => {
  try {
    const res = await api.get(`${DOCUMENT_BASE_URL}/templates`, { signal });
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getDocumentTemplates', { 
      templateCount: Array.isArray(data) ? data.length : 0,
      success: meta.success
    });
    
    return {
      success: meta.success,
      data
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    
    console.error("getDocumentTemplates error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Downloads a document directly (for documents that already exist).
 * @param {string} documentId - The ID of the document to download
 * @returns {Promise<void>} - Initiates a download
 */
export const downloadDocument = async (documentId) => {
  try {
    logApiResponse(SERVICE_NAME, 'downloadDocument', { documentId, start: true });
    
    const res = await api.get(`/media/${documentId}`, {
      responseType: 'blob'
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([res.data], { 
      type: res.headers['content-type'] || 'application/pdf' 
    });
    
    // Extract filename from content-disposition header or use default
    let fileName = `document-${documentId}.pdf`;
    const contentDisposition = res.headers['content-disposition'];
    if (contentDisposition && contentDisposition.includes('filename=')) {
      fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
    }
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    
    logApiResponse(SERVICE_NAME, 'downloadDocument', { 
      documentId, 
      success: true, 
      fileType: res.headers['content-type'],
      fileName
    });
    
    return {
      success: true,
      message: 'Document download initiated',
      fileName
    };
  } catch (error) {
    console.error("downloadDocument error:", error);
    logApiResponse(SERVICE_NAME, 'downloadDocument', { documentId, error: error.message });
    throw new Error(error.response?.data?.message || error.message);
  }
};

/**
 * Generates a preview of a document (returns as blob without saving).
 * @param {string} documentType - Type of document to preview
 * @param {object} data - Data to populate the document template
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Blob>} The document preview as a Blob
 */
export const previewDocument = async (documentType, data, signal) => {
  try {
    logApiResponse(SERVICE_NAME, 'previewDocument', { documentType, start: true });
    
    const res = await api.post(
      `${DOCUMENT_BASE_URL}/preview`,
      { documentType, data },
      { 
        responseType: 'blob',
        signal
      }
    );
    
    logApiResponse(SERVICE_NAME, 'previewDocument', { 
      documentType, 
      success: true, 
      contentType: res.headers['content-type'],
      size: res.data.size
    });
    
    return res.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    
    console.error("previewDocument error:", error);
    
    let errorMessage = error.message;
    if (error.response?.data instanceof Blob) {
      errorMessage = await readBlobAsText(error.response.data);
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    logApiResponse(SERVICE_NAME, 'previewDocument', { documentType, error: errorMessage });
    throw new Error(errorMessage);
  }
};

/**
 * Generate a document from a report
 * @param {string} reportType - Type of report to generate
 * @param {object} filters - Report filters
 * @param {object} [options={}] - Additional options
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} The generated document metadata
 */
export const generateReportDocument = async (reportType, filters, options = {}, signal) => {
  try {
    logApiResponse(SERVICE_NAME, 'generateReportDocument', { 
      reportType, 
      filters: Object.keys(filters),
      options: Object.keys(options),
      start: true
    });
    
    const res = await api.post(
      '/reports/document', 
      { 
        reportType,
        filters,
        options
      },
      { signal }
    );
    
    const { data, meta } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'generateReportDocument', { 
      reportType, 
      success: meta.success,
      hasData: !!data
    });
    
    return {
      success: meta.success,
      message: meta.message || 'Report document generated successfully',
      data
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error('Request canceled');
    }
    
    console.error("generateReportDocument error:", error);
    logApiResponse(SERVICE_NAME, 'generateReportDocument', { reportType, error: error.message });
    throw new Error(error.response?.data?.message || error.message);
  }
};

/**
 * Get document templates appropriate for a specific context
 * @param {string} context - The context to filter templates by (e.g., 'lease', 'rent')
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<object>} Filtered templates
 */
export const getContextTemplates = async (context, signal) => {
  try {
    logApiResponse(SERVICE_NAME, 'getContextTemplates', { context, start: true });
    
    const response = await getDocumentTemplates(signal);
    
    if (!response.success || !Array.isArray(response.data)) {
      throw new Error('Failed to retrieve document templates');
    }
    
    // Filter templates based on context
    const templates = response.data.filter(template => {
      switch (context) {
        case 'lease':
          return ['lease_notice', 'renewal_letter', 'exit_letter', 'termination_notice'].includes(template.type);
        case 'rent':
          return ['rent_report'].includes(template.type);
        case 'maintenance':
          return ['maintenance_report'].includes(template.type);
        default:
          return true;
      }
    });
    
    logApiResponse(SERVICE_NAME, 'getContextTemplates', { 
      context, 
      filteredCount: templates.length, 
      originalCount: response.data.length 
    });
    
    return {
      success: true,
      data: templates
    };
  } catch (error) {
    console.error("getContextTemplates error:", error);
    logApiResponse(SERVICE_NAME, 'getContextTemplates', { context, error: error.message });
    throw new Error(error.message);
  }
};

// Export as default object for easier imports
export default {
  generateDocument,
  getDocumentTemplates,
  downloadDocument,
  previewDocument,
  generateReportDocument,
  getContextTemplates
};