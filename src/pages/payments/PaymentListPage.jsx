import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useRents, useRentMutations, useRentUtils } from '../../hooks/useRents';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import * as propertyService from '../../services/propertyService';
import Spinner from '../../components/common/Spinner';
import { USER_ROLES } from '../../utils/constants';
import { 
  FaPlus, FaFilter, FaSearch, FaTimes, FaEye, 
  FaEdit, FaTrash, FaFileInvoiceDollar, FaDownload 
} from 'react-icons/fa';

export default function PaymentListPage() {
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
    startDate: queryParams.get('startDate') || '',
    endDate: queryParams.get('endDate') || '',
    search: queryParams.get('search') || '',
  });
  
  // Pagination state
  const [page, setPage] = useState(parseInt(queryParams.get('page') || '1', 10));
  const [limit, setLimit] = useState(parseInt(queryParams.get('limit') || '10', 10));
  
  // UI state
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  // Determine user permissions
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isPropertyManager = user?.role === USER_ROLES.PROPERTY_MANAGER;
  const isLandlord = user?.role === USER_ROLES.LANDLORD;
  const isTenant = user?.role === USER_ROLES.TENANT;
  
  // If tenant, pre-filter by tenantId
  useEffect(() => {
    if (isTenant && user?._id) {
      setFilters(prev => ({ ...prev, tenantId: user._id }));
    }
  }, [isTenant, user]);
  
  // Fetch rent records using the hook
  const { 
    data,
    isLoading,
    isError,
    refetch,
  } = useRents({
    filters,
    page,
    limit
  });

  // Then define rentRecords and pagination from data
  const rentRecords = data?.rents || [];
  const pagination = data?.pagination;
  
  // Mutation hooks for actions
  const { deleteRent, isDeleting } = useRentMutations();
  const { downloadProof } = useRentUtils();
  
  // Fetch properties for filter dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyService.getAllProperties();
        setProperties(response.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    
    if (!isTenant) {
      fetchProperties();
    }
  }, [isTenant]);
  
  // Fetch units when property changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!filters.propertyId) {
        setUnits([]);
        return;
      }
      
      try {
        const property = await propertyService.getPropertyById(filters.propertyId);
        if (property && property.units) {
          setUnits(property.units);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };
    
    fetchUnits();
  }, [filters.propertyId]);
  
  // Update URL with current filters and pagination
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [filters, page, limit, navigate, location.pathname]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Reset to first page when filters change
    if (page !== 1) setPage(1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    const baseFilters = isTenant ? { tenantId: user._id } : {};
    setFilters({
      ...baseFilters,
      propertyId: '',
      unitId: '',
      status: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setPage(1);
  };
  
  // Handle deletion
  const handleDelete = async (rentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }
    
    setProcessingId(rentId);
    try {
      await deleteRent(rentId);
      showSuccess('Payment record deleted successfully');
      refetch();
    } catch (error) {
      showError('Failed to delete payment record');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Handle payment proof download
  const handleDownloadProof = async (rentId) => {
    setProcessingId(rentId);
    try {
      await downloadProof(rentId);
    } finally {
      setProcessingId(null);
    }
  };
  
  // Pagination handlers
  const goToPage = (newPage) => {
    setPage(newPage);
  };
  
  // Active filters for display
  const activeFilters = Object.entries({
    'Property': filters.propertyId ? properties.find(p => p._id === filters.propertyId)?.name : null,
    'Unit': filters.unitId ? units.find(u => u._id === filters.unitId)?.unitName : null,
    'Status': filters.status ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1) : null,
    'Date Range': filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : null,
    'Search': filters.search || null,
  }).filter(([_, value]) => value !== null);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Payment Records</h1>
        
        {!isTenant && (
          <Link 
            to="/payments/record" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaPlus className="mr-2" />
            Record Payment
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
              <>
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
                    {properties.map((property) => (
                      <option key={property._id} value={property._id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="unitId">
                    Unit
                  </label>
                  <select
                    id="unitId"
                    name="unitId"
                    className="w-full p-2 border rounded-md"
                    value={filters.unitId}
                    onChange={handleFilterChange}
                    disabled={!filters.propertyId}
                  >
                    <option value="">All Units</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.unitName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                Payment Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full p-2 border rounded-md"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="due">Due</option>
                <option value="overdue">Overdue</option>
                <option value="waived">Waived</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="startDate">
                Start Date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="w-full p-2 border rounded-md"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="endDate">
                End Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className="w-full p-2 border rounded-md"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
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
                  placeholder="Search by tenant name..."
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
      
      {/* Payment records list */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
          <span className="ml-2">Loading payment records...</span>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          An error occurred while loading payment records. Please try again.
        </div>
      ) : rentRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaFileInvoiceDollar className="mx-auto text-gray-400 text-4xl mb-4" />
          <p className="text-lg text-gray-600 mb-4">
            {activeFilters.length > 0 
              ? 'No payment records match your filters.' 
              : 'No payment records found.'}
          </p>
          {activeFilters.length > 0 ? (
            <button 
              onClick={clearFilters}
              className="text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          ) : !isTenant ? (
            <Link to="/payments/record" className="inline-block text-blue-600 hover:underline">
              Record your first payment
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
                      Due Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant / Property
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
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
                  {rentRecords.map((rent) => (
                    <tr key={rent._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rent.formattedDueDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {rent.tenantName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rent.propertyName} {rent.unitName !== 'Unknown Unit' ? `- ${rent.unitName}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rent.formattedAmount}
                        </div>
                        {rent.amountPaid > 0 && (
                          <div className="text-sm text-gray-500">
                            Paid: {rent.formattedAmountPaid}
                          </div>
                        )}
                        {rent.balance > 0 && (
                          <div className="text-sm text-red-500">
                            Balance: {rent.formattedBalance}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rent.statusClass}`}>
                          {rent.statusDisplay}
                        </span>
                        
                        {rent.paymentDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Paid on: {rent.formattedPaymentDate}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/payments/${rent._id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View details"
                          >
                            <FaEye />
                          </Link>
                          
                          {rent.hasPaymentProof && (
                            <button
                              onClick={() => handleDownloadProof(rent._id)}
                              disabled={processingId === rent._id}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Download payment proof"
                            >
                              {processingId === rent._id ? <Spinner size="sm" /> : <FaDownload />}
                            </button>
                          )}
                          
                          {!isTenant && (
                            <>
                              <Link
                                to={`/payments/${rent._id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit payment"
                              >
                                <FaEdit />
                              </Link>
                              
                              <button
                                onClick={() => handleDelete(rent._id)}
                                disabled={processingId === rent._id || isDeleting}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete payment"
                              >
                                {processingId === rent._id ? <Spinner size="sm" /> : <FaTrash />}
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
          </div>
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </div>
              <nav className="flex space-x-1">
                <button
                  onClick={() => goToPage(1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  First
                </button>
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Previous
                </button>
                {[...Array(pagination.pages).keys()].map((x) => {
                  const pageNum = x + 1;
                  // Only show nearby pages
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.pages ||
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1 rounded-md ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  // Show ellipsis for gaps
                  if (
                    (pageNum === 2 && pagination.page > 3) ||
                    (pageNum === pagination.pages - 1 && pagination.page < pagination.pages - 2)
                  ) {
                    return <span key={pageNum} className="px-1">...</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Next
                </button>
                <button
                  onClick={() => goToPage(pagination.pages)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Last
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}