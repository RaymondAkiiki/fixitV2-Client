// frontend/src/pages/admin/AdminScheduledMaintenanceManagementPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { MAINTENANCE_CATEGORIES, SCHEDULED_MAINTENANCE_STATUS_ENUM, ROUTES } from '../../utils/constants.js';
import { formatDate } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
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

// Frequency Badge Component
const FrequencyBadge = ({ frequency }) => {
  const getFrequencyClass = () => {
    const frequencyLower = frequency?.toLowerCase();
    switch(frequencyLower) {
      case 'daily':
        return 'bg-purple-100 text-purple-800';
      case 'weekly':
        return 'bg-blue-100 text-blue-800';
      case 'monthly':
        return 'bg-indigo-100 text-indigo-800';
      case 'quarterly':
        return 'bg-teal-100 text-teal-800';
      case 'bi_annually':
      case 'bi-annually':
        return 'bg-emerald-100 text-emerald-800';
      case 'annually':
        return 'bg-green-100 text-green-800';
      case 'one_time':
      case 'one-time':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${getFrequencyClass()}`}>
      {frequency?.replace(/_/g, ' ') || 'One Time'}
    </span>
  );
};

const AdminScheduledMaintenanceManagementPage = () => {
  const { showError, showSuccess } = useGlobalAlert();
  
  // State for scheduled maintenance data
  const [scheduledMaintenances, setScheduledMaintenances] = useState([]);
  const [properties, setProperties] = useState([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    propertyId: '',
    category: '',
    frequency: '',
    dateFrom: '',
    dateTo: '',
    assignedTo: '',
  });
  
  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controllers for API requests
  const maintenanceAbortController = useRef(null);
  const propertiesAbortController = useRef(null);

  // Fetch scheduled maintenance tasks with filters and pagination
  const fetchScheduledMaintenances = useCallback(async () => {
    // Cancel any ongoing request
    if (maintenanceAbortController.current) {
      maintenanceAbortController.current.abort();
    }
    
    // Create new abort controller
    maintenanceAbortController.current = new AbortController();
    const signal = maintenanceAbortController.current.signal;
    
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
      const response = await adminService.getAllScheduledMaintenances(params, signal);
      
      // Update state with response data
      setScheduledMaintenances(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load scheduled maintenance tasks: ' + error.message);
        console.error('Error fetching scheduled maintenance:', error);
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

  // Handle task actions (pause/resume)
  const handleTaskAction = useCallback(async (taskId, action) => {
    setActionLoading(true);
    try {
      if (action === 'pause') {
        await adminService.pauseScheduledMaintenance(taskId);
        showSuccess('Maintenance task paused successfully');
      } else if (action === 'resume') {
        await adminService.resumeScheduledMaintenance(taskId);
        showSuccess('Maintenance task resumed successfully');
      }
      // Refresh the list after action
      fetchScheduledMaintenances();
    } catch (error) {
      showError(`Failed to ${action} task: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [fetchScheduledMaintenances, showError, showSuccess]);

  // Initial data loading
  useEffect(() => {
    fetchProperties();
    
    return () => {
      // Clean up request on unmount
      if (propertiesAbortController.current) {
        propertiesAbortController.current.abort();
      }
    };
  }, [fetchProperties]);

  // Fetch scheduled maintenance when filters or pagination changes
  useEffect(() => {
    fetchScheduledMaintenances();
    
    return () => {
      if (maintenanceAbortController.current) {
        maintenanceAbortController.current.abort();
      }
    };
  }, [fetchScheduledMaintenances]);

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
      propertyId: '',
      category: '',
      frequency: '',
      dateFrom: '',
      dateTo: '',
      assignedTo: '',
    });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Define frequency options
  const frequencyOptions = [
    { value: '', label: 'All Frequencies' },
    { value: 'one_time', label: 'One Time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'bi_annually', label: 'Bi-Annually' },
    { value: 'annually', label: 'Annually' },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377]">
          Scheduled Maintenance Management
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Manage recurring and one-time scheduled maintenance tasks across properties.
        </p>
      </div>

      {/* Action Button */}
      <div className="mb-6 flex justify-end">
        <Link 
          to={ROUTES.ADMIN_SCHEDULED_MAINTENANCE_CREATE || ROUTES.ADMIN_SCHEDULED_MAINTENANCE + '/create'} 
          className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
        >
          Create New Scheduled Maintenance
        </Link>
      </div>
      
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
              {Object.values(SCHEDULED_MAINTENANCE_STATUS_ENUM).map(status => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
              <option value="paused">Paused</option>
            </select>
          </div>
          
          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select
              id="frequency"
              name="frequency"
              value={filters.frequency}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
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
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">Scheduled From</label>
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
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">Scheduled To</label>
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
            onClick={fetchScheduledMaintenances}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Scheduled Maintenance Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading scheduled maintenance tasks...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledMaintenances.length > 0 ? (
                scheduledMaintenances.map(task => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.property?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <FrequencyBadge frequency={task.frequency || 'one_time'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(task.nextScheduledDate || task.scheduledDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.assignedTo ? 
                        (task.assignedTo.firstName && task.assignedTo.lastName ? 
                          `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
                          task.assignedTo.email) : 
                        'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Link 
                          to={`${ROUTES.ADMIN_SCHEDULED_MAINTENANCE}/${task._id}`} 
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        <Link 
                          to={`${ROUTES.ADMIN_SCHEDULED_MAINTENANCE}/edit/${task._id}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        {task.status === 'active' && (
                          <button 
                            onClick={() => handleTaskAction(task._id, 'pause')}
                            disabled={actionLoading}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                          >
                            Pause
                          </button>
                        )}
                        {task.status === 'paused' && (
                          <button 
                            onClick={() => handleTaskAction(task._id, 'resume')}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Resume
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading scheduled maintenance tasks...' : 
                      'No scheduled maintenance tasks found matching your filters.'}
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
              Showing <span className="font-medium">{scheduledMaintenances.length}</span> of <span className="font-medium">{pagination.total}</span> tasks
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

export default AdminScheduledMaintenanceManagementPage;