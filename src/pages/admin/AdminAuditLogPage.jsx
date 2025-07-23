// frontend/src/pages/admin/AdminAuditLogPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as adminService from "../../services/adminService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDateTime } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';
import { Clock, User, Activity, Database, Search, FileText } from 'lucide-react';

const AdminAuditLogPage = () => {
  const { showError } = useGlobalAlert();
  
  // State for audit logs
  const [logs, setLogs] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [entityTypes, setEntityTypes] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 1
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resourceType: '', // entity type in your old code
    resourceId: '', // entityId in your old code
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controllers for API requests
  const logsAbortController = useRef(null);
  const metadataAbortController = useRef(null);

  // Fetch audit logs with filtering and pagination
  const fetchAuditLogs = useCallback(async () => {
    // Cancel any ongoing request
    if (logsAbortController.current) {
      logsAbortController.current.abort();
    }
    
    // Create new abort controller
    logsAbortController.current = new AbortController();
    const signal = logsAbortController.current.signal;
    
    setLoading(true);
    
    try {
      // Prepare API parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        search: debouncedSearch
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0) {
          delete params[key];
        }
      });
      
      // Call the API using adminService
      const response = await adminService.getAuditLogs(params, signal);
      
      // Update state with response data
      setLogs(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 15,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load audit logs: ' + error.message);
        console.error('Error fetching audit logs:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, pagination.page, pagination.limit, showError]);

  // Fetch metadata for filters (action types, entity types, users)
  const fetchMetadata = useCallback(async () => {
    // Cancel any ongoing request
    if (metadataAbortController.current) {
      metadataAbortController.current.abort();
    }
    
    // Create new abort controller
    metadataAbortController.current = new AbortController();
    const signal = metadataAbortController.current.signal;
    
    setMetadataLoading(true);
    
    try {
      // Fetch users for filter dropdown
      const usersResponse = await adminService.getAllUsers({ limit: 100 }, signal);
      setUsers(usersResponse.data || []);
      
      // Extract action types and entity types from a sample of audit logs
      // In a real app, you might have dedicated endpoints for these
      const logsResponse = await adminService.getAuditLogs({ limit: 100 }, signal);
      
      if (logsResponse.data && logsResponse.data.length > 0) {
        // Extract unique action types
        const actions = [...new Set(logsResponse.data
          .filter(log => log.action)
          .map(log => log.action))];
        setActionTypes(actions.sort());
        
        // Extract unique entity types
        const entities = [...new Set(logsResponse.data
          .filter(log => log.resourceType)
          .map(log => log.resourceType))];
        setEntityTypes(entities.sort());
      }
    } catch (error) {
      if (error.message !== 'Request canceled') {
        console.error('Error fetching metadata for filters:', error);
      }
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchMetadata();
    
    return () => {
      // Clean up requests on unmount
      if (metadataAbortController.current) {
        metadataAbortController.current.abort();
      }
    };
  }, [fetchMetadata]);

  // Fetch logs when filters or pagination changes
  useEffect(() => {
    fetchAuditLogs();
    
    return () => {
      if (logsAbortController.current) {
        logsAbortController.current.abort();
      }
    };
  }, [fetchAuditLogs]);

  // Filter change handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resourceType: '',
      resourceId: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Format JSON details for display
  const formatDetails = (details) => {
    if (!details) return 'No details';
    
    try {
      // If it's already a string, parse it
      const detailsObj = typeof details === 'string' ? JSON.parse(details) : details;
      return JSON.stringify(detailsObj, null, 2);
    } catch {
      // If parsing fails, return as is
      return typeof details === 'string' ? details : JSON.stringify(details);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377]">
          System Audit Logs
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Track and review all system activities and user actions.
        </p>
      </div>
      
      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#219377]">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search in details..."
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              />
            </div>
          </div>
          
          {/* User */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              id="userId"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              disabled={metadataLoading}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email}
                </option>
              ))}
            </select>
          </div>
          
          {/* Action */}
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              id="action"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              disabled={metadataLoading}
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Entity Type */}
          <div>
            <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              id="resourceType"
              name="resourceType"
              value={filters.resourceType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              disabled={metadataLoading}
            >
              <option value="">All Resource Types</option>
              {entityTypes.map(entity => (
                <option key={entity} value={entity}>
                  {entity.charAt(0).toUpperCase() + entity.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Entity ID */}
          <div>
            <label htmlFor="resourceId" className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
            <input
              type="text"
              id="resourceId"
              name="resourceId"
              value={filters.resourceId}
              onChange={handleFilterChange}
              placeholder="Enter resource ID"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
        </div>
        
        {/* Filter Action Buttons */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleResetFilters}
            className="mr-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchAuditLogs}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading audit logs...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Timestamp
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    User
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Action
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Resource
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Details
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.user 
                        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email
                        : 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {log.action?.toLowerCase().replace(/_/g, ' ') || 'Unknown Action'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium">{log.resourceType || 'N/A'}</div>
                      {log.resourceId && <div className="text-xs text-gray-400">ID: {log.resourceId}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-xs font-mono bg-gray-50 p-2 rounded">
                          {formatDetails(log.details)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading audit logs...' : 
                      'No audit logs found matching your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{logs.length}</span> of <span className="font-medium">{pagination.total}</span> logs
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center">
                <span className="text-gray-700 mx-2">Page {pagination.page} of {pagination.pages}</span>
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogPage;