// frontend/src/pages/pm/ReportsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import DashboardFilters from "../../components/common/DashboardFilters"; // Reusing for report filters
import { BarChart, FileText, Download, Filter } from "lucide-react";

// Import relevant services for data fetching for reports
import { getAllRequests } from "../../services/requestService";
import { getAllScheduledMaintenance } from "../../services/scheduledMaintenanceService";
import { getAllProperties } from "../../services/propertyService";
import { getAllVendors } from "../../services/vendorService";
import { getAllUsers } from "../../services/userService";

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * ReportsPage component for Property Managers to generate and view various reports.
 * This page includes filtering options and displays summarized data.
 */
function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('request_summary'); // Default report type
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    propertyId: "",
    status: "all", // For requests/maintenance
    category: "all", // For requests/maintenance
    role: "all", // For user reports
  });
  const [properties, setProperties] = useState([]);
  const [data, setData] = useState({
    requests: [],
    scheduledMaintenance: [],
    properties: [],
    vendors: [],
    users: [],
  });
  const [reportData, setReportData] = useState(null); // The processed data for the active report

  // Report Type Options
  const reportOptions = [
    { value: 'request_summary', label: 'Service Request Summary' },
    { value: 'maintenance_overview', label: 'Scheduled Maintenance Overview' },
    { value: 'property_health', label: 'Property Health Metrics' },
    { value: 'user_directory', label: 'User Directory' },
    { value: 'vendor_performance', label: 'Vendor Performance' },
    // Add more report types as needed
  ];

  // Fetch initial filter data (properties, etc.)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const propertiesData = await getAllProperties();
        setProperties(propertiesData);
      } catch (err) {
        console.error("Failed to load initial data for filters:", err);
      }
    }
    fetchInitialData();
  }, []);

  // Fetch raw data when filters or report type change
  const fetchDataForReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        requestsData,
        scheduledMaintenanceData,
        propertiesData,
        vendorsData,
        usersData,
      ] = await Promise.all([
        getAllRequests(), // Fetch all to allow client-side filtering/aggregation for reports
        getAllScheduledMaintenance(),
        getAllProperties(),
        getAllVendors(),
        getAllUsers(),
      ]);

      setData({
        requests: requestsData,
        scheduledMaintenance: scheduledMaintenanceData?.tasks || [],
        properties: propertiesData,
        vendors: vendorsData,
        users: usersData,
      });

    } catch (err) {
      setError("Failed to fetch data for reports. " + (err.response?.data?.message || err.message));
      console.error("Fetch data for reports error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataForReports();
  }, [fetchDataForReports]);

  // Process data into reports whenever raw data or filters change
  useEffect(() => {
    if (!loading && !error) {
      generateReport();
    }
  }, [data, reportType, filters, loading, error]); // Re-generate report when dependencies change

  const generateReport = () => {
    let processedData = {};

    // Apply date range filter first for time-sensitive reports
    const filteredByDate = (items, dateField = 'createdAt') => {
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      return items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return (!start || itemDate >= start) && (!end || itemDate <= end);
      });
    };

    switch (reportType) {
      case 'request_summary':
        let filteredRequests = filteredByDate(data.requests, 'createdAt');
        if (filters.propertyId && filters.propertyId !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.property?._id === filters.propertyId);
        }
        if (filters.status && filters.status !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.status === filters.status);
        }
        if (filters.category && filters.category !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.category === filters.category);
        }

        const requestCounts = filteredRequests.reduce((acc, req) => {
          acc[req.status] = (acc[req.status] || 0) + 1;
          return acc;
        }, {});

        processedData = {
          totalRequests: filteredRequests.length,
          requestsByStatus: requestCounts,
          // You could add average resolution time, top categories, etc.
        };
        break;

      case 'maintenance_overview':
        let filteredMaintenance = filteredByDate(data.scheduledMaintenance, 'scheduledDate');
        if (filters.propertyId && filters.propertyId !== 'all') {
          filteredMaintenance = filteredMaintenance.filter(task => task.property?._id === filters.propertyId);
        }
        if (filters.status && filters.status !== 'all') {
          filteredMaintenance = filteredMaintenance.filter(task => task.status === filters.status);
        }
        if (filters.category && filters.category !== 'all') {
            filteredMaintenance = filteredMaintenance.filter(task => task.category === filters.category);
        }

        const maintenanceCounts = filteredMaintenance.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {});

        processedData = {
          totalTasks: filteredMaintenance.length,
          tasksByStatus: maintenanceCounts,
          upcomingTasks: filteredMaintenance.filter(task => new Date(task.scheduledDate) > new Date()).length,
        };
        break;

      case 'property_health':
        // This report would aggregate data per property
        const propertyMetrics = data.properties.map(prop => {
          const propRequests = data.requests.filter(req => req.property?._id === prop._id);
          const propCompletedRequests = propRequests.filter(req => req.status === 'completed' || req.status === 'verified').length;
          const propActiveRequests = propRequests.filter(req => req.status !== 'completed' && req.status !== 'verified' && req.status !== 'archived').length;
          const propUnits = data.units?.filter(unit => unit.property === prop._id); // Assuming units are available in data.units
          const totalUnits = prop.units?.length || 0; // Use prop.units if populated
          const occupiedUnits = prop.units?.filter(unit => unit.tenants?.length > 0).length || 0;

          return {
            propertyName: prop.name,
            totalUnits: totalUnits,
            occupiedUnits: occupiedUnits,
            occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits * 100).toFixed(1) + '%' : 'N/A',
            totalRequests: propRequests.length,
            activeRequests: propActiveRequests,
            completedRequests: propCompletedRequests,
            // Could add average resolution time for this property
          };
        }).filter(prop => !filters.propertyId || filters.propertyId === 'all' || prop.propertyId === filters.propertyId); // Filter property list by property filter

        processedData = {
            propertyMetrics: propertyMetrics
        };
        break;

      case 'user_directory':
        let filteredUsers = data.users;
        if (filters.role && filters.role !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === filters.role);
        }
        // You might need to filter by propertyId for users if they are directly associated in the User model
        // For PropertyUser model driven associations, this is more complex.
        // For simplicity, we'll just show directory of users the PM can see.
        processedData = {
          totalUsers: filteredUsers.length,
          users: filteredUsers.map(user => ({
            name: user.name || user.email,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
            // Summarize associations here if desired
          })),
        };
        break;

      case 'vendor_performance':
        // This is a complex report, often needing aggregated data from 'requests'
        // For now, a simplified overview.
        const vendorPerformance = data.vendors.map(vendor => {
          const vendorRequests = data.requests.filter(req =>
            req.assignedTo?._id === vendor._id && req.assignedToModel === 'Vendor'
          );
          const completedRequests = vendorRequests.filter(req => req.status === 'completed' || req.status === 'verified').length;
          const pendingRequests = vendorRequests.filter(req => req.status === 'assigned' || req.status === 'in_progress').length;

          // Placeholder for actual performance metrics (e.g., avg time to complete)
          // To calculate average time, you need `assignedAt` and `completedAt` timestamps on requests.
          const avgCompletionTime = 'N/A'; // Placeholder

          return {
            vendorName: vendor.name,
            totalAssignedRequests: vendorRequests.length,
            completedRequests: completedRequests,
            pendingRequests: pendingRequests,
            avgCompletionTime: avgCompletionTime,
            services: vendor.services?.join(', ') || 'N/A',
          };
        });

        processedData = {
          vendorPerformance: vendorPerformance,
        };
        break;

      default:
        processedData = { message: "Select a report type to generate." };
    }
    setReportData(processedData);
  };

  // Helper for status badge styling
  const getStatusBadgeClass = (status) => {
    const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
    switch (status?.toLowerCase()) {
      case "new": return `${base} bg-blue-100 text-blue-800`;
      case "assigned": return `${base} bg-purple-100 text-purple-800`;
      case "in_progress": return `${base} bg-yellow-100 text-yellow-800`;
      case "completed": return `${base} bg-green-100 text-green-800`;
      case "verified": return `${base} bg-teal-100 text-teal-800`;
      case "reopened": return `${base} bg-orange-100 text-orange-800`;
      case "archived": return `${base} bg-gray-200 text-gray-800`;
      case "canceled": return `${base} bg-red-100 text-red-800`;
      case "scheduled": return `${base} bg-indigo-100 text-indigo-800`;
      default: return `${base} bg-gray-100 text-gray-800`;
    }
  };

  const handleExportReport = () => {
    if (!reportData) {
      showMessage("No report data to export.", 'error');
      return;
    }

    let csvContent = "";
    let fileName = `${reportType}_report.csv`;

    switch (reportType) {
      case 'request_summary':
        csvContent = "Status,Count\n";
        for (const status in reportData.requestsByStatus) {
          csvContent += `${status},${reportData.requestsByStatus[status]}\n`;
        }
        csvContent += `Total Requests,${reportData.totalRequests}\n`;
        break;
      case 'maintenance_overview':
        csvContent = "Status,Count\n";
        for (const status in reportData.tasksByStatus) {
            csvContent += `${status},${reportData.tasksByStatus[status]}\n`;
        }
        csvContent += `Total Tasks,${reportData.totalTasks}\n`;
        csvContent += `Upcoming Tasks,${reportData.upcomingTasks}\n`;
        break;
      case 'property_health':
        csvContent = "Property Name,Total Units,Occupied Units,Occupancy Rate,Total Requests,Active Requests,Completed Requests\n";
        reportData.propertyMetrics.forEach(metric => {
          csvContent += `"${metric.propertyName}",${metric.totalUnits},${metric.occupiedUnits},"${metric.occupancyRate}",${metric.totalRequests},${metric.activeRequests},${metric.completedRequests}\n`;
        });
        break;
      case 'user_directory':
        csvContent = "Name,Email,Role,Approved\n";
        reportData.users.forEach(user => {
          csvContent += `"${user.name}","${user.email}","${user.role}",${user.isApproved ? 'Yes' : 'No'}\n`;
        });
        break;
      case 'vendor_performance':
        csvContent = "Vendor Name,Total Assigned Requests,Completed Requests,Pending Requests,Avg Completion Time,Services\n";
        reportData.vendorPerformance.forEach(vendor => {
          csvContent += `"${vendor.vendorName}",${vendor.totalAssignedRequests},${vendor.completedRequests},${vendor.pendingRequests},"${vendor.avgCompletionTime}","${vendor.services}"\n`;
        });
        break;
      default:
        showMessage("Export not supported for this report type.", 'error');
        return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showMessage("Report exported successfully!", 'success');
    } else {
        showMessage("Your browser does not support downloading files directly. Please copy the content manually.", 'info');
        // Fallback for older browsers: open new window with content
        window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    }
  };


  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <BarChart className="w-8 h-8 mr-3 text-green-700" />
          Reports & Analytics
        </h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
            <Filter className="w-6 h-6 mr-2 text-blue-600" />
            Report Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">Select Report Type:</label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {reportOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Filters based on report type */}
          <DashboardFilters
            filters={filters}
            setFilters={setFilters}
            properties={properties}
            showDateRangeFilter={reportType.includes('request') || reportType.includes('maintenance') || reportType.includes('vendor_performance')}
            showPropertyFilter={reportType.includes('request') || reportType.includes('maintenance') || reportType.includes('property_health')}
            showStatusFilter={reportType.includes('request') || reportType.includes('maintenance')}
            statusOptions={reportType.includes('request') ? ['all', 'new', 'assigned', 'in_progress', 'completed', 'verified', 'reopened', 'archived'] :
                            reportType.includes('maintenance') ? ['all', 'scheduled', 'in_progress', 'completed', 'canceled'] : []}
            showCategoryFilter={reportType.includes('request') || reportType.includes('maintenance')}
            showRoleFilter={reportType === 'user_directory'}
            roleOptions={['all', 'tenant', 'landlord', 'propertymanager', 'vendor', 'admin']}
          />

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleExportReport}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
              disabled={loading || !reportData || Object.keys(reportData).length === 0}
            >
              <Download className="w-5 h-5 mr-2" /> Export Report (CSV)
            </Button>
          </div>
        </div>

        {/* Report Display Area */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-green-700" />
            Generated Report
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-600">Generating report...</p>
            </div>
          ) : !reportData ? (
            <p className="text-gray-600 italic text-center py-6">Select a report type and apply filters to see the generated report here.</p>
          ) : (
            <div className="report-content-display">
              {reportType === 'request_summary' && reportData.totalRequests !== undefined && (
                <div>
                  <h3 className="text-xl font-bold mb-3">Service Request Summary</h3>
                  <p className="mb-3">Total Requests: <span className="font-semibold">{reportData.totalRequests}</span></p>
                  <h4 className="font-semibold mb-2">Requests by Status:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {Object.entries(reportData.requestsByStatus).map(([status, count]) => (
                      <li key={status} className="flex items-center">
                        <StatusBadge status={status} />
                        <span className="ml-2 capitalize">{status.replace(/_/g, ' ')}:</span>
                        <span className="ml-2 font-semibold">{count}</span>
                      </li>
                    ))}
                  </ul>
                  {reportData.totalRequests === 0 && <p className="italic text-gray-600 mt-4">No requests found for the selected filters.</p>}
                </div>
              )}

              {reportType === 'maintenance_overview' && reportData.totalTasks !== undefined && (
                <div>
                  <h3 className="text-xl font-bold mb-3">Scheduled Maintenance Overview</h3>
                  <p className="mb-3">Total Tasks: <span className="font-semibold">{reportData.totalTasks}</span></p>
                  <p className="mb-3">Upcoming Tasks: <span className="font-semibold">{reportData.upcomingTasks}</span></p>
                  <h4 className="font-semibold mb-2">Tasks by Status:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {Object.entries(reportData.tasksByStatus).map(([status, count]) => (
                      <li key={status} className="flex items-center">
                        <span className="ml-2 capitalize">{status.replace(/_/g, ' ')}:</span>
                        <span className="ml-2 font-semibold">{count}</span>
                      </li>
                    ))}
                  </ul>
                  {reportData.totalTasks === 0 && <p className="italic text-gray-600 mt-4">No maintenance tasks found for the selected filters.</p>}
                </div>
              )}

              {reportType === 'property_health' && reportData.propertyMetrics && (
                <div>
                  <h3 className="text-xl font-bold mb-3">Property Health Metrics</h3>
                  {reportData.propertyMetrics.length === 0 ? (
                    <p className="italic text-gray-600">No property metrics found for the selected filters.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Units</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Occupied Units</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Occupancy Rate</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Requests</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active Requests</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed Requests</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.propertyMetrics.map((metric, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{metric.propertyName}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metric.totalUnits}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metric.occupiedUnits}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metric.occupancyRate}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metric.totalRequests}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metric.activeRequests}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{metric.completedRequests}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {reportType === 'user_directory' && reportData.users && (
                <div>
                  <h3 className="text-xl font-bold mb-3">User Directory</h3>
                  <p className="mb-3">Total Users: <span className="font-semibold">{reportData.totalUsers}</span></p>
                  {reportData.users.length === 0 ? (
                    <p className="italic text-gray-600">No users found for the selected filters.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.users.map((user, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 capitalize">{user.role}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    user.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {user.isApproved ? 'Yes' : 'No'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {reportType === 'vendor_performance' && reportData.vendorPerformance && (
                <div>
                  <h3 className="text-xl font-bold mb-3">Vendor Performance Overview</h3>
                  {reportData.vendorPerformance.length === 0 ? (
                    <p className="italic text-gray-600">No vendor performance data found for the selected filters.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Assigned Requests</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed Requests</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pending Requests</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg. Completion Time</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.vendorPerformance.map((vendor, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.vendorName}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor.totalAssignedRequests}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor.completedRequests}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor.pendingRequests}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{vendor.avgCompletionTime}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{vendor.services}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Default message if no report type selected or no data */}
              {!reportType && !reportData && (
                <p className="text-gray-600 italic text-center py-6">Select a report type to begin.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </PropertyManagerLayout>
  );
}

export default ReportsPage;
