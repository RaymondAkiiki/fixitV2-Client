// client/src/services/reportService.js

import api from "../api/axios.js";
import axios from "axios";
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";

const SERVICE_NAME = 'reportService';
const REPORT_BASE_URL = '/reports';

/**
 * Get a maintenance summary report
 * @param {Object} [filters={}] - Query parameters for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The report data
 */
export const getMaintenanceSummaryReport = async (filters = {}, signal) => {
  try {
    const res = await api.get(`${REPORT_BASE_URL}/maintenance-summary`, { 
      params: filters,
      signal 
    });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getMaintenanceSummaryReport', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getMaintenanceSummaryReport error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get a vendor performance report
 * @param {Object} [filters={}] - Query parameters for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The report data
 */
export const getVendorPerformanceReport = async (filters = {}, signal) => {
  try {
    const res = await api.get(`${REPORT_BASE_URL}/vendor-performance`, { 
      params: filters,
      signal
    });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getVendorPerformanceReport', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getVendorPerformanceReport error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get a common issues report
 * @param {Object} [filters={}] - Query parameters for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The report data
 */
export const getCommonIssuesReport = async (filters = {}, signal) => {
  try {
    const res = await api.get(`${REPORT_BASE_URL}/common-issues`, { 
      params: filters,
      signal
    });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getCommonIssuesReport', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getCommonIssuesReport error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get a rent collection report
 * @param {Object} [filters={}] - Query parameters for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The report data
 */
export const getRentCollectionReport = async (filters = {}, signal) => {
  try {
    const res = await api.get(`${REPORT_BASE_URL}/rent-collection`, { 
      params: filters,
      signal
    });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getRentCollectionReport', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getRentCollectionReport error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Get a lease expiry report
 * @param {Object} [filters={}] - Query parameters for filtering
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The report data
 */
export const getLeaseExpiryReport = async (filters = {}, signal) => {
  try {
    const res = await api.get(`${REPORT_BASE_URL}/lease-expiry`, { 
      params: filters,
      signal
    });
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'getLeaseExpiryReport', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("getLeaseExpiryReport error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Generate a document from a report
 * @param {string} reportType - Type of report
 * @param {Object} [filters={}] - Filters for the report
 * @param {Object} [options={}] - Additional options
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<Object>} The generated document metadata
 */
export const generateReportDocument = async (reportType, filters = {}, options = {}, signal) => {
  try {
    const res = await api.post(`${REPORT_BASE_URL}/document`, {
      reportType,
      filters,
      options
    }, { signal });
    
    const { data } = extractApiResponse(res.data);
    
    logApiResponse(SERVICE_NAME, 'generateReportDocument', { data });
    
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request was canceled', error.message);
      throw new Error("Request canceled");
    }
    console.error("generateReportDocument error:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Export a report in a specific format
 * @param {string} reportType - Type of report
 * @param {string} format - Export format ('csv' or 'pdf')
 * @param {Object} [filters={}] - Filters for the report
 * @returns {Promise<Blob|Object>} For CSV: a Blob for download, for PDF: document metadata
 */
export const exportReport = async (reportType, format, filters = {}) => {
  try {
    // For PDF format, use the document generation endpoint
    if (format.toLowerCase() === 'pdf') {
      return await generateReportDocument(reportType, filters);
    }
    
    // For CSV format, use the export endpoint with responseType: 'blob'
    const params = new URLSearchParams({
      ...filters,
      type: reportType,
      format: 'csv'
    });
    
    const res = await api.get(`${REPORT_BASE_URL}/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    // Trigger download of the CSV file
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    // Try to get filename from content-disposition header
    const contentDisposition = res.headers['content-disposition'];
    const fileName = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `${reportType}_report.csv`;
      
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    logApiResponse(SERVICE_NAME, 'exportReport', { success: true, message: 'Report downloaded successfully' });
    
    return { success: true, message: 'Report downloaded successfully' };
  } catch (error) {
    console.error("exportReport error:", error);
    throw error.response?.data?.message || error.message;
  }
};

export default {
  getMaintenanceSummaryReport,
  getVendorPerformanceReport,
  getCommonIssuesReport,
  getRentCollectionReport,
  getLeaseExpiryReport,
  generateReportDocument,
  exportReport
};