import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as onboardingService from '../../services/onboardingService';
import * as propertyService from '../../services/propertyService';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { USER_ROLES } from '../../utils/constants';
import Spinner from '../../components/common/Spinner';
import { FaPlus, FaDownload, FaCheck, FaFilter, FaSearch, FaTimes, FaEye } from 'react-icons/fa';

export default function OnboardingListPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useGlobalAlert();
  
  // State
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [processingDocumentId, setProcessingDocumentId] = useState(null);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isPropertyManager = user?.role === USER_ROLES.PROPERTY_MANAGER;
  const isLandlord = user?.role === USER_ROLES.LANDLORD;
  const isTenant = user?.role === USER_ROLES.TENANT;
  
  // Determine if the user can create new documents
  const canCreateDocuments = isAdmin || isPropertyManager || isLandlord;
  
  // Fetch onboarding documents
  const fetchDocuments = useCallback(async (pageNum = page, filters = {}) => {
    setLoading(true);
    
    try {
      const params = {
        page: pageNum,
        limit,
        ...filters
      };
      
      if (categoryFilter) params.category = categoryFilter;
      if (propertyFilter) params.propertyId = propertyFilter;
      if (statusFilter) params.isCompleted = statusFilter === 'completed';
      if (searchQuery) params.search = searchQuery;
      
      const response = await onboardingService.getOnboarding(params);
      
      setDocuments(response.data || []);
      setTotalPages(response.pages || 1);
      setTotalDocuments(response.total || 0);
    } catch (error) {
      console.error('Error fetching onboarding documents:', error);
      showError('Failed to load onboarding documents');
    } finally {
      setLoading(false);
    }
  }, [page, limit, categoryFilter, propertyFilter, statusFilter, searchQuery, showError]);
  
  // Fetch properties for filter
  const fetchProperties = useCallback(async () => {
    try {
      const response = await propertyService.getAllProperties();
      setProperties(response.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchDocuments();
    
    if (!isTenant) {
      fetchProperties();
    }
  }, [fetchDocuments, fetchProperties, isTenant]);
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    switch (name) {
      case 'category':
        setCategoryFilter(value);
        break;
      case 'property':
        setPropertyFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'search':
        setSearchQuery(value);
        break;
      default:
        break;
    }
    
    // Reset to first page when filter changes
    setPage(1);
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchDocuments(1);
  };
  
  // Reset filters
  const resetFilters = () => {
    setCategoryFilter('');
    setPropertyFilter('');
    setStatusFilter('');
    setSearchQuery('');
    setPage(1);
  };
  
  // Handle document download
  const handleDownload = async (documentId) => {
    try {
      setProcessingDocumentId(documentId);
      const downloadInfo = await onboardingService.getOnboardingDocumentDownloadInfo(documentId);
      await onboardingService.downloadOnboardingDocument(downloadInfo.downloadUrl, downloadInfo.fileName);
      showSuccess('Document download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document');
    } finally {
      setProcessingDocumentId(null);
    }
  };
  
  // Handle document completion
  const handleMarkAsCompleted = async (documentId) => {
    try {
      setProcessingDocumentId(documentId);
      await onboardingService.markOnboardingCompleted(documentId);
      showSuccess('Document marked as completed');
      
      // Update local state to reflect the change
      setDocuments(prev => 
        prev.map(doc => 
          doc._id === documentId 
            ? { 
                ...doc, 
                isCompleted: true, 
                statusDisplay: 'Completed',
                statusClass: 'bg-green-100 text-green-800',
                formattedCompletedAt: new Date().toLocaleDateString()
              } 
            : doc
        )
      );
    } catch (error) {
      console.error('Error marking document as completed:', error);
      showError('Failed to mark document as completed');
    } finally {
      setProcessingDocumentId(null);
    }
  };
  
  // Pagination handlers
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };
  
  // Apply active filters
  const activeFilters = Object.entries({
    Category: categoryFilter ? getCategoryDisplayName(categoryFilter) : null,
    Property: propertyFilter ? properties.find(p => p._id === propertyFilter)?.name : null,
    Status: statusFilter ? (statusFilter === 'completed' ? 'Completed' : 'Pending') : null,
    Search: searchQuery || null
  }).filter(([_, value]) => value !== null);
  
  const hasActiveFilters = activeFilters.length > 0;
  
  function getCategoryDisplayName(category) {
    switch (category) {
      case 'sop': return 'Standard Operating Procedure';
      case 'training': return 'Training Material';
      case 'guidelines': return 'Guidelines';
      case 'policy': return 'Policy Document';
      case 'welcome': return 'Welcome Package';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Onboarding Documents</h1>
        
        {canCreateDocuments && (
          <Link 
            to="/onboarding/create" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaPlus className="mr-2" />
            Add Document
          </Link>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center mb-2">
          <FaFilter className="text-gray-500 mr-2" />
          <h2 className="text-lg font-medium">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="search">
              Search
            </label>
            <div className="relative">
              <input
                id="search"
                name="search"
                type="text"
                className="w-full pl-10 pr-3 py-2 border rounded-md"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={handleFilterChange}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="w-full p-2 border rounded-md"
              value={categoryFilter}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              <option value="guidelines">Guidelines</option>
              <option value="policy">Policy Document</option>
              <option value="sop">Standard Operating Procedure</option>
              <option value="training">Training Material</option>
              <option value="welcome">Welcome Package</option>
            </select>
          </div>
          
          {!isTenant && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="property">
                Property
              </label>
              <select
                id="property"
                name="property"
                className="w-full p-2 border rounded-md"
                value={propertyFilter}
                onChange={handleFilterChange}
              >
                <option value="">All Properties</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="w-full p-2 border rounded-md"
              value={statusFilter}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={resetFilters}
            className="mr-2 px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={applyFilters}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
        
        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center">
            <span className="text-sm text-gray-600 mr-2">Active filters:</span>
            {activeFilters.map(([key, value]) => (
              <span 
                key={key} 
                className="text-xs bg-blue-100 text-blue-800 rounded-full px-3 py-1 mr-2 mb-1 flex items-center"
              >
                {key}: {value}
                <button
                  onClick={() => {
                    if (key === 'Category') setCategoryFilter('');
                    if (key === 'Property') setPropertyFilter('');
                    if (key === 'Status') setStatusFilter('');
                    if (key === 'Search') setSearchQuery('');
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Documents list */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
          <span className="ml-2">Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-lg text-gray-600">
            {hasActiveFilters ? 'No documents match your filters.' : 'No onboarding documents available.'}
          </p>
          {hasActiveFilters ? (
            <button 
              onClick={resetFilters}
              className="mt-4 text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          ) : canCreateDocuments ? (
            <Link to="/onboarding/create" className="mt-4 inline-block text-blue-600 hover:underline">
              Add your first document
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {document.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {document.description?.substring(0, 60) || 'No description'}
                              {document.description?.length > 60 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{document.categoryDisplay}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{document.formattedCreatedAt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${document.statusClass}`}>
                          {document.statusDisplay}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/onboarding/${document._id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View details"
                          >
                            <FaEye />
                          </Link>
                          
                          <button
                            onClick={() => handleDownload(document._id)}
                            disabled={processingDocumentId === document._id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download document"
                          >
                            {processingDocumentId === document._id ? <Spinner size="sm" /> : <FaDownload />}
                          </button>
                          
                          {isTenant && !document.isCompleted && (
                            <button
                              onClick={() => handleMarkAsCompleted(document._id)}
                              disabled={processingDocumentId === document._id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Mark as completed"
                            >
                              {processingDocumentId === document._id ? <Spinner size="sm" /> : <FaCheck />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, totalDocuments)}</span> of{' '}
                <span className="font-medium">{totalDocuments}</span> documents
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={goToPrevPage}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded-md ${
                    page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-300'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    page === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}