import React, { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom';
import { BarChart, FileText, Download, Filter, ChevronLeft, DollarSign, AlertTriangle, PieChart } from "lucide-react";
import Button from "../../components/common/Button";
import DashboardFilters from "../../components/common/DashboardFilters";
import Spinner from "../../components/common/Spinner";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { getRentCollectionReport, exportReport } from "../../services/reportService";
import { getAllProperties } from "../../services/propertyService";

// Branding
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const RentReportsPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    propertyId: "",
    status: "all",
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
        };
        
        const data = await getRentCollectionReport(apiFilters);
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
      };
      
      await exportReport('rent_collection', format, apiFilters);
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
      totalRentRecords: 0,
      totalCollected: 0,
      collectionRate: '0%',
      overdueAmount: 0
    };
    
    const totalRentRecords = reportData.rentRecords?.length || 0;
    const totalCollected = reportData.totalCollected || 0;
    const collectionRate = reportData.collectionRate 
      ? `${reportData.collectionRate.toFixed(1)}%` 
      : '0%';
    const overdueAmount = reportData.overdueAmount || 0;
    
    return {
      totalRentRecords,
      totalCollected,
      collectionRate,
      overdueAmount
    };
  }, [reportData]);

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <div className="mb-6 flex items-center">
        <Link to="/reports" className="mr-4 text-blue-600 hover:text-blue-800 flex items-center">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold flex items-center" style={{ color: PRIMARY_COLOR }}>
          <DollarSign className="w-7 h-7 mr-2" style={{ color: SECONDARY_COLOR }} />
          Rent Collection Reports
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
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Rent Records</h3>
          <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.totalRentRecords}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Collected</h3>
          <p className="text-3xl font-bold" style={{ color: SECONDARY_COLOR }}>
            {formatCurrency(summaryMetrics.totalCollected)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Collection Rate</h3>
          <div className="flex items-center">
            <PieChart className="w-6 h-6 mr-2 text-blue-500" />
            <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.collectionRate}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Overdue Amount</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(summaryMetrics.overdueAmount)}</p>
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
            "all", "paid", "due", "partially_paid", "overdue"
          ]}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        />
      </div>

      {/* Payment Status Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>
          Payment Status Breakdown
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <Spinner />
            <span className="ml-2">Loading status data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {reportData?.statusBreakdown ? (
              Object.entries(reportData.statusBreakdown).map(([status, count]) => (
                <div key={status} className="border rounded-lg p-4 text-center">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs capitalize mb-2 ${
                    status === 'paid' ? 'bg-green-100 text-green-800' :
                    status === 'due' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                    status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {status.replace('_', ' ')}
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500">
                    {reportData.rentRecords?.length 
                      ? ((count / reportData.rentRecords.length) * 100).toFixed(1) + '%' 
                      : '0%'}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-4">
                No status breakdown data available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Property Collection Performance */}
      {reportData?.propertyPerformance && reportData.propertyPerformance.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>
            Property Collection Performance
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Due</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.propertyPerformance.map((property, index) => (
                  <tr key={property.propertyId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{property.propertyName || 'Unknown Property'}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(property.totalDue || 0)}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(property.collected || 0)}</td>
                    <td className="px-4 py-2 text-sm">{formatCurrency(property.outstanding || 0)}</td>
                    <td className="px-4 py-2 text-sm">
                      <div className={`font-medium ${
                        (property.collectionRate || 0) >= 90 ? 'text-green-600' : 
                        (property.collectionRate || 0) >= 75 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {property.collectionRate?.toFixed(1) || 0}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rent Records Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <FileText className="h-5 w-5 mr-2" style={{ color: SECONDARY_COLOR }} />
          Rent Records
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
            <span className="ml-2">Loading rent records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property/Unit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.rentRecords?.length > 0 ? (
                  reportData.rentRecords.map((rent, index) => (
                    <tr key={rent._id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        {rent.dueDate ? new Date(rent.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {rent.tenant ? `${rent.tenant.firstName || ''} ${rent.tenant.lastName || ''}`.trim() : 'Unknown'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {rent.property?.name || 'Unknown'} / {rent.unit?.unitName || 'Unknown'}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {formatCurrency(rent.amountDue || 0, rent.currency || 'USD')}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {formatCurrency(rent.amountPaid || 0, rent.currency || 'USD')}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {formatCurrency(Math.max(0, (rent.amountDue || 0) - (rent.amountPaid || 0)), rent.currency || 'USD')}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs capitalize ${
                          rent.status === 'paid' ? 'bg-green-100 text-green-800' :
                          rent.status === 'due' ? 'bg-yellow-100 text-yellow-800' :
                          rent.status === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                          rent.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rent.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {rent.paymentDate ? new Date(rent.paymentDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No rent records found matching the current filters.
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

export default RentReportsPage;