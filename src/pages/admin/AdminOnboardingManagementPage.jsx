// frontend/src/pages/admin/AdminOnboardingManagementPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import * as onboardingService from "../../services/onboardingService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { ROUTES } from '../../utils/constants.js';
import { formatDate } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';
import { FileText, Download, Trash2, Edit, CheckCircle } from 'lucide-react';

const AdminOnboardingManagementPage = () => {
  const { showError, showSuccess } = useGlobalAlert();
  
  // State for onboarding documents data
  const [documents, setDocuments] = useState([]);
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
    category: '',
    propertyId: '',
    visibility: '',
    isCompleted: '',
  });
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controllers for API requests
  const documentsAbortController = useRef(null);
  const propertiesAbortController = useRef(null);

  // Fetch onboarding documents with filters and pagination
  const fetchDocuments = useCallback(async () => {
    // Cancel any ongoing request
    if (documentsAbortController.current) {
      documentsAbortController.current.abort();
    }
    
    // Create new abort controller
    documentsAbortController.current = new AbortController();
    const signal = documentsAbortController.current.signal;
    
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
      
      // For demonstration, we'll use the onboardingService directly
      // In a real app, you might want to add adminService methods specifically for this
      const response = await onboardingService.getOnboarding(params, signal);
      
      // Update state with response data
      setDocuments(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1
      });
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load onboarding documents: ' + error.message);
        console.error('Error fetching onboarding documents:', error);
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
      }
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  // Handle document download
  const handleDownloadDocument = useCallback(async (documentId) => {
    setActionLoading(true);
    try {
      // Get download info
      const downloadInfo = await onboardingService.getOnboardingDocumentDownloadInfo(documentId);
      
      // Download the document
      await onboardingService.downloadOnboardingDocument(
        downloadInfo.downloadUrl, 
        downloadInfo.fileName
      );
      
      showSuccess('Document download started');
    } catch (error) {
      showError(`Failed to download document: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [showError, showSuccess]);

  // Handle document deletion
  const handleDeleteDocument = useCallback(async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await onboardingService.deleteOnboarding(documentId);
      showSuccess('Document deleted successfully');
      // Refresh the list after deletion
      fetchDocuments();
    } catch (error) {
      showError(`Failed to delete document: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [fetchDocuments, showError, showSuccess]);

  // Mark document as completed
  const handleMarkCompleted = useCallback(async (documentId) => {
    setActionLoading(true);
    try {
      await onboardingService.markOnboardingCompleted(documentId);
      showSuccess('Document marked as completed');
      // Refresh the list
      fetchDocuments();
    } catch (error) {
      showError(`Failed to mark document as completed: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [fetchDocuments, showError, showSuccess]);

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

  // Fetch documents when filters or pagination changes
  useEffect(() => {
    fetchDocuments();
    
    return () => {
      if (documentsAbortController.current) {
        documentsAbortController.current.abort();
      }
    };
  }, [fetchDocuments]);

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
      category: '',
      propertyId: '',
      visibility: '',
      isCompleted: '',
    });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Document category options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'sop', label: 'Standard Operating Procedure' },
    { value: 'training', label: 'Training Material' },
    { value: 'guidelines', label: 'Guidelines' },
    { value: 'policy', label: 'Policy Document' },
    { value: 'welcome', label: 'Welcome Package' },
  ];

  // Visibility options
  const visibilityOptions = [
    { value: '', label: 'All Visibility Settings' },
    { value: 'all_tenants', label: 'All Tenants' },
    { value: 'property_tenants', label: 'Property Tenants' },
    { value: 'unit_tenants', label: 'Unit Tenants' },
    { value: 'specific_tenant', label: 'Specific Tenant' },
  ];

  // Completion status options
  const completionOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'true', label: 'Completed' },
    { value: 'false', label: 'Pending' },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377]">
          Onboarding & Documentation Management
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Manage onboarding documents, training materials, and property guidelines.
        </p>
      </div>

      {/* Action Button */}
      <div className="mb-6 flex justify-end">
        <Link 
          to={ROUTES.ADMIN_ONBOARDING_CREATE || ROUTES.ADMIN_ONBOARDING + '/create'} 
          className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
        >
          Upload New Document
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
              {categoryOptions.map(option => (
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
          
          {/* Visibility */}
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select
              id="visibility"
              name="visibility"
              value={filters.visibility}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              {visibilityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Completion Status */}
          <div>
            <label htmlFor="isCompleted" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="isCompleted"
              name="isCompleted"
              value={filters.isCompleted}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              {completionOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
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
            onClick={fetchDocuments}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading onboarding documents...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length > 0 ? (
                documents.map(doc => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-500" />
                        {doc.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.categoryDisplay || doc.category || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.propertyName || 'All Properties'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.visibilityDisplay || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${doc.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {doc.isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleDownloadDocument(doc._id)}
                          disabled={actionLoading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                        
                        <Link 
                          to={ROUTES.ADMIN_ONBOARDING_EDIT ? `${ROUTES.ADMIN_ONBOARDING_EDIT.replace(':onboardingId', doc._id)}` : `${ROUTES.ADMIN_ONBOARDING}/edit/${doc._id}`} 
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="Edit Document"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                        
                        {!doc.isCompleted && (
                          <button 
                            onClick={() => handleMarkCompleted(doc._id)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 flex items-center"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Complete
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleDeleteDocument(doc._id)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading onboarding documents...' : 
                      'No onboarding documents found matching your filters.'}
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
              Showing <span className="font-medium">{documents.length}</span> of <span className="font-medium">{pagination.total}</span> documents
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

export default AdminOnboardingManagementPage;