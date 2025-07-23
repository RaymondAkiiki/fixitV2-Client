import React, { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom';
import { BarChart, FileText, Download, Filter, ChevronLeft, FileText as FileIcon, AlertTriangle, Calendar } from "lucide-react";
import Button from "../../components/common/Button";
import DashboardFilters from "../../components/common/DashboardFilters";
import Spinner from "../../components/common/Spinner";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { getLeaseExpiryReport, exportReport } from "../../services/reportService";
import { getAllProperties } from "../../services/propertyService";

// Branding
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const LeaseReportsPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    propertyId: "",
    expiryDays: "90", // Default to showing leases expiring in the next 90 days
    status: "active", // Default to active leases
  });
  const [properties, setProperties] = useState([]);
  const [reportData, setReportData] = useState(null);

  // Fetch properties for filter dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await getAllProperties();
        setProperties(response.properties || []);
      } catch (err) {
        console.error("Failed to load properties:", err);
      }
    };

    fetchProperties();
  }, []);

  // Fetch report data when filters change
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Convert filters to API format
        const apiFilters = {
          ...filters,
          expiryDays: parseInt(filters.expiryDays) || 90,
          status: filters.status === "all" ? undefined : filters.status,
        };
        
        const data = await getLeaseExpiryReport(apiFilters);
        setReportData(data);
      } catch (err) {
        setError("Failed to load report data: " + (err.message || "Unknown error"));
        showError("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [filters, showError]);

  // Handle export
  const handleExport = async (format) => {
    try {
      setExportLoading(true);
      
      // Convert filters to API format
      const apiFilters = {
        ...filters,
        expiryDays: parseInt(filters.expiryDays) || 90,
        status: filters.status === "all" ? undefined : filters.status,
      };
      
      await exportReport('lease_expiry', format, apiFilters);
      showSuccess(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      showError("Failed to export report: " + (err.message || "Unknown error"));
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!reportData) return {
      totalLeases: 0,
      expiringThisMonth: 0,
      expiringSoon: 0,
      renewalRate: '0%'
    };
    
    const totalLeases = reportData.leases?.length || 0;
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Count leases expiring this month
    const expiringThisMonth = reportData.leases?.filter(lease => {
      if (!lease.leaseEndDate) return false;
      const endDate = new Date(lease.leaseEndDate);
      return endDate <= endOfMonth && endDate >= today;
    }).length || 0;
    
    return {
      totalLeases,
      expiringThisMonth,
      expiringSoon: reportData.expiringSoonCount || 0,
      renewalRate: reportData.renewalRate ? `${reportData.renewalRate.toFixed(1)}%` : '0%'
    };
  }, [reportData]);

  // Days until expiry helper
  const getDaysUntilExpiry = (endDateStr) => {
    if (!endDateStr) return null;
    
    const today = new Date();
    const endDate = new Date(endDateStr);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <div className="mb-6 flex items-center">
        <Link to="/reports" className="mr-4 text-blue-600 hover:text-blue-800 flex items-center">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold flex items-center" style={{ color: PRIMARY_COLOR }}>
          <FileIcon className="w-7 h-7 mr-2" style={{ color: SECONDARY_COLOR }} />
          Lease Expiry Reports
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Leases</h3>
          <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.totalLeases}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Expiring This Month</h3>
          <p className="text-3xl font-bold" style={{ color: SECONDARY_COLOR }}>{summaryMetrics.expiringThisMonth}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Expiring Soon</h3>
          <div className="flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-orange-500" />
            <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.expiringSoon}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Historical Renewal Rate</h3>
          <p className="text-3xl font-bold" style={{ color: SECONDARY_COLOR }}>{summaryMetrics.renewalRate}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold flex items-center" style={{ color: PRIMARY_COLOR }}>
            <Filter className="h-5 w-5 mr-2" style={{ color: SECONDARY_COLOR }} />
            Filter Report Data
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => handleExport('csv')} 
              disabled={exportLoading || loading}
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-3 py-2 rounded"
            >
              {exportLoading ? <Spinner size="sm" /> : <Download className="w-4 h-4 mr-1" />} Export CSV
            </Button>
            <Button 
              onClick={() => handleExport('pdf')} 
              disabled={exportLoading || loading}
              className="px-3 py-2 rounded text-white"
              style={{ backgroundColor: PRIMARY_COLOR, color: "white" }}
            >
              {exportLoading ? <Spinner size="sm" /> : <FileText className="w-4 h-4 mr-1" />} Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select
              value={filters.propertyId}
              onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Timeframe</label>
            <select
              value={filters.expiryDays}
              onChange={(e) => setFilters({ ...filters, expiryDays: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="30">Next 30 Days</option>
              <option value="60">Next 60 Days</option>
              <option value="90">Next 90 Days</option>
              <option value="180">Next 180 Days</option>
              <option value="365">Next Year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lease Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="active">Active Leases</option>
              <option value="all">All Statuses</option>
              <option value="pending_renewal">Pending Renewal</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expiry Timeline Breakdown */}
      {reportData?.expiryBreakdown && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>
            Lease Expiry Timeline
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(reportData.expiryBreakdown).map(([period, count]) => (
              <div key={period} className="border rounded-lg p-4 text-center">
                <span className={`inline-block px-2 py-1 rounded-full text-xs mb-2 ${
                  period === '30days' ? 'bg-red-100 text-red-800' :
                  period === '60days' ? 'bg-orange-100 text-orange-800' :
                  period === '90days' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {period === '30days' ? 'Next 30 Days' :
                   period === '60days' ? '30-60 Days' :
                   period === '90days' ? '60-90 Days' :
                   period === '180days' ? '90-180 Days' :
                   period}
                </span>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-gray-500">
                  {reportData.leases?.length 
                    ? ((count / reportData.leases.length) * 100).toFixed(1) + '%' 
                    : '0%'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lease Expiry Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <FileText className="h-5 w-5 mr-2" style={{ color: SECONDARY_COLOR }} />
          Lease Expiry Details
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
            <span className="ml-2">Loading lease data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property/Unit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days Until Expiry</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monthly Rent</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Renewal Notice</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.leases?.length > 0 ? (
                  reportData.leases.map((lease, index) => {
                    const daysUntilExpiry = getDaysUntilExpiry(lease.leaseEndDate);
                    
                    return (
                      <tr key={lease._id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium">
                          {lease.tenant ? `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim() : 'Unknown'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {lease.property?.name || 'Unknown'} / {lease.unit?.unitName || 'Unknown'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {lease.leaseStartDate ? new Date(lease.leaseStartDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {lease.leaseEndDate ? new Date(lease.leaseEndDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`font-medium ${
                            daysUntilExpiry <= 30 ? 'text-red-600' :
                            daysUntilExpiry <= 60 ? 'text-orange-600' :
                            daysUntilExpiry <= 90 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {daysUntilExpiry !== null ? daysUntilExpiry : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {lease.monthlyRent ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: lease.currency || 'USD'
                          }).format(lease.monthlyRent) : 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs capitalize ${
                            lease.status === 'active' ? 'bg-green-100 text-green-800' :
                            lease.status === 'pending_renewal' ? 'bg-yellow-100 text-yellow-800' :
                            lease.status === 'expired' ? 'bg-red-100 text-red-800' :
                            lease.status === 'terminated' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {lease.status?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {lease.renewalNoticeSent ? (
                            <span className="text-green-600">Sent</span>
                          ) : (
                            <span className="text-red-600">Not Sent</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No lease records found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaseReportsPage;