import React, { useState, useEffect, useMemo } from "react";
import { Link } from 'react-router-dom';
import { BarChart, FileText, Download, Filter, ChevronLeft, Calendar, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Button from "../../components/common/Button";
import DashboardFilters from "../../components/common/DashboardFilters";
import StatusBadge from "../../components/common/StatusBadge";
import Spinner from "../../components/common/Spinner";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { getAllScheduledMaintenance } from "../../services/scheduledMaintenanceService";
import { getAllProperties } from "../../services/propertyService";
import { exportReport } from "../../services/reportService";

// Branding
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const ScheduledMaintenanceReportsPage = () => {
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
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);

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

  // Fetch maintenance tasks when filters change
  useEffect(() => {
    const fetchMaintenanceTasks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Convert filters to API format
        const apiFilters = {
          ...filters,
          status: filters.status === "all" ? undefined : filters.status,
          category: filters.category === "all" ? undefined : filters.category,
        };
        
        const response = await getAllScheduledMaintenance(apiFilters);
        setMaintenanceTasks(response.tasks || []);
      } catch (err) {
        setError("Failed to load maintenance tasks: " + (err.message || "Unknown error"));
        showError("Failed to load maintenance tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceTasks();
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
      
      await exportReport('scheduled_maintenance', format, apiFilters);
      showSuccess(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      showError("Failed to export report: " + (err.message || "Unknown error"));
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!maintenanceTasks?.length) return {
      totalTasks: 0,
      completedTasks: 0,
      upcomingTasks: 0,
      completionRate: '0%'
    };
    
    const total = maintenanceTasks.length;
    const completed = maintenanceTasks.filter(t => t.status === 'completed').length;
    const upcoming = maintenanceTasks.filter(t => 
      ['scheduled', 'assigned'].includes(t.status) && 
      new Date(t.scheduledDate) > new Date()
    ).length;
    
    return {
      totalTasks: total,
      completedTasks: completed,
      upcomingTasks: upcoming,
      completionRate: total ? `${Math.round((completed / total) * 100)}%` : '0%'
    };
  }, [maintenanceTasks]);

  // Group tasks by frequency type for stats
  const tasksByFrequency = useMemo(() => {
    if (!maintenanceTasks?.length) return {};
    
    return maintenanceTasks.reduce((acc, task) => {
      const frequencyType = task.recurring ? (task.frequency?.type || 'custom') : 'one_time';
      if (!acc[frequencyType]) acc[frequencyType] = 0;
      acc[frequencyType]++;
      return acc;
    }, {});
  }, [maintenanceTasks]);

  // Format frequency for display
  const formatFrequency = (task) => {
    if (!task.recurring) return 'One-time';
    if (!task.frequency?.type) return 'Custom';
    
    const type = task.frequency.type;
    const interval = task.frequency.interval || 1;
    
    switch(type) {
      case 'daily': return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case 'weekly': return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case 'monthly': return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      case 'quarterly': return 'Quarterly';
      case 'yearly': return interval === 1 ? 'Yearly' : `Every ${interval} years`;
      default: return 'Custom';
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <div className="mb-6 flex items-center">
        <Link to="/reports" className="mr-4 text-blue-600 hover:text-blue-800 flex items-center">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Calendar className="w-7 h-7 mr-2" style={{ color: SECONDARY_COLOR }} />
          Scheduled Maintenance Reports
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
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Tasks</h3>
          <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Completed Tasks</h3>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.completedTasks}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Upcoming Tasks</h3>
          <p className="text-3xl font-bold" style={{ color: SECONDARY_COLOR }}>{summaryMetrics.upcomingTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Completion Rate</h3>
          <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>{summaryMetrics.completionRate}</p>
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
            "all", "scheduled", "in_progress", "completed", "paused", "cancelled"
          ]}
          showCategoryFilter={true}
          categoryOptions={[
            "all", "plumbing", "electrical", "hvac", "appliance", "structural", "pest", "cleaning", "safety", "general"
          ]}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        />
      </div>
      
      {/* Frequency Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>
          Maintenance Frequency Breakdown
        </h2>
        <div className="overflow-x-auto">
          <div className="flex flex-wrap gap-4">
            {Object.entries(tasksByFrequency).map(([frequency, count]) => (
              <div key={frequency} className="flex flex-col items-center p-3 border rounded-lg" style={{ minWidth: '120px' }}>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {frequency.replace('_', ' ').toUpperCase()}
                </span>
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-xs text-gray-500">{((count / summaryMetrics.totalTasks) * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <FileText className="h-5 w-5 mr-2" style={{ color: SECONDARY_COLOR }} />
          Scheduled Maintenance Tasks
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recurring</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenanceTasks?.length > 0 ? (
                  maintenanceTasks.map((task, index) => (
                    <tr key={task._id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{task.title}</td>
                      <td className="px-4 py-2 text-sm">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-2 text-sm capitalize">{task.category}</td>
                      <td className="px-4 py-2 text-sm">{task.property?.name || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">
                        {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm">{formatFrequency(task)}</td>
                      <td className="px-4 py-2 text-sm">
                        {task.recurring ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No scheduled maintenance tasks found matching the current filters.
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

export default ScheduledMaintenanceReportsPage;