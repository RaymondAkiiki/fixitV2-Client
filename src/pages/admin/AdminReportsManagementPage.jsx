// frontend/src/pages/admin/AdminReportsManagementPage.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import * as requestService from "../../services/requestService.js";
import * as scheduledMaintenanceService from "../../services/scheduledMaintenanceService.js";
import * as rentService from "../../services/rentService.js";
import * as leaseService from "../../services/leaseService.js";
import * as propertyService from "../../services/propertyService.js";
import * as vendorService from "../../services/vendorService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { formatDate, formatCurrency } from '../../utils/helpers.js';

// Import icons
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  Download, 
  Filter, 
  Calendar, 
  FileText, 
  ArrowDownToLine, 
  Home, 
  Users, 
  DollarSign, 
  AlertCircle,
  Wrench,
  Clock,
  RefreshCw
} from 'lucide-react';

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const AdminReportsManagementPage = () => {
  const { showError, showSuccess } = useGlobalAlert();
  
  // State for data
  const [requests, setRequests] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rents, setRents] = useState([]);
  const [leases, setLeases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    requests: true,
    maintenance: true,
    properties: true,
    rents: true,
    leases: true,
    vendors: true,
    users: true
  });

  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    propertyId: '',
    status: '',
    category: '',
    reportType: 'all',
  });

  // Report types
  const [currentReportType, setCurrentReportType] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  
  // Abort controllers for API requests
  const abortControllers = useRef({});

  // Summary statistics
  const [summaryStats, setSummaryStats] = useState({
    totalRequests: 0,
    openRequests: 0,
    completedRequests: 0,
    upcomingMaintenance: 0,
    totalProperties: 0,
    occupancyRate: 0,
    activeLeases: 0,
    rentCollectionRate: 0,
    overdueRent: 0,
    vendorPerformance: 0
  });
  
  // Create fetch function with abort controller
  const fetchWithAbort = useCallback(async (key, fetchFn, params = {}) => {
    // Cancel previous request if exists
    if (abortControllers.current[key]) {
      abortControllers.current[key].abort();
    }
    
    // Create new abort controller
    abortControllers.current[key] = new AbortController();
    const signal = abortControllers.current[key].signal;
    
    // Set loading state
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const response = await fetchFn(params, signal);
      return response;
    } catch (error) {
      if (error.message !== 'Request canceled') {
        console.error(`Error fetching ${key}:`, error);
        throw error;
      }
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  // Fetch maintenance requests data
  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetchWithAbort('requests', requestService.getAllRequests);
      setRequests(response?.requests || []);
    } catch (error) {
      showError(`Failed to load maintenance requests: ${error.message}`);
    }
  }, [fetchWithAbort, showError]);
  
  // Fetch scheduled maintenance data
  const fetchMaintenance = useCallback(async () => {
    try {
      const response = await fetchWithAbort('maintenance', scheduledMaintenanceService.getAllScheduledMaintenance);
      setMaintenance(response?.tasks || []);
    } catch (error) {
      showError(`Failed to load scheduled maintenance: ${error.message}`);
    }
  }, [fetchWithAbort, showError]);
  
  // Fetch properties data
  const fetchProperties = useCallback(async () => {
    try {
      const response = await fetchWithAbort('properties', propertyService.getAllProperties);
      setProperties(response?.properties || []);
    } catch (error) {
      showError(`Failed to load properties: ${error.message}`);
    }
  }, [fetchWithAbort, showError]);
  
  // Fetch rent data
  const fetchRents = useCallback(async () => {
    try {
      const response = await fetchWithAbort('rents', rentService.getRentEntries);
      setRents(response?.data || []);
    } catch (error) {
      showError(`Failed to load rent data: ${error.message}`);
    }
  }, [fetchWithAbort, showError]);
  
  // Fetch lease data
  const fetchLeases = useCallback(async () => {
    try {
      const response = await fetchWithAbort('leases', leaseService.getLeases);
      setLeases(response?.leases || []);
    } catch (error) {
      showError(`Failed to load lease data: ${error.message}`);
    }
  }, [fetchWithAbort, showError]);
  
  // Fetch vendor data
  const fetchVendors = useCallback(async () => {
    try {
      const response = await fetchWithAbort('vendors', vendorService.getAllVendors);
      setVendors(response?.data || []);
    } catch (error) {
      showError(`Failed to load vendor data: ${error.message}`);
    }
  }, [fetchWithAbort, showError]);
  
  // Fetch user data
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetchWithAbort('users', adminService.getAllUsers);
      setUsers(response?.data || []);
    } catch (error) {
      showError(`Failed to load user data: ${error.message}`);
    }
  }, [fetchWithAbort, showError]);

  // Function to match filters
  const matchOrAll = (field, value) => {
    if (!value || value === "all" || value === "") return true;
    if (field == null) return false;
    return String(field).toLowerCase() === String(value).toLowerCase();
  };

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r =>
      matchOrAll(r.property?._id, filters.propertyId) &&
      matchOrAll(r.status, filters.status) &&
      matchOrAll(r.category, filters.category) &&
      (!filters.startDate || (r.createdAt && new Date(r.createdAt) >= new Date(filters.startDate))) &&
      (!filters.endDate || (r.createdAt && new Date(r.createdAt) <= new Date(filters.endDate)))
    );
  }, [requests, filters]);

  // Filtered Maintenance
  const filteredMaintenance = useMemo(() => {
    return maintenance.filter(m =>
      matchOrAll(m.property?._id, filters.propertyId) &&
      matchOrAll(m.status, filters.status) &&
      matchOrAll(m.category, filters.category) &&
      (!filters.startDate || (m.scheduledDate && new Date(m.scheduledDate) >= new Date(filters.startDate))) &&
      (!filters.endDate || (m.scheduledDate && new Date(m.scheduledDate) <= new Date(filters.endDate)))
    );
  }, [maintenance, filters]);

  // Filtered Rent Payments
  const filteredRents = useMemo(() => {
    return rents.filter(r =>
      matchOrAll(r.property?._id, filters.propertyId) &&
      matchOrAll(r.status, filters.status) &&
      (!filters.startDate || (r.dueDate && new Date(r.dueDate) >= new Date(filters.startDate))) &&
      (!filters.endDate || (r.dueDate && new Date(r.dueDate) <= new Date(filters.endDate)))
    );
  }, [rents, filters]);

  // Filtered Leases
  const filteredLeases = useMemo(() => {
    return leases.filter(l =>
      matchOrAll(l.property?._id, filters.propertyId) &&
      matchOrAll(l.status, filters.status) &&
      (!filters.startDate || (l.leaseStartDate && new Date(l.leaseStartDate) >= new Date(filters.startDate))) &&
      (!filters.endDate || (l.leaseStartDate && new Date(l.leaseStartDate) <= new Date(filters.endDate)))
    );
  }, [leases, filters]);

  // Calculate summary statistics
  const calculateSummaryStats = useCallback(() => {
    // Request stats
    const openRequestsCount = requests.filter(r => 
      ['new', 'assigned', 'in_progress', 'reopened'].includes(r.status?.toLowerCase())
    ).length;
    
    const completedRequestsCount = requests.filter(r => 
      ['completed', 'verified'].includes(r.status?.toLowerCase())
    ).length;
    
    // Maintenance stats
    const upcomingMaintenanceCount = maintenance.filter(m => 
      new Date(m.scheduledDate) > new Date() && 
      ['active', 'scheduled'].includes(m.status?.toLowerCase())
    ).length;
    
    // Property stats
    const totalUnits = properties.reduce((acc, prop) => acc + (prop.unitCount || 0), 0);
    const occupiedUnits = leases.filter(l => 
      l.status?.toLowerCase() === 'active'
    ).length;
    
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    
    // Lease stats
    const activeLeaseCount = leases.filter(l => 
      l.status?.toLowerCase() === 'active'
    ).length;
    
    // Rent stats
    const totalDueRents = rents.length;
    const paidRents = rents.filter(r => 
      ['paid'].includes(r.status?.toLowerCase())
    ).length;
    
    const rentCollectionRate = totalDueRents > 0 ? (paidRents / totalDueRents) * 100 : 0;
    
    const overdueRentAmount = rents
      .filter(r => r.status?.toLowerCase() === 'overdue')
      .reduce((acc, rent) => acc + (rent.amountDue || 0), 0);
    
    // Vendor stats
    const avgVendorRating = vendors.length > 0 
      ? vendors.reduce((acc, v) => acc + (v.averageRating || 0), 0) / vendors.length 
      : 0;
    
    setSummaryStats({
      totalRequests: requests.length,
      openRequests: openRequestsCount,
      completedRequests: completedRequestsCount,
      upcomingMaintenance: upcomingMaintenanceCount,
      totalProperties: properties.length,
      occupancyRate: occupancyRate,
      activeLeases: activeLeaseCount,
      rentCollectionRate: rentCollectionRate,
      overdueRent: overdueRentAmount,
      vendorPerformance: avgVendorRating
    });
  }, [requests, maintenance, properties, leases, rents, vendors]);

  // Initial data loading
  useEffect(() => {
    fetchRequests();
    fetchMaintenance();
    fetchProperties();
    fetchRents();
    fetchLeases();
    fetchVendors();
    fetchUsers();
    
    return () => {
      // Cleanup: abort all requests
      Object.values(abortControllers.current).forEach(controller => {
        if (controller) controller.abort();
      });
    };
  }, [fetchRequests, fetchMaintenance, fetchProperties, fetchRents, fetchLeases, fetchVendors, fetchUsers]);

  // Calculate summary stats when data changes
  useEffect(() => {
    calculateSummaryStats();
  }, [requests, maintenance, properties, rents, leases, vendors, calculateSummaryStats]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      propertyId: '',
      status: '',
      category: '',
      reportType: currentReportType
    });
  };

  // Change report type
  const handleReportTypeChange = (reportType) => {
    setCurrentReportType(reportType);
    setFilters(prev => ({ ...prev, reportType }));
  };

  // Refresh all data
  const handleRefreshData = () => {
    fetchRequests();
    fetchMaintenance();
    fetchProperties();
    fetchRents();
    fetchLeases();
    fetchVendors();
    fetchUsers();
    showSuccess("Report data refreshed successfully");
  };

  // Export current view as CSV
  const handleExportReport = () => {
    let csvContent;
    let filename;
    
    switch (currentReportType) {
      case 'maintenance':
        csvContent = "Type,Title,Status,Category,Property,Unit,Created By,Assigned To,Created/Scheduled Date\n";
        filteredRequests.forEach(item => {
          csvContent += [
            "Request",
            `"${item.title || ""}"`,
            item.status || "",
            item.category || "",
            item.property?.name || "",
            item.unit?.unitName || "",
            item.createdBy?.name || "",
            item.assignedTo?.name || "",
            item.createdAt ? formatDate(item.createdAt) : ""
          ].join(",") + "\n";
        });
        filteredMaintenance.forEach(item => {
          csvContent += [
            "Scheduled Maintenance",
            `"${item.title || ""}"`,
            item.status || "",
            item.category || "",
            item.property?.name || "",
            item.unit?.unitName || "",
            item.createdBy?.name || "",
            item.assignedTo?.name || "",
            item.scheduledDate ? formatDate(item.scheduledDate) : ""
          ].join(",") + "\n";
        });
        filename = "maintenance_report.csv";
        break;
        
      case 'financials':
        csvContent = "Type,ID,Property,Unit,Tenant,Amount,Due Date,Status,Payment Date\n";
        filteredRents.forEach(item => {
          csvContent += [
            "Rent",
            item._id || "",
            item.property?.name || "",
            item.unit?.unitName || "",
            item.tenant?.firstName + " " + item.tenant?.lastName || "",
            item.amountDue || "0",
            item.dueDate ? formatDate(item.dueDate) : "",
            item.status || "",
            item.paymentDate ? formatDate(item.paymentDate) : ""
          ].join(",") + "\n";
        });
        filename = "financial_report.csv";
        break;
        
      case 'leases':
        csvContent = "ID,Property,Unit,Tenant,Start Date,End Date,Monthly Rent,Status\n";
        filteredLeases.forEach(item => {
          csvContent += [
            item._id || "",
            item.property?.name || "",
            item.unit?.unitName || "",
            item.tenant?.firstName + " " + item.tenant?.lastName || "",
            item.leaseStartDate ? formatDate(item.leaseStartDate) : "",
            item.leaseEndDate ? formatDate(item.leaseEndDate) : "",
            item.monthlyRent || "0",
            item.status || ""
          ].join(",") + "\n";
        });
        filename = "lease_report.csv";
        break;
        
      case 'property':
        csvContent = "ID,Name,Type,Address,Units,Occupancy Rate\n";
        properties.forEach(item => {
          // Calculate occupancy for this property
          const totalUnits = item.unitCount || 0;
          const occupiedUnits = leases.filter(l => 
            l.property?._id === item._id && 
            l.status?.toLowerCase() === 'active'
          ).length;
          
          const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
          
          csvContent += [
            item._id || "",
            item.name || "",
            item.propertyType || "",
            item.address?.street + ", " + item.address?.city + ", " + item.address?.state || "",
            totalUnits,
            occupancyRate.toFixed(2) + "%"
          ].join(",") + "\n";
        });
        filename = "property_report.csv";
        break;
        
      default: // 'all' or any other type
        csvContent = "Report Type,Category,Count,Details\n";
        csvContent += [
          "Maintenance",
          "Total Requests",
          requests.length,
          "All maintenance requests"
        ].join(",") + "\n";
        csvContent += [
          "Maintenance",
          "Open Requests",
          summaryStats.openRequests,
          "New, assigned, in progress, or reopened"
        ].join(",") + "\n";
        csvContent += [
          "Maintenance",
          "Completed Requests",
          summaryStats.completedRequests,
          "Completed or verified"
        ].join(",") + "\n";
        csvContent += [
          "Maintenance",
          "Upcoming Scheduled",
          summaryStats.upcomingMaintenance,
          "Scheduled in the future"
        ].join(",") + "\n";
        csvContent += [
          "Properties",
          "Total Properties",
          properties.length,
          "All properties"
        ].join(",") + "\n";
        csvContent += [
          "Properties",
          "Occupancy Rate",
          summaryStats.occupancyRate.toFixed(2) + "%",
          "Percentage of units occupied"
        ].join(",") + "\n";
        csvContent += [
          "Financials",
          "Active Leases",
          summaryStats.activeLeases,
          "Currently active leases"
        ].join(",") + "\n";
        csvContent += [
          "Financials",
          "Rent Collection Rate",
          summaryStats.rentCollectionRate.toFixed(2) + "%",
          "Percentage of due rents collected"
        ].join(",") + "\n";
        csvContent += [
          "Financials",
          "Overdue Rent Amount",
          formatCurrency(summaryStats.overdueRent),
          "Total overdue rent amount"
        ].join(",") + "\n";
        csvContent += [
          "Vendors",
          "Average Rating",
          summaryStats.vendorPerformance.toFixed(2),
          "Average vendor rating (0-5)"
        ].join(",") + "\n";
        filename = "summary_report.csv";
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Report exported successfully!");
  };

  // Check if any section is still loading
  const isLoading = Object.values(loading).some(Boolean);

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377] flex items-center">
          <BarChart className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
          Reports & Analytics
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Generate reports, analyze data, and export information across the system.
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#219377] mb-4 md:mb-0">Report Type</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshData}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
            </button>
            <button
              onClick={handleExportReport}
              className="flex items-center px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" /> Export Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <button
            onClick={() => handleReportTypeChange('all')}
            className={`p-4 rounded-lg border ${
              currentReportType === 'all' 
                ? 'bg-[#219377] text-white border-[#219377]' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } flex flex-col items-center justify-center h-24`}
          >
            <BarChart className="w-8 h-8 mb-2" />
            <span className="font-medium">Summary Report</span>
          </button>
          
          <button
            onClick={() => handleReportTypeChange('maintenance')}
            className={`p-4 rounded-lg border ${
              currentReportType === 'maintenance' 
                ? 'bg-[#219377] text-white border-[#219377]' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } flex flex-col items-center justify-center h-24`}
          >
            <Wrench className="w-8 h-8 mb-2" />
            <span className="font-medium">Maintenance</span>
          </button>
          
          <button
            onClick={() => handleReportTypeChange('financials')}
            className={`p-4 rounded-lg border ${
              currentReportType === 'financials' 
                ? 'bg-[#219377] text-white border-[#219377]' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } flex flex-col items-center justify-center h-24`}
          >
            <DollarSign className="w-8 h-8 mb-2" />
            <span className="font-medium">Financial</span>
          </button>
          
          <button
            onClick={() => handleReportTypeChange('leases')}
            className={`p-4 rounded-lg border ${
              currentReportType === 'leases' 
                ? 'bg-[#219377] text-white border-[#219377]' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } flex flex-col items-center justify-center h-24`}
          >
            <FileText className="w-8 h-8 mb-2" />
            <span className="font-medium">Leases</span>
          </button>
          
          <button
            onClick={() => handleReportTypeChange('property')}
            className={`p-4 rounded-lg border ${
              currentReportType === 'property' 
                ? 'bg-[#219377] text-white border-[#219377]' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } flex flex-col items-center justify-center h-24`}
          >
            <Home className="w-8 h-8 mb-2" />
            <span className="font-medium">Properties</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#219377] flex items-center">
            <Filter className="w-6 h-6 mr-2" />
            Filters
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 hover:text-blue-800"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              />
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
              >
                <option value="">All Properties</option>
                {properties.map(property => (
                  <option key={property._id} value={property._id}>{property.name}</option>
                ))}
              </select>
            </div>
            
            {/* Status - conditional based on report type */}
            {['maintenance', 'financials', 'leases'].includes(currentReportType) && (
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
                  {currentReportType === 'maintenance' && (
                    <>
                      <option value="new">New</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="verified">Verified</option>
                      <option value="reopened">Reopened</option>
                      <option value="archived">Archived</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="canceled">Canceled</option>
                    </>
                  )}
                  {currentReportType === 'financials' && (
                    <>
                      <option value="due">Due</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="waived">Waived</option>
                    </>
                  )}
                  {currentReportType === 'leases' && (
                    <>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="pending_renewal">Pending Renewal</option>
                      <option value="terminated">Terminated</option>
                      <option value="draft">Draft</option>
                    </>
                  )}
                </select>
              </div>
            )}
            
            {/* Category - only for maintenance */}
            {currentReportType === 'maintenance' && (
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
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC</option>
                  <option value="appliance">Appliance</option>
                  <option value="structural">Structural</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="pest_control">Pest Control</option>
                  <option value="general_repair">General Repair</option>
                </select>
              </div>
            )}
          </div>
        )}

        {showFilters && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 mr-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" color={PRIMARY_COLOR} className="mr-4" />
            <p className="text-xl text-gray-700">Loading report data...</p>
          </div>
        ) : (
          <>
            {/* Summary Report */}
            {currentReportType === 'all' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#219377] mb-6">Summary Report</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Maintenance Stats */}
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                      <Wrench className="w-5 h-5 mr-2" />
                      Maintenance
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Requests:</span>
                        <span className="font-semibold">{summaryStats.totalRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Open Requests:</span>
                        <span className="font-semibold">{summaryStats.openRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed Requests:</span>
                        <span className="font-semibold">{summaryStats.completedRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Upcoming Scheduled:</span>
                        <span className="font-semibold">{summaryStats.upcomingMaintenance}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Property Stats */}
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                    <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                      <Home className="w-5 h-5 mr-2" />
                      Properties
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Properties:</span>
                        <span className="font-semibold">{properties.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Units:</span>
                        <span className="font-semibold">
                          {properties.reduce((acc, p) => acc + (p.unitCount || 0), 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Occupancy Rate:</span>
                        <span className="font-semibold">{summaryStats.occupancyRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Users:</span>
                        <span className="font-semibold">{users.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Financial Stats */}
                  <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                    <h3 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Financials
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Leases:</span>
                        <span className="font-semibold">{summaryStats.activeLeases}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rent Collection Rate:</span>
                        <span className="font-semibold">{summaryStats.rentCollectionRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overdue Rent:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(summaryStats.overdueRent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vendor Performance:</span>
                        <span className="font-semibold">{summaryStats.vendorPerformance.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-[#219377] mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Activity
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title/Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Show most recent combined activity */}
                        {[...requests, ...maintenance, ...rents]
                          .sort((a, b) => new Date(b.createdAt || b.scheduledDate || b.dueDate) - new Date(a.createdAt || a.scheduledDate || a.dueDate))
                          .slice(0, 10)
                          .map((item, idx) => {
                            const isRequest = 'title' in item && 'priority' in item;
                            const isMaintenance = 'title' in item && 'recurrence' in item;
                            const isRent = 'amountDue' in item;
                            
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#219377]">
                                  {isRequest ? 'Maintenance Request' : 
                                   isMaintenance ? 'Scheduled Maintenance' : 
                                   isRent ? 'Rent Payment' : 'Activity'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {isRequest || isMaintenance ? item.title : 
                                   isRent ? `Rent Payment - ${formatCurrency(item.amountDue)}` : 
                                   'Unknown Activity'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <StatusBadge status={item.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.property?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(item.createdAt || item.scheduledDate || item.dueDate)}
                                </td>
                              </tr>
                            );
                          })}
                          
                        {[...requests, ...maintenance, ...rents].length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500 italic">
                              No recent activity found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Maintenance Report */}
            {currentReportType === 'maintenance' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#219377] mb-6 flex items-center">
                  <Wrench className="w-6 h-6 mr-2" />
                  Maintenance Report
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
                    <p className="text-2xl font-bold text-[#219377]">{filteredRequests.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Open Requests</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {filteredRequests.filter(r => 
                        ['new', 'assigned', 'in_progress', 'reopened'].includes(r.status?.toLowerCase())
                      ).length}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Scheduled Tasks</h3>
                    <p className="text-2xl font-bold text-orange-500">{filteredMaintenance.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Average Resolution Time</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {filteredRequests.length ? 
                        Math.round(filteredRequests
                          .filter(r => r.completedAt && r.createdAt)
                          .reduce((acc, r) => acc + 
                            (new Date(r.completedAt) - new Date(r.createdAt)) / (1000 * 60 * 60 * 24), 0
                          ) / 
                          filteredRequests.filter(r => r.completedAt && r.createdAt).length || 0
                        ) + " days" :
                        "N/A"}
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Requests */}
                      {filteredRequests.map((item, idx) => (
                        <tr key={"req-" + (item._id || idx)} className="hover:bg-blue-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">Request</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.property?.name || ""}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit?.unitName || ""}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.createdBy?.firstName} {item.createdBy?.lastName || ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.assignedTo?.firstName} {item.assignedTo?.lastName || ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.createdAt)}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Maintenance */}
                      {filteredMaintenance.map((item, idx) => (
                        <tr key={"maint-" + (item._id || idx)} className="hover:bg-yellow-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-600">Scheduled</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.property?.name || ""}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit?.unitName || ""}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.createdBy?.firstName} {item.createdBy?.lastName || ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.assignedTo?.firstName} {item.assignedTo?.lastName || ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.scheduledDate)}
                          </td>
                        </tr>
                      ))}
                      
                      {filteredRequests.length === 0 && filteredMaintenance.length === 0 && (
                        <tr>
                          <td colSpan="9" className="px-6 py-4 text-center text-gray-500 italic">
                            No maintenance requests or scheduled tasks found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Financial Report */}
            {currentReportType === 'financials' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#219377] mb-6 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2" />
                  Financial Report
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Rent Due</h3>
                    <p className="text-2xl font-bold text-[#219377]">
                      {formatCurrency(filteredRents.reduce((acc, r) => acc + (r.amountDue || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Collected</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(filteredRents
                        .filter(r => r.status?.toLowerCase() === 'paid')
                        .reduce((acc, r) => acc + (r.amountDue || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Overdue Amount</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(filteredRents
                        .filter(r => r.status?.toLowerCase() === 'overdue')
                        .reduce((acc, r) => acc + (r.amountDue || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Collection Rate</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {filteredRents.length > 0 ? 
                        (filteredRents.filter(r => r.status?.toLowerCase() === 'paid').length / 
                        filteredRents.length * 100).toFixed(1) + '%' : 
                        'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRents.map((item, idx) => (
                        <tr key={item._id || idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item._id?.substring(0, 8) || `RENT-${idx}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.property?.name || ""}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit?.unitName || ""}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.tenant?.firstName} {item.tenant?.lastName || ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.amountDue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.paymentDate ? formatDate(item.paymentDate) : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {item.paymentMethod || "-"}
                          </td>
                        </tr>
                      ))}
                      
                      {filteredRents.length === 0 && (
                        <tr>
                          <td colSpan="9" className="px-6 py-4 text-center text-gray-500 italic">
                            No rent payments found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Lease Report */}
            {currentReportType === 'leases' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#219377] mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-2" />
                  Lease Report
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Leases</h3>
                    <p className="text-2xl font-bold text-[#219377]">{filteredLeases.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Active Leases</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {filteredLeases.filter(l => l.status?.toLowerCase() === 'active').length}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Expiring Soon</h3>
                    <p className="text-2xl font-bold text-orange-500">
                      {filteredLeases.filter(l => 
                        l.status?.toLowerCase() === 'active' && 
                        l.leaseEndDate && 
                        new Date(l.leaseEndDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      ).length}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Average Rent</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {filteredLeases.length ? 
                        formatCurrency(
                          filteredLeases.reduce((acc, l) => acc + (l.monthlyRent || 0), 0) / 
                          filteredLeases.length
                        ) : 
                        formatCurrency(0)}
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLeases.map((item, idx) => (
                        <tr key={item._id || idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item._id?.substring(0, 8) || `LEASE-${idx}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.property?.name || ""}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit?.unitName || ""}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.tenant?.firstName} {item.tenant?.lastName || ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.leaseStartDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.leaseEndDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.monthlyRent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))}
                      
                      {filteredLeases.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-gray-500 italic">
                            No leases found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Property Report */}
            {currentReportType === 'property' && (
              <div>
                <h2 className="text-2xl font-semibold text-[#219377] mb-6 flex items-center">
                  <Home className="w-6 h-6 mr-2" />
                  Property Report
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Properties</h3>
                    <p className="text-2xl font-bold text-[#219377]">{properties.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Units</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {properties.reduce((acc, p) => acc + (p.unitCount || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Occupancy Rate</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {summaryStats.occupancyRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Avg. Monthly Rent</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(
                        leases.length > 0 
                          ? leases.reduce((acc, l) => acc + (l.monthlyRent || 0), 0) / leases.length 
                          : 0
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Rent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {properties.map((item, idx) => {
                        // Calculate property-specific metrics
                        const totalUnits = item.unitCount || 0;
                        const occupiedUnits = leases.filter(l => 
                          l.property?._id === item._id && 
                          l.status?.toLowerCase() === 'active'
                        ).length;
                        
                        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
                        
                        // Calculate average rent for this property
                        const propertyLeases = leases.filter(l => l.property?._id === item._id);
                        const avgRent = propertyLeases.length > 0
                          ? propertyLeases.reduce((acc, l) => acc + (l.monthlyRent || 0), 0) / propertyLeases.length
                          : 0;
                        
                        return (
                          <tr key={item._id || idx} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item._id?.substring(0, 8) || `PROP-${idx}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {item.propertyType || 'residential'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.address?.street}, {item.address?.city}, {item.address?.state}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              {totalUnits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              {occupiedUnits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center">
                                <span className={
                                  occupancyRate >= 80 ? "text-green-600" :
                                  occupancyRate >= 50 ? "text-yellow-600" :
                                  "text-red-600"
                                }>
                                  {occupancyRate.toFixed(1)}%
                                </span>
                                <div className="ml-2 w-16 bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className={`h-2.5 rounded-full ${
                                      occupancyRate >= 80 ? "bg-green-600" :
                                      occupancyRate >= 50 ? "bg-yellow-500" :
                                      "bg-red-600"
                                    }`} 
                                    style={{ width: `${Math.min(100, occupancyRate)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(avgRent)}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {properties.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-gray-500 italic">
                            No properties found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReportsManagementPage;