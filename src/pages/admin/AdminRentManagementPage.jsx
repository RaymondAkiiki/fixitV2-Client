// frontend/src/pages/admin/AdminRentManagementPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import * as rentService from "../../services/rentService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { RENT_STATUS_ENUM, ROUTES } from '../../utils/constants.js';
import { formatDate, formatCurrency } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';

// Payment Status Badge Component
const PaymentStatusBadge = ({ status }) => {
  const getStatusClass = () => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'due':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800';
      case 'waived':
        return 'bg-purple-100 text-purple-800';
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

const AdminRentManagementPage = () => {
  const { showError, showSuccess } = useGlobalAlert();
  
  // State for rent records data
  const [rentRecords, setRentRecords] = useState([]);
  const [properties, setProperties] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    totalDue: 0,
    totalPaid: 0,
    totalOverdue: 0,
    totalPartiallyPaid: 0,
    currentMonthCollection: 0,
    collectionRate: 0,
  });
  
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
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    propertyId: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controllers for API requests
  const rentsAbortController = useRef(null);
  const propertiesAbortController = useRef(null);
  const statsAbortController = useRef(null);

  // Fetch rent records with filters and pagination
  const fetchRentRecords = useCallback(async () => {
    // Cancel any ongoing request
    if (rentsAbortController.current) {
      rentsAbortController.current.abort();
    }
    
    // Create new abort controller
    rentsAbortController.current = new AbortController();
    const signal = rentsAbortController.current.signal;
    
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
      const response = await adminService.getAllRents(params, signal);
      
      // Update state with response data
      setRentRecords(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load rent records: ' + error.message);
        console.error('Error fetching rent records:', error);
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

  // Fetch rent statistics
  const fetchRentStats = useCallback(async () => {
    // For this example, we'll calculate some stats based on the first page of rent records
    // In a real implementation, you would call a dedicated endpoint for this
    setStatsLoading(true);
    
    try {
      const statsParams = { limit: 100, page: 1 };
      const response = await rentService.getRentEntries(statsParams);
      
      if (response && response.data) {
        const rentData = response.data;
        
        // Calculate basic stats
        const totalDue = rentData.reduce((sum, rent) => sum + (rent.amountDue || 0), 0);
        const totalPaid = rentData.reduce((sum, rent) => sum + (rent.amountPaid || 0), 0);
        
        // Count by status
        const statusCounts = rentData.reduce((counts, rent) => {
          const status = rent.status || 'unknown';
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        }, {});
        
        // Current month collection
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentMonthPayments = rentData.filter(rent => {
          if (!rent.paymentDate) return false;
          const paymentDate = new Date(rent.paymentDate);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        });
        
        const currentMonthCollection = currentMonthPayments.reduce((sum, rent) => sum + (rent.amountPaid || 0), 0);
        
        // Collection rate
        const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
        
        // Update stats state
        setOverviewStats({
          totalDue,
          totalPaid,
          totalOverdue: statusCounts.overdue || 0,
          totalPartiallyPaid: statusCounts.partially_paid || 0,
          currentMonthCollection,
          collectionRate,
        });
      }
    } catch (error) {
      console.error('Error calculating rent statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Handle recording a payment
  const handleRecordPayment = useCallback(async (rentId) => {
    // In a real app, you'd open a modal or redirect to a payment form
    // For this example, we'll just show a message
    showSuccess(`Redirecting to payment form for rent ID: ${rentId}`);
  }, [showSuccess]);

  // Initial data loading
  useEffect(() => {
    fetchProperties();
    fetchRentStats();
    
    return () => {
      // Clean up requests on unmount
      if (propertiesAbortController.current) {
        propertiesAbortController.current.abort();
      }
      if (statsAbortController.current) {
        statsAbortController.current.abort();
      }
    };
  }, [fetchProperties, fetchRentStats]);

  // Fetch rent records when filters or pagination changes
  useEffect(() => {
    fetchRentRecords();
    
    return () => {
      if (rentsAbortController.current) {
        rentsAbortController.current.abort();
      }
    };
  }, [fetchRentRecords]);

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
      dateFrom: '',
      dateTo: '',
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
          Rent Management
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Manage rent payments, track due amounts, and monitor collection rates.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-end space-x-4">
        <Link 
          to={ROUTES.ADMIN_RENT_SCHEDULES || ROUTES.ADMIN_RENTS + '/schedules'} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Manage Rent Schedules
        </Link>
        <Link 
          to={ROUTES.ADMIN_RENT_RECORD || ROUTES.ADMIN_RENTS + '/record'} 
          className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
        >
          Record New Payment
        </Link>
      </div>
      
      {/* Stats Overview */}
      {!statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Due</h3>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(overviewStats.totalDue)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Paid</h3>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(overviewStats.totalPaid)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Collection Rate</h3>
            <p className="text-2xl font-bold text-blue-600">{overviewStats.collectionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Overdue Payments</h3>
            <p className="text-2xl font-bold text-red-600">{overviewStats.totalOverdue}</p>
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
              placeholder="Search by tenant name or reference"
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
              {Object.values(RENT_STATUS_ENUM).map(status => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </option>
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
          
          {/* Due Date From */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">Due Date From</label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Due Date To */}
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">Due Date To</label>
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
            onClick={fetchRentRecords}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Rent Records Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading rent records...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentRecords.length > 0 ? (
                rentRecords.map(rent => {
                  const formattedRent = rentService.formatRent(rent);
                  return (
                    <tr key={rent._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rent.property?.name || 'N/A'} / {rent.unit?.unitName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rent.tenant ? `${rent.tenant.firstName} ${rent.tenant.lastName}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(rent.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(rent.amountDue, rent.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(rent.amountPaid || 0, rent.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(formattedRent?.balance || 0, rent.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentStatusBadge status={rent.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link 
                            to={ROUTES.ADMIN_RENT_DETAILS ? `${ROUTES.ADMIN_RENT_DETAILS.replace(':paymentId', rent._id)}` : `${ROUTES.ADMIN_RENTS}/${rent._id}`} 
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                          {(rent.status === 'due' || rent.status === 'partially_paid' || rent.status === 'overdue') && (
                            <button 
                              onClick={() => handleRecordPayment(rent._id)}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading rent records...' : 
                      'No rent records found matching your filters.'}
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
              Showing <span className="font-medium">{rentRecords.length}</span> of <span className="font-medium">{pagination.total}</span> records
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

export default AdminRentManagementPage;