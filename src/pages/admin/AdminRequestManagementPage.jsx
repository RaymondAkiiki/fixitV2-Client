// frontend/src/pages/admin/AdminRequestManagementPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { MAINTENANCE_CATEGORIES, PRIORITY_LEVELS, REQUEST_STATUSES, ROUTES } from '../../utils/constants.js';
import { formatDate } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-teal-100 text-teal-800';
      case 'reopened':
        return 'bg-orange-100 text-orange-800';
      case 'archived':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${getStatusClass()}`}>
      {status?.replace(/_/g, ' ') || 'Unknown'}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const getPriorityClass = () => {
    const priorityLower = priority?.toLowerCase();
    switch(priorityLower) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityClass()}`}>
      {priority || 'Unknown'}
    </span>
  );
};

const AdminRequestManagementPage = () => {
  const { showError } = useGlobalAlert();
  
  // State for requests data
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    propertyId: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    assignedTo: '',
    reportedBy: ''
  });
  
  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controllers for API requests
  const requestsAbortController = useRef(null);
  const propertiesAbortController = useRef(null);
  const analyticsAbortController = useRef(null);

  // Fetch maintenance requests with filters and pagination
  const fetchRequests = useCallback(async () => {
    // Cancel any ongoing request
    if (requestsAbortController.current) {
      requestsAbortController.current.abort();
    }
    
    // Create new abort controller
    requestsAbortController.current = new AbortController();
    const signal = requestsAbortController.current.signal;
    
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
      
      // Call the API using updated adminService
      const response = await adminService.getAllRequests(params, signal);
      
      // Update state with response data
      setRequests(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load maintenance requests: ' + error.message);
        console.error('Error fetching maintenance requests:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, pagination.page, pagination.limit, showError]);

  // Fetch properties for filter dropdown
  const fetchProperties = useCallback(async () => {
    // Cancel any ongoing request
    if (propertiesAbortController.current) {
      propertiesAbortController.current.abort();
    }
    
    // Create new abort controller
    propertiesAbortController.current = new AbortController();
    const signal = propertiesAbortController.current.signal;
    
    setPropertiesLoading(true);
    
    try {
      const response = await adminService.getAllProperties({ limit: 100 }, signal);
      setProperties(response.data || []);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        console.error('Error fetching properties for filter:', error);
        // Not showing error to user as this is a secondary feature
      }
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  // Fetch request analytics
  const fetchAnalytics = useCallback(async () => {
    // Cancel any ongoing request
    if (analyticsAbortController.current) {
      analyticsAbortController.current.abort();
    }
    
    // Create new abort controller
    analyticsAbortController.current = new AbortController();
    const signal = analyticsAbortController.current.signal;
    
    setAnalyticsLoading(true);
    
    try {
      const response = await adminService.getRequestAnalytics(signal);
      setAnalytics(response.data || null);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        console.error('Error fetching request analytics:', error);
        // Not showing error to user as this is a secondary feature
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchProperties();
    fetchAnalytics();
    
    return () => {
      // Clean up all requests on unmount
      if (propertiesAbortController.current) {
        propertiesAbortController.current.abort();
      }
      if (analyticsAbortController.current) {
        analyticsAbortController.current.abort();
      }
    };
  }, [fetchProperties, fetchAnalytics]);

  // Fetch requests when filters or pagination changes
  useEffect(() => {
    fetchRequests();
    
    return () => {
      if (requestsAbortController.current) {
        requestsAbortController.current.abort();
      }
    };
  }, [fetchRequests]);

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
      search: '',
      status: '',
      priority: '',
      propertyId: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      assignedTo: '',
      reportedBy: ''
    });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Format analytics data for display
  const getAnalyticsSummary = () => {
    if (!analytics) return {};
    
    return {
      totalRequests: analytics.totalRequests || 0,
      openRequests: analytics.statusCounts?.new + 
                   analytics.statusCounts?.assigned + 
                   analytics.statusCounts?.in_progress || 0,
      completedRequests: analytics.statusCounts?.completed || 0,
      urgentRequests: analytics.priorityCounts?.urgent || 0,
      avgResolutionTime: analytics.averageResolutionTimeHours 
        ? `${Math.round(analytics.averageResolutionTimeHours)} hours`
        : 'N/A'
    };
  };

  const analyticsSummary = getAnalyticsSummary();

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377]">
          Maintenance Request Management
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          View, filter, and manage all maintenance requests across properties.
        </p>
      </div>

      {/* Analytics Summary Cards */}
      {!analyticsLoading && analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
            <p className="text-2xl font-bold text-gray-800">{analyticsSummary.totalRequests}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Open Requests</h3>
            <p className="text-2xl font-bold text-blue-600">{analyticsSummary.openRequests}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Completed</h3>
            <p className="text-2xl font-bold text-green-600">{analyticsSummary.completedRequests}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Urgent Requests</h3>
            <p className="text-2xl font-bold text-red-600">{analyticsSummary.urgentRequests}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Avg. Resolution Time</h3>
            <p className="text-2xl font-bold text-gray-800">{analyticsSummary.avgResolutionTime}</p>
          </div>
        </div>
      )}
      
      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#219377]">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title or description"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              <option value="">All Statuses</option>
              {Object.values(REQUEST_STATUSES).map(status => (
                <option key={status} value={status}>{status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          
          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              <option value="">All Priorities</option>
              {Object.values(PRIORITY_LEVELS).map(priority => (
                <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
              ))}
            </select>
          </div>
          
          {/* Property */}
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select
              id="propertyId"
              name="propertyId"
              value={filters.propertyId}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              disabled={propertiesLoading}
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property._id} value={property._id}>{property.name}</option>
              ))}
            </select>
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              <option value="">All Categories</option>
              {MAINTENANCE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
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
            onClick={fetchRequests}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading maintenance requests...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length > 0 ? (
                requests.map(request => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.property?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.unit?.unitName || request.unit?.unitIdentifier || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={request.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.reportedBy ? 
                        (request.reportedBy.firstName && request.reportedBy.lastName ? 
                          `${request.reportedBy.firstName} ${request.reportedBy.lastName}` : 
                          request.reportedBy.email) : 
                        'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        to={`${ROUTES.ADMIN_REQUESTS}/${request._id}`} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                      <span className="mx-2 text-gray-300">|</span>
                      <Link 
                        to={`${ROUTES.ADMIN_REQUESTS}/edit/${request._id}`} 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading requests...' : 
                      'No maintenance requests found matching your filters.'}
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
              Showing <span className="font-medium">{requests.length}</span> of <span className="font-medium">{pagination.total}</span> requests
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

export default AdminRequestManagementPage;