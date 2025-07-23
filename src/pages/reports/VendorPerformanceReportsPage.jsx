import React, { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom';
import { BarChart, FileText, Download, Filter, ChevronLeft, Users, AlertTriangle, Star, Clock } from "lucide-react";
import Button from "../../components/common/Button";
import DashboardFilters from "../../components/common/DashboardFilters";
import Spinner from "../../components/common/Spinner";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { getVendorPerformanceReport, exportReport } from "../../services/reportService";
import { getAllProperties } from "../../services/propertyService";

// Branding
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const VendorPerformanceReportsPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    propertyId: "",
    serviceType: "all",
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
          serviceType: filters.serviceType === "all" ? undefined : filters.serviceType,
        };
        
        const data = await getVendorPerformanceReport(apiFilters);
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
        serviceType: filters.serviceType === "all" ? undefined : filters.serviceType,
      };
      
      await exportReport('vendor_performance', format, apiFilters);
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
    
    const totalVendors = reportData.vendors?.length || 0;
    const totalCompletedJobs = reportData.vendors?.reduce((acc, vendor) => 
      acc + (vendor.completedJobs || 0), 0) || 0;
    
    const avgRating = reportData.vendors?.length 
      ? reportData.vendors.reduce((acc, vendor) => acc + (vendor.averageRating || 0), 0) / reportData.vendors.length
      : 0;
    
    return {
      totalVendors,
      totalCompletedJobs,
      avgRating: avgRating.toFixed(1),
      topVendor: reportData.topPerformingVendor?.name || 'N/A'
    };
  }, [reportData]);

  // Rating component
  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < fullStars ? 'text-yellow-400 fill-yellow-400' : 
              (i === fullStars && hasHalfStar ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')}`} 
          />
        ))}
        <span className="ml-1 text-sm">{rating}</span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <div className="mb-6 flex items-center">
        <Link to="/reports" className="mr-4 text-blue-600 hover:text-blue-800 flex items-center">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Users className="w-7 h-7 mr-2" style={{ color: SECONDARY_COLOR }} />
          Vendor Performance Reports
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
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Vendors</h3>
          <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.totalVendors}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Completed Jobs</h3>
          <p className="text-3xl font-bold" style={{ color: SECONDARY_COLOR }}>{summaryMetrics.totalCompletedJobs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Average Rating</h3>
          <div className="flex items-center">
            <p className="text-3xl font-bold mr-2" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.avgRating}</p>
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Top Vendor</h3>
          <p className="text-3xl font-bold truncate" style={{ color: SECONDARY_COLOR }}>{summaryMetrics.topVendor}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="border border-gray-300 rounded-md p-2 text-sm"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
          </div>
          
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="all">All Services</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
              <option value="general">General Maintenance</option>
              <option value="cleaning">Cleaning</option>
              <option value="landscaping">Landscaping</option>
              <option value="pest_control">Pest Control</option>
              <option value="security">Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendor Performance Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <FileText className="h-5 w-5 mr-2" style={{ color: SECONDARY_COLOR }} />
          Vendor Performance Details
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed Jobs</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg. Response Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">On-Time Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.vendors?.length > 0 ? (
                  reportData.vendors.map((vendor, index) => (
                    <tr key={vendor._id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium">{vendor.name}</td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {vendor.services?.map(service => (
                            <span key={service} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {service}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <StarRating rating={vendor.averageRating || 0} />
                      </td>
                      <td className="px-4 py-2 text-sm">{vendor.completedJobs || 0}</td>
                      <td className="px-4 py-2 text-sm">
                        {vendor.avgResponseTime ? (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            {vendor.avgResponseTime < 24 
                              ? `${vendor.avgResponseTime} hours` 
                              : `${Math.round(vendor.avgResponseTime / 24)} days`}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className={`font-medium ${
                          (vendor.onTimeRate || 0) >= 90 ? 'text-green-600' : 
                          (vendor.onTimeRate || 0) >= 75 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {vendor.onTimeRate?.toFixed(1) || 0}%
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No vendor data found matching the current filters.
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

export default VendorPerformanceReportsPage;