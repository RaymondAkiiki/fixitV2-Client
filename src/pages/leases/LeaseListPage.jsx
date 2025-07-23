import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLeases, useExpiringLeases, useLeaseMutations } from '../../hooks/useLeases';
import { useProperties } from '../../hooks/useProperties';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import Spinner from '../../components/common/Spinner';
import { USER_ROLES } from '../../utils/constants';
import { 
  FaPlus, FaFilter, FaSearch, FaTimes, FaEye, 
  FaEdit, FaTrash, FaFileAlt, FaExclamationTriangle 
} from 'react-icons/fa';

const LeaseListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  // Parse query params for initial filter state
  const queryParams = new URLSearchParams(location.search);
  
  // Filter state
  const [filters, setFilters] = useState({
    propertyId: queryParams.get('propertyId') || '',
    unitId: queryParams.get('unitId') || '',
    tenantId: queryParams.get('tenantId') || '',
    status: queryParams.get('status') || '',
    search: queryParams.get('search') || '',
  });
  
  // UI state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  // Determine user permissions
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isPropertyManager = user?.role === USER_ROLES.PROPERTY_MANAGER;
  const isLandlord = user?.role === USER_ROLES.LANDLORD;
  const isTenant = user?.role === USER_ROLES.TENANT;
  
  // Fetch properties for filters
  const { properties } = useProperties();
  
  // Fetch lease data using the hook
 const { 
  data,
  isLoading,
  isError,
  refetch
} = useLeases({ filters });

// Then define leases and pagination from data
const leases = data?.leases || [];
const pagination = data?.pagination;
  
  // Fetch expiring leases
  const { 
    data: expiringLeases = [], 
    isLoading: isLoadingExpiring 
  } = useExpiringLeases({
    daysAhead: 90,
    propertyId: filters.propertyId
  });
  
  // Mutation hook for delete operation
  const { deleteLease, isDeleting } = useLeaseMutations();
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [filters, navigate, location.pathname]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      propertyId: '',
      unitId: '',
      tenantId: '',
      status: '',
      search: '',
    });
  };
  
  // Handle lease deletion
  const handleDelete = async (leaseId) => {
    if (!window.confirm('Are you sure you want to delete this lease? This action cannot be undone.')) {
      return;
    }
    
    setProcessingId(leaseId);
    try {
      await deleteLease(leaseId);
      showSuccess('Lease deleted successfully');
      refetch();
    } catch (error) {
      showError('Failed to delete lease');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Active filters for display
  const activeFilters = Object.entries({
    'Property': filters.propertyId ? properties?.find(p => p._id === filters.propertyId)?.name : null,
    'Status': filters.status ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace('_', ' ') : null,
    'Search': filters.search || null,
  }).filter(([_, value]) => value !== null);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Lease Agreements</h1>
        
        {!isTenant && (
          <Link 
            to="/leases/new" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaPlus className="mr-2" />
            Create New Lease
          </Link>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FaFilter className="text-gray-500 mr-2" />
            <h2 className="text-lg font-medium">Filters</h2>
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {!isTenant && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="propertyId">
                  Property
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  className="w-full p-2 border rounded-md"
                  value={filters.propertyId}
                  onChange={handleFilterChange}
                >
                  <option value="">All Properties</option>
                  {properties?.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                Lease Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full p-2 border rounded-md"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="pending_renewal">Pending Renewal</option>
              </select>
            </div>
            
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
                  placeholder="Search by tenant or property..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
        )}
        
        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center">
            <span className="text-sm text-gray-600 mr-2">Active filters:</span>
            {activeFilters.map(([key, value]) => (
              <span 
                key={key} 
                className="text-xs bg-blue-100 text-blue-800 rounded-full px-3 py-1 mr-2 mb-1 flex items-center"
              >
                {key}: {value}
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1 flex items-center"
            >
              <FaTimes className="mr-1" />
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Expiring Leases Section */}
      {!isTenant && expiringLeases.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center mb-3">
            <FaExclamationTriangle className="text-yellow-500 mr-2" />
            <h2 className="text-lg font-medium text-yellow-700">Expiring Leases</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-yellow-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Property / Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Days Left</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-yellow-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-200">
                {expiringLeases.map(lease => (
                  <tr key={lease._id} className="hover:bg-yellow-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lease.tenantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lease.propertyName} - {lease.unitName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lease.formattedEndDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {lease.daysRemaining} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/leases/${lease._id}`} className="text-yellow-600 hover:text-yellow-900 mr-3">
                        View
                      </Link>
                      <Link to={`/leases/${lease._id}/edit`} className="text-yellow-600 hover:text-yellow-900">
                        Renew
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Leases List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
          <span className="ml-2">Loading leases...</span>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          An error occurred while loading leases. Please try again.
        </div>
      ) : leases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaFileAlt className="mx-auto text-gray-400 text-4xl mb-4" />
          <p className="text-lg text-gray-600 mb-4">
            {activeFilters.length > 0 
              ? 'No leases match your filters.' 
              : 'No leases found.'}
          </p>
          {activeFilters.length > 0 ? (
            <button 
              onClick={clearFilters}
              className="text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          ) : !isTenant ? (
            <Link to="/leases/new" className="inline-block text-blue-600 hover:underline">
              Create your first lease
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property / Unit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rent
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
                {leases.map((lease) => (
                  <tr key={lease._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lease.tenantName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {lease.propertyName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lease.unitName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {lease.formattedStartDate} to {lease.formattedEndDate}
                      </div>
                      {lease.daysRemaining > 0 && lease.status === 'active' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {lease.daysRemaining} days remaining
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lease.formattedRent} / month
                      </div>
                      {lease.formattedDeposit !== 'N/A' && (
                        <div className="text-sm text-gray-500">
                          Deposit: {lease.formattedDeposit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lease.statusClass}`}>
                        {lease.statusDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/leases/${lease._id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <FaEye />
                        </Link>
                        
                        {!isTenant && (
                          <>
                            <Link
                              to={`/leases/${lease._id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit lease"
                            >
                              <FaEdit />
                            </Link>
                            
                            <button
                              onClick={() => handleDelete(lease._id)}
                              disabled={processingId === lease._id || isDeleting}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete lease"
                            >
                              {processingId === lease._id ? <Spinner size="sm" /> : <FaTrash />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leases
              </div>
              <nav className="flex space-x-2">
                <button
                  onClick={() => navigate(`/leases?page=1&${queryParams.toString()}`)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-md ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                >
                  First
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === pagination.pages || 
                    Math.abs(page - pagination.page) <= 1
                  )
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => navigate(`/leases?page=${page}&${queryParams.toString()}`)}
                      className={`px-3 py-1 rounded-md ${page === pagination.page ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                    >
                      {page}
                    </button>
                  ))}
                <button
                  onClick={() => navigate(`/leases?page=${pagination.pages}&${queryParams.toString()}`)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded-md ${pagination.page === pagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                >
                  Last
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaseListPage;