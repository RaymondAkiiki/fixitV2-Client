// client/src/services/reportService.js

import api from "../api/axios.js";

const REPORT_BASE_URL = '/reports';

/**
 * Fetches a comprehensive maintenance summary report with all details and supports filters & pagination.
 * @param {object} params - Query params: propertyId, status, category, assignedToId, assignedToModel, startDate, endDate, format, page, limit
 * @returns {Promise<object>} { data: [...], pagination: {...} }
 */
export const getMaintenanceSummaryReport = async (params = {}) => { // Renamed from generateMaintenanceSummaryReport
    try {
        const res = await api.get(`${REPORT_BASE_URL}/maintenance-summary`, { params });
        return res.data; // { data: [...], pagination: {...} }
    } catch (error) {
        console.error("getMaintenanceSummaryReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Generates a report on vendor performance (average resolution times, ratings).
 * @param {object} params - Query params: propertyId, vendorId, startDate, endDate
 * @returns {Promise<object[]>} Array of vendor performance data.
 */
export const getVendorPerformanceReport = async (params = {}) => {
    try {
        const res = await api.get(`${REPORT_BASE_URL}/vendor-performance`, { params });
        return res.data;
    } catch (error) {
        console.error("getVendorPerformanceReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Generates a report on most frequent issue categories.
 * @param {object} params - Query params: propertyId, startDate, endDate
 * @returns {Promise<object[]>} Array of { category, count, averageResolutionTimeHours }
 */
export const getCommonIssuesReport = async (params = {}) => {
    try {
        const res = await api.get(`${REPORT_BASE_URL}/common-issues`, { params });
        return res.data;
    } catch (error) {
        console.error("getCommonIssuesReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a rent collection report.
 * @param {object} params - Query params: propertyId, unitId, status, tenantId, billingPeriod, startDate, endDate.
 * @returns {Promise<object[]>} Array of rent collection data.
 */
export const getRentCollectionReport = async (params = {}) => {
    try {
        const res = await api.get(`${REPORT_BASE_URL}/rent-collection`, { params });
        return res.data;
    } catch (error) {
        console.error("getRentCollectionReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Retrieves a lease expiry report.
 * @param {object} params - Query params: propertyId, unitId, status, tenantId, expiryStartDate, expiryEndDate.
 * @returns {Promise<object[]>} Array of lease expiry data.
 */
export const getLeaseExpiryReport = async (params = {}) => {
    try {
        const res = await api.get(`${REPORT_BASE_URL}/lease-expiry`, { params });
        return res.data;
    } catch (error) {
        console.error("getLeaseExpiryReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};

/**
 * Exports a report as a PDF or CSV.
 * @param {string} type - The type of report to export ('maintenance_summary', 'vendor_performance', 'common_issues', 'rent_collection', 'lease_expiry').
 * @param {string} format - The export format ('csv' or 'pdf').
 * @param {object} [params={}] - Additional query parameters for the report.
 * @returns {Promise<void>} Automatically triggers download in the browser.
 */
export const exportReport = async (type, format, params = {}) => {
    try {
        const p = { ...params, type, format };
        const res = await api.get(`${REPORT_BASE_URL}/export`, {
            params: p,
            responseType: 'blob',
        });
        const blobType = format === 'pdf' ? 'application/pdf' : 'text/csv';
        const fileName = `${type}_report.${format}`;

        const url = window.URL.createObjectURL(new Blob([res.data], { type: blobType }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    } catch (error) {
        console.error("exportReport error:", error.response?.data || error.message);
        throw error.response?.data?.message || error.message;
    }
};