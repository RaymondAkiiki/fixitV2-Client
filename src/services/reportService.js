import api from "../api/axios.js";

/**
 * Fetches a comprehensive maintenance summary report with all details and supports filters & pagination.
 * @param {object} params - Query params: propertyId, status, category, assignedToId, assignedToModel, startDate, endDate, format, page, limit
 * @returns {Promise<object>} { data: [...], pagination: {...} }
 */
export const generateMaintenanceSummaryReport = async (params = {}) => {
    try {
        const res = await api.get('/reports/maintenance-summary', { params });
        return res.data; // { data: [...], pagination: {...} }
    } catch (error) {
        console.error("generateMaintenanceSummaryReport error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetches a page of detailed requests (service requests) with filtering and pagination.
 * @param {object} params - Query params: propertyId, status, category, assignedToId, assignedToModel, startDate, endDate, page, limit
 * @returns {Promise<object>} { requests: [...], total: number, currentPage: number, itemsPerPage: number }
 */
export const getFilteredRequests = async (params = {}) => {
    try {
        const res = await api.get('/requests', { params });
        // Adjust this shape if your backend differs
        return res.data;
    } catch (error) {
        console.error("getFilteredRequests error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetches a page of detailed scheduled maintenance tasks with filtering and pagination.
 * @param {object} params - Query params: propertyId, status, category, assignedToId, assignedToModel, startDate, endDate, page, limit
 * @returns {Promise<object>} { tasks: [...], total: number, currentPage: number, itemsPerPage: number }
 */
export const getFilteredScheduledMaintenance = async (params = {}) => {
    try {
        const res = await api.get('/scheduled-maintenance', { params });
        // Adjust this shape if your backend differs
        return res.data;
    } catch (error) {
        console.error("getFilteredScheduledMaintenance error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Generates a report on vendor performance (average resolution times, ratings).
 * @param {object} params - Query params: propertyId, vendorId, startDate, endDate
 * @returns {Promise<object[]>} Array of vendor performance data.
 */
export const getVendorPerformanceReport = async (params = {}) => {
    try {
        const res = await api.get('/reports/vendor-performance', { params });
        return res.data;
    } catch (error) {
        console.error("getVendorPerformanceReport error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Generates a report on most frequent issue categories.
 * @param {object} params - Query params: propertyId, startDate, endDate
 * @returns {Promise<object[]>} Array of { category, count, averageResolutionTimeHours }
 */
export const getCommonIssuesReport = async (params = {}) => {
    try {
        const res = await api.get('/reports/common-issues', { params });
        return res.data;
    } catch (error) {
        console.error("getCommonIssuesReport error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Downloads the maintenance summary report as a CSV file.
 * @param {object} params - Same as generateMaintenanceSummaryReport, but will force format='csv'
 * @returns {Promise<void>} Automatically triggers download in the browser.
 */
export const downloadMaintenanceSummaryCSV = async (params = {}) => {
    try {
        const p = { ...params, format: 'csv' };
        const res = await api.get('/reports/maintenance-summary', {
            params: p,
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'maintenance_report.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    } catch (error) {
        console.error("downloadMaintenanceSummaryCSV error:", error.response?.data || error.message);
        throw error;
    }
};