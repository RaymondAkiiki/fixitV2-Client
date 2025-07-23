import React, { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom';
import { BarChart, FileText, Download, Filter, ChevronLeft, Clock, AlertTriangle } from "lucide-react";
import Button from "../../components/common/Button";
import DashboardFilters from "../../components/common/DashboardFilters";
import StatusBadge from "../../components/common/StatusBadge";
import Spinner from "../../components/common/Spinner";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { getMaintenanceSummaryReport, exportReport } from "../../services/reportService";
import { getAllProperties } from "../../services/propertyService";

// Branding
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const MaintenanceReportsPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    propertyId: "",
    status: "all",
    category: "all",
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
          status: filters.status === "all" ? undefined : filters.status,
          category: filters.category === "all" ? undefined : filters.category,
        };
        
        const data = await getMaintenanceSummaryReport(apiFilters);
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
        status: filters.status === "all" ? undefined : filters.status,
        category: filters.category === "all" ? undefined : filters.category,
      };
      
      await exportReport('maintenance_summary', format, apiFilters);
      showSuccess(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      showError("Failed to export report: " + (err.message || "Unknown error"));
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!reportData) return {};
    
    return {
      totalRequests: reportData.requests?.length || 0,
      openRequests: reportData.requests?.filter(r => 
        ['new', 'assigned', 'in_progress', 'reopened'].includes(r.status?.toLowerCase())
      ).length || 0,
      avgResolutionTime: reportData.avgResolutionTimeHours 
        ? `${Math.round(reportData.avgResolutionTimeHours)} hours` 
        : 'N/A',
      mostCommonCategory: reportData.mostCommonCategory || 'N/A',
    };
  }, [reportData]);

  // Group requests by status for stats
  const requestsByStatus = useMemo(() => {
    if (!reportData?.requests) return {};
    
    return reportData.requests.reduce((acc, request) => {
      const status = request.status?.toLowerCase() || 'unknown';
      if (!acc[status]) acc[status] = 0;
      acc[status]++;
      return acc;
    }, {});
  }, [reportData]);

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <div className="mb-6 flex items-center">
        <Link to="/reports" className="mr-4 text-blue-600 hover:text-blue-800 flex items-center">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold flex items-center" style={{ color: PRIMARY_COLOR }}>
          <BarChart className="w-7 h-7 mr-2" style={{ color: SECONDARY_COLOR }} />
          Maintenance Reports
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
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Requests</h3>
          <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.totalRequests}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Open Requests</h3>
          <p className="text-3xl font-bold" style={{ color: SECONDARY_COLOR }}>{summaryMetrics.openRequests}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Avg. Resolution Time</h3>
          <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.avgResolutionTime}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Most Common Issue</h3>
          <p className="text-3xl font-bold" style={{ color: SECONDARY_COLOR }}>{summaryMetrics.mostCommonCategory}</p>
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

        <DashboardFilters
          filters={filters}
          setFilters={setFilters}
          properties={properties}
          showDateRangeFilter={true}
          showPropertyFilter={true}
          showStatusFilter={true}
          statusOptions={[
            "all", "new", "assigned", "in_progress", "completed", "verified", "reopened", "archived"
          ]}
          showCategoryFilter={true}
          categoryOptions={[
            "all", "plumbing", "electrical", "hvac", "appliance", "structural", "pest", "cleaning", "safety", "general"
          ]}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        />
      </div>
      
      {/* Status Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>
          Request Status Breakdown
        </h2>
        <div className="overflow-x-auto">
          <div className="flex flex-wrap gap-4">
            {Object.entries(requestsByStatus).map(([status, count]) => (
              <div key={status} className="flex flex-col items-center p-3 border rounded-lg" style={{ minWidth: '120px' }}>
                <StatusBadge status={status} />
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-xs text-gray-500">{((count / summaryMetrics.totalRequests) * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <FileText className="h-5 w-5 mr-2" style={{ color: SECONDARY_COLOR }} />
          Maintenance Request Details
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
            <span className="ml-2">Loading report data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resolution Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.requests?.length > 0 ? (
                  reportData.requests.map((request, index) => (
                    <tr key={request._id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{request.title}</td>
                      <td className="px-4 py-2 text-sm">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-2 text-sm capitalize">{request.category}</td>
                      <td className="px-4 py-2 text-sm">{request.property?.name || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {request.resolutionTime ? (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            {request.resolutionTime < 24 
                              ? `${request.resolutionTime} hours` 
                              : `${Math.round(request.resolutionTime/24)} days`}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No maintenance requests found matching the current filters.
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

export default MaintenanceReportsPage;