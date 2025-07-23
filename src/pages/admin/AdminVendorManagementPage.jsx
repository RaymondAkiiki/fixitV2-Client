import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { ROUTES } from '../../utils/constants.js';
import { formatDate } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';
import { Edit, Trash2, ExternalLink, UserX, Star } from 'lucide-react';

const AdminVendorManagementPage = () => {
  const { showError, showSuccess } = useGlobalAlert();
  
  // State for vendors data
  const [vendors, setVendors] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    service: '',
    isActive: '',
  });
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controller for API requests
  const abortController = useRef(null);

  // Fetch vendors with filtering and pagination
  const fetchVendors = useCallback(async () => {
    // Cancel any ongoing request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Create new abort controller
    abortController.current = new AbortController();
    const signal = abortController.current.signal;
    
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
      
      // Call the API using adminService.getAllVendors
      const response = await adminService.getAllVendors(params, signal);
      
      // Update state with response data
      setVendors(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load vendors: ' + error.message);
        console.error('Error fetching vendors:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, pagination.page, pagination.limit, showError]);

  // Fetch service types for filter dropdown
  const fetchServiceTypes = useCallback(() => {
    // In a real app, you might fetch these from an API
    // For now, hardcoding common service types
    const types = [
      'plumbing',
      'electrical',
      'hvac',
      'landscaping',
      'cleaning',
      'pest_control',
      'general_maintenance',
      'carpentry',
      'painting',
      'roofing',
      'flooring',
      'security'
    ];
    setServiceTypes(types);
  }, []);

  // Handle vendor deactivation
  const handleDeactivateVendor = useCallback(async (vendorId) => {
    if (!window.confirm('Are you sure you want to deactivate this vendor? They will no longer be available for maintenance requests.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await adminService.deactivateVendor(vendorId);
      showSuccess('Vendor deactivated successfully');
      // Refresh the list
      fetchVendors();
    } catch (error) {
      showError(`Failed to deactivate vendor: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [fetchVendors, showError, showSuccess]);

  // Initial data loading
  useEffect(() => {
    fetchServiceTypes();
    
    return () => {
      // Clean up request on unmount
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchServiceTypes]);

  // Fetch vendors when filters or pagination changes
  useEffect(() => {
    fetchVendors();
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchVendors]);

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
      service: '',
      isActive: '',
    });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377]">
          Vendor Management
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Manage service providers, contractors, and maintenance professionals.
        </p>
      </div>

      {/* Action Button */}
      <div className="mb-6 flex justify-end">
        <Link 
          to={ROUTES.ADMIN_VENDORS_CREATE || ROUTES.ADMIN_VENDORS + '/create'} 
          className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
        >
          Add New Vendor
        </Link>
      </div>
      
      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#219377]">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, email, or phone"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Service Type */}
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select
              id="service"
              name="service"
              value={filters.service}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              <option value="">All Services</option>
              {serviceTypes.map(service => (
                <option key={service} value={service}>
                  {service.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          {/* Active Status */}
          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="isActive"
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
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
            onClick={fetchVendors}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading vendors...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.length > 0 ? (
                vendors.map(vendor => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vendor.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.services && vendor.services.length > 0 ? 
                        vendor.services.map(s => s.replace(/_/g, ' ')).join(', ') : 
                        'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{vendor.email || 'N/A'}</div>
                      <div>{vendor.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        {vendor.averageRating ? vendor.averageRating.toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.createdAt ? formatDate(vendor.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Link 
                          to={ROUTES.ADMIN_VENDOR_DETAILS ? `${ROUTES.ADMIN_VENDOR_DETAILS.replace(':vendorId', vendor._id)}` : `${ROUTES.ADMIN_VENDORS}/${vendor._id}`} 
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Link>
                        
                        <Link 
                          to={ROUTES.ADMIN_VENDOR_EDIT ? `${ROUTES.ADMIN_VENDOR_EDIT.replace(':vendorId', vendor._id)}` : `${ROUTES.ADMIN_VENDORS}/edit/${vendor._id}`} 
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Edit Vendor"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                        
                        {vendor.isActive && (
                          <button 
                            onClick={() => handleDeactivateVendor(vendor._id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center"
                            title="Deactivate Vendor"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading vendors...' : 
                      'No vendors found matching your filters.'}
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
              Showing <span className="font-medium">{vendors.length}</span> of <span className="font-medium">{pagination.total}</span> vendors
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

export default AdminVendorManagementPage;