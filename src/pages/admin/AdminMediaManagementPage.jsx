// frontend/src/pages/admin/AdminMediaManagementPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as adminService from "../../services/adminService.js";
import * as mediaService from "../../services/mediaService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDate, formatBytes, isImage, isPdf, isVideo } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';
import { HardDrive, FileImage, Film, FileText, DownloadCloud, Trash2, ExternalLink } from 'lucide-react';

const AdminMediaManagementPage = () => {
  const { showError, showSuccess } = useGlobalAlert();
  
  // State for media files
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaStats, setMediaStats] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    userId: '',
    resourceType: '',
    resourceId: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controllers for API requests
  const mediaAbortController = useRef(null);
  const statsAbortController = useRef(null);

  // Fetch media files with filtering and pagination
  const fetchMediaFiles = useCallback(async () => {
    // Cancel any ongoing request
    if (mediaAbortController.current) {
      mediaAbortController.current.abort();
    }
    
    // Create new abort controller
    mediaAbortController.current = new AbortController();
    const signal = mediaAbortController.current.signal;
    
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
      const response = await adminService.getAllMedia(params, signal);
      
      // Update state with response data
      setMediaFiles(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load media files: ' + error.message);
        console.error('Error fetching media files:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, pagination.page, pagination.limit, showError]);

  // Fetch media storage statistics
  const fetchMediaStats = useCallback(async () => {
    // Cancel any ongoing request
    if (statsAbortController.current) {
      statsAbortController.current.abort();
    }
    
    // Create new abort controller
    statsAbortController.current = new AbortController();
    const signal = statsAbortController.current.signal;
    
    setStatsLoading(true);
    
    try {
      const stats = await adminService.getMediaStorageStats(signal);
      setMediaStats(stats.data || null);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        console.error('Error fetching media stats:', error);
      }
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Handle media deletion
  const handleDeleteMedia = useCallback(async (mediaId, filename) => {
    if (!window.confirm(`Are you sure you want to delete the media file "${filename}"? This action cannot be undone.`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      await adminService.deleteMedia(mediaId);
      showSuccess('Media file deleted successfully');
      // Refresh the list after deletion
      fetchMediaFiles();
      fetchMediaStats(); // Update storage stats after deletion
    } catch (error) {
      showError(`Failed to delete media: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [fetchMediaFiles, fetchMediaStats, showError, showSuccess]);

  // Initial data loading
  useEffect(() => {
    fetchMediaStats();
    
    return () => {
      // Clean up request on unmount
      if (statsAbortController.current) {
        statsAbortController.current.abort();
      }
    };
  }, [fetchMediaStats]);

  // Fetch media files when filters or pagination changes
  useEffect(() => {
    fetchMediaFiles();
    
    return () => {
      if (mediaAbortController.current) {
        mediaAbortController.current.abort();
      }
    };
  }, [fetchMediaFiles]);

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
      type: '',
      userId: '',
      resourceType: '',
      resourceId: '',
      dateFrom: '',
      dateTo: '',
    });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Media type options
  const mediaTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Documents' },
    { value: 'audio', label: 'Audio' },
    { value: 'other', label: 'Other' },
  ];

  // Resource type options
  const resourceTypeOptions = [
    { value: '', label: 'All Resources' },
    { value: 'property', label: 'Property' },
    { value: 'unit', label: 'Unit' },
    { value: 'request', label: 'Maintenance Request' },
    { value: 'user', label: 'User' },
    { value: 'lease', label: 'Lease' },
    { value: 'payment', label: 'Payment' },
  ];

  // Get file icon based on mimetype
  const getFileIcon = (mimetype) => {
    if (isImage(mimetype)) return <FileImage className="w-5 h-5 text-blue-500" />;
    if (isVideo(mimetype)) return <Film className="w-5 h-5 text-purple-500" />;
    if (isPdf(mimetype)) return <FileText className="w-5 h-5 text-red-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377]">
          Media Management
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Manage uploaded files, images, and documents across the system.
        </p>
      </div>

      {/* Storage Statistics */}
      {!statsLoading && mediaStats && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total Files</h3>
                <p className="text-3xl font-bold text-[#219377] mt-2">{mediaStats.totalCount || 0}</p>
              </div>
              <FileText className="w-12 h-12 text-[#219377] opacity-20" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total Storage</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{formatBytes(mediaStats.totalSize || 0)}</p>
              </div>
              <HardDrive className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Average File Size</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {mediaStats.totalCount > 0 
                    ? formatBytes(mediaStats.totalSize / mediaStats.totalCount) 
                    : '0 B'}
                </p>
              </div>
              <FileImage className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
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
              placeholder="Search by filename"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Media Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              {mediaTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Resource Type */}
          <div>
            <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              id="resourceType"
              name="resourceType"
              value={filters.resourceType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              {resourceTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Resource ID */}
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
          
          {/* User ID */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">Uploader ID</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="Enter uploader ID"
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
            onClick={fetchMediaFiles}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Media Files Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading media files...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploader</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mediaFiles.length > 0 ? (
                mediaFiles.map(media => (
                  <tr key={media._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isImage(media.mimetype) ? (
                        <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                          <img 
                            src={media.url} 
                            alt={media.originalname || media.filename} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center">
                          {getFileIcon(media.mimetype)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {media.originalname || media.filename || 'Unnamed File'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {media.mimetype || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatBytes(media.size || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(media.createdAt || media.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium">{media.resourceType || 'N/A'}</div>
                      {media.resourceId && <div className="text-xs text-gray-400">ID: {media.resourceId}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {media.user?.firstName && media.user?.lastName 
                        ? `${media.user.firstName} ${media.user.lastName}` 
                        : media.user?.email || media.uploader?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <a 
                          href={media.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="View File"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </a>
                        
                        <a 
                          href={media.url} 
                          download={media.originalname || media.filename} 
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Download File"
                        >
                          <DownloadCloud className="w-4 h-4 mr-1" />
                          Download
                        </a>
                        
                        <button 
                          onClick={() => handleDeleteMedia(media._id, media.originalname || media.filename)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center"
                          title="Delete File"
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
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading media files...' : 
                      'No media files found matching your filters.'}
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
              Showing <span className="font-medium">{mediaFiles.length}</span> of <span className="font-medium">{pagination.total}</span> files
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

export default AdminMediaManagementPage;