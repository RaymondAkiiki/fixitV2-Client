// src/services/dashboardService.js

import api from '../api/axios.js';
import { extractApiResponse, logApiResponse } from "../utils/apiUtils.js";
import axios from 'axios';

const SERVICE_NAME = 'dashboardService';

// Simple in-memory cache with TTL
const cache = new Map();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Dashboard Service
 * Provides optimized methods for fetching dashboard data with caching and batching
 */
class DashboardService {
  /**
   * Fetch data with caching
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if cache miss
   * @param {number} [ttl=DEFAULT_CACHE_TTL] - Cache TTL in milliseconds
   * @returns {Promise<any>} - Cached or fresh data
   */
  async fetchWithCache(key, fetchFn, ttl = DEFAULT_CACHE_TTL) {
    const now = Date.now();
    
    // Check if we have a valid cached response
    if (cache.has(key)) {
      const { data, expiry } = cache.get(key);
      if (expiry > now) {
        logApiResponse(SERVICE_NAME, `cache-hit-${key.split('-')[0]}`, { fromCache: true });
        return data;
      }
      logApiResponse(SERVICE_NAME, `cache-expired-${key.split('-')[0]}`, { fromCache: false });
    }
    
    // Cache miss or expired, fetch fresh data
    const freshData = await fetchFn();
    
    // Cache the result
    cache.set(key, {
      data: freshData,
      expiry: now + ttl
    });
    
    return freshData;
  }
  
  /**
   * Clear all cache or specific keys
   * @param {string|string[]} [keys] - Specific keys to clear, or all if not provided
   */
  clearCache(keys) {
    if (!keys) {
      cache.clear();
      logApiResponse(SERVICE_NAME, 'clearCache', { allKeys: true });
      return;
    }
    
    const keysToClear = Array.isArray(keys) ? keys : [keys];
    keysToClear.forEach(key => cache.delete(key));
    logApiResponse(SERVICE_NAME, 'clearCache', { keys: keysToClear });
  }
  
  /**
   * Fetch Admin Dashboard data in a single API call
   * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
   * @returns {Promise<Object>} Complete dashboard data
   */
  async fetchAdminDashboardData(signal) {
    const cacheKey = 'admin-dashboard';
    
    try {
      return this.fetchWithCache(cacheKey, async () => {
        const response = await api.get('/api/admin/dashboard-data', { signal });
        const { data } = extractApiResponse(response.data);
        
        logApiResponse(SERVICE_NAME, 'fetchAdminDashboardData', { 
          stats: data?.stats ? Object.keys(data.stats) : null,
          hasUserRoleDistribution: !!data?.userRoleDistribution,
          pendingApprovalsCount: data?.pendingApprovals?.length || 0,
          recentActivityCount: data?.recentActivity?.length || 0
        });
        
        return data;
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request was canceled', error.message);
        throw new Error('Request canceled');
      }
      console.error("fetchAdminDashboardData error:", error);
      throw error.response?.data?.message || error.message;
    }
  }
  
  /**
   * Fetch Property Manager Dashboard data in a single API call
   * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
   * @returns {Promise<Object>} Complete dashboard data
   */
  async fetchPMDashboardData(signal) {
    const cacheKey = 'pm-dashboard';
    
    try {
      return this.fetchWithCache(cacheKey, async () => {
        const response = await api.get('/api/pm/dashboard-data', { signal });
        const { data } = extractApiResponse(response.data);
        
        logApiResponse(SERVICE_NAME, 'fetchPMDashboardData', { 
          stats: data?.stats ? Object.keys(data.stats) : null,
          recentRequestsCount: data?.recentRequests?.length || 0,
          recentLeasesCount: data?.recentLeases?.length || 0,
          recentRentsCount: data?.recentRents?.length || 0,
          upcomingMaintenanceCount: data?.upcomingMaintenanceTasks?.length || 0
        });
        
        return data;
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request was canceled', error.message);
        throw new Error('Request canceled');
      }
      console.error("fetchPMDashboardData error:", error);
      throw error.response?.data?.message || error.message;
    }
  }
  
  /**
   * Fetch Landlord Dashboard data in a single API call
   * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
   * @returns {Promise<Object>} Complete dashboard data
   */
  async fetchLandlordDashboardData(signal) {
    const cacheKey = 'landlord-dashboard';
    
    try {
      return this.fetchWithCache(cacheKey, async () => {
        const response = await api.get('/api/landlord/dashboard-data', { signal });
        const { data } = extractApiResponse(response.data);
        
        logApiResponse(SERVICE_NAME, 'fetchLandlordDashboardData', { 
          stats: data?.stats ? Object.keys(data.stats) : null,
          recentRequestsCount: data?.recentRequests?.length || 0,
          recentLeasesCount: data?.recentLeases?.length || 0,
          recentRentsCount: data?.recentRents?.length || 0,
          upcomingMaintenanceCount: data?.upcomingMaintenanceTasks?.length || 0
        });
        
        return data;
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request was canceled', error.message);
        throw new Error('Request canceled');
      }
      console.error("fetchLandlordDashboardData error:", error);
      throw error.response?.data?.message || error.message;
    }
  }
  
  /**
   * Fetch Tenant Dashboard data in a single API call
   * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
   * @returns {Promise<Object>} Complete dashboard data
   */
  async fetchTenantDashboardData(signal) {
    const cacheKey = 'tenant-dashboard';
    
    try {
      return this.fetchWithCache(cacheKey, async () => {
        const response = await api.get('/api/tenant/dashboard-data', { signal });
        const { data } = extractApiResponse(response.data);
        
        logApiResponse(SERVICE_NAME, 'fetchTenantDashboardData', { 
          hasProfile: !!data?.profile,
          recentRequestsCount: data?.recentRequests?.length || 0,
          propertiesCount: data?.myProperties?.length || 0,
          upcomingMaintenanceCount: data?.upcomingMaintenance?.length || 0,
          leasesCount: data?.leases?.length || 0,
          rentsCount: data?.rents?.length || 0
        });
        
        return data;
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request was canceled', error.message);
        throw new Error('Request canceled');
      }
      console.error("fetchTenantDashboardData error:", error);
      throw error.response?.data?.message || error.message;
    }
  }
  
  /**
   * Fetch detailed data for a specific section
   * Only called when needed (lazy loading)
   * @param {string} section - Section name (e.g., 'requests', 'leases')
   * @param {Object} [params] - Optional parameters for filtering
   * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
   * @returns {Promise<Object>} Section data
   */
  async fetchDashboardSection(section, params = {}, signal) {
    const queryParams = new URLSearchParams(params).toString();
    const cacheKey = `dashboard-section-${section}-${queryParams}`;
    
    try {
      return this.fetchWithCache(cacheKey, async () => {
        const response = await api.get(`/api/dashboard/${section}`, { 
          params,
          signal 
        });
        const { data } = extractApiResponse(response.data);
        
        logApiResponse(SERVICE_NAME, 'fetchDashboardSection', { 
          section,
          params: Object.keys(params),
          dataItemCount: Array.isArray(data) ? data.length : 'non-array'
        });
        
        return data;
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request was canceled', error.message);
        throw new Error('Request canceled');
      }
      console.error(`fetchDashboardSection (${section}) error:`, error);
      throw error.response?.data?.message || error.message;
    }
  }
  
  /**
   * Invalidate cache when data changes
   * Call this when you know certain data has been updated
   * @param {string[]} sections - Sections to invalidate (e.g., ['requests', 'leases'])
   */
  invalidateSections(sections = []) {
    // Clear specific dashboard caches
    this.clearCache(['admin-dashboard', 'pm-dashboard', 'landlord-dashboard', 'tenant-dashboard']);
    
    // Clear section caches
    sections.forEach(section => {
      const keysToDelete = [];
      
      // Find all keys in the cache that start with this section
      for (const key of cache.keys()) {
        if (key.startsWith(`dashboard-section-${section}`)) {
          keysToDelete.push(key);
        }
      }
      
      // Delete matched keys
      keysToDelete.forEach(key => cache.delete(key));
    });
    
    logApiResponse(SERVICE_NAME, 'invalidateSections', { sections });
  }
}

export default new DashboardService();