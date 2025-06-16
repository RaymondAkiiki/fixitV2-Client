// frontend/src/pages/pm/ScheduledMaintenancePage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal"; // Assuming a generic Modal component
import DashboardFilters from "../../components/common/DashboardFilters"; // Assuming a generic DashboardFilters component
import { FileArchive, PlusCircle, CalendarDays, Search } from "lucide-react";

// Import updated service functions
import { getAllScheduledMaintenance, deleteScheduledMaintenance, updateScheduledMaintenance } from "../../services/scheduledMaintenanceService";
import { getAllProperties } from "../../services/propertyService"; // To populate property filter

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

// Reusable status badge for Scheduled Maintenance
const StatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case "scheduled": return <span className={`${base} bg-blue-100 text-blue-800`}>{status.replace(/_/g, ' ')}</span>;
    case "in_progress": return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status.replace(/_/g, ' ')}</span>;
    case "completed": return <span className={`${base} bg-green-100 text-green-800`}>{status.replace(/_/g, ' ')}</span>;
    case "canceled": return <span className={`${base} bg-red-100 text-red-800`}>{status.replace(/_/g, ' ')}</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-800`}>{status.replace(/_/g, ' ')}</span>;
  }
};

/**
 * ScheduledMaintenancePage component for Property Managers to view and manage
 * scheduled maintenance tasks. Includes filtering and quick actions.
 */
function ScheduledMaintenancePage() {
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    propertyId: "",
    unitId: "",
    status: "", // e.g., scheduled, in_progress, completed, canceled
    category: "",
    startDate: "", // For date range filtering
    endDate: ""
  });
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]); // Units for selected property filter

  const navigate = useNavigate();

  // Fetch initial data (properties)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const propertiesData = await getAllProperties();
        setProperties(propertiesData);
      } catch (err) {
        setError("Failed to load filter options.");
        console.error("Initial data fetch error:", err);
      }
    }
    fetchInitialData();
  }, []);

  // Fetch maintenance tasks based on filters
  const fetchMaintenanceTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: filters.search,
        propertyId: filters.propertyId,
        unitId: filters.unitId,
        status: filters.status === "all" ? undefined : filters.status,
        category: filters.category,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      // Backend's getAllScheduledMaintenance should filter by PM's property associations
      const data = await getAllScheduledMaintenance(params);
      setMaintenanceTasks(Array.isArray(data.tasks) ? data.tasks : []); // Access 'tasks' property
    } catch (err) {
      setError("Failed to load scheduled maintenance tasks.");
      setMaintenanceTasks([]);
      console.error("Fetch maintenance tasks error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Memoize based on filters

  useEffect(() => {
    fetchMaintenanceTasks();
  }, [fetchMaintenanceTasks]); // Call memoized function

  // Update units when property filter changes
  useEffect(() => {
    if (filters.propertyId) {
      const selectedProperty = properties.find(p => p._id === filters.propertyId);
      setUnits(selectedProperty?.units || []);
    } else {
      setUnits([]);
      setFilters(prev => ({ ...prev, unitId: "" })); // Clear unit filter if no property selected
    }
  }, [filters.propertyId, properties]);

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this scheduled maintenance task? This action cannot be undone.")) {
      try {
        await deleteScheduledMaintenance(taskId);
        showMessage("Task deleted successfully!", 'success');
        fetchMaintenanceTasks(); // Refresh the list
      } catch (err) {
        showMessage("Failed to delete task: " + (err.response?.data?.message || err.message), 'error');
        console.error("Delete task error:", err);
      }
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    if (window.confirm(`Are you sure you want to change this task's status to "${newStatus.replace(/_/g, ' ')}"?`)) {
        try {
            await updateScheduledMaintenance(taskId, { status: newStatus });
            showMessage(`Task status updated to "${newStatus.replace(/_/g, ' ')}"!`, 'success');
            fetchMaintenanceTasks(); // Refresh the list
        } catch (err) {
            showMessage("Failed to update task status: " + (err.response?.data?.message || err.message), 'error');
            console.error("Update task status error:", err);
        }
    }
  };


  if (loading && maintenanceTasks.length === 0) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-xl text-gray-600">Loading scheduled maintenance tasks...</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <FileArchive className="w-8 h-8 mr-3 text-green-700" />
          Scheduled Maintenance
        </h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button
            onClick={() => navigate('/pm/scheduled-maintenance/add')}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Schedule New Task
          </Button>
        </div>

        {/* Filters */}
        <DashboardFilters
          filters={filters}
          setFilters={setFilters}
          properties={properties}
          units={units}
          showPropertyFilter={true}
          showUnitFilter={true}
          showCategoryFilter={true}
          showSearch={true}
          showStatusFilter={true} // New filter for maintenance status
          statusOptions={['all', 'scheduled', 'in_progress', 'completed', 'canceled']} // Define options specific to maintenance
          showDateRangeFilter={true} // New filter for date range
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading tasks...</p>
          </div>
        ) : maintenanceTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600 italic">
            <p className="text-lg mb-4">No scheduled maintenance tasks found matching your criteria.</p>
            <p>Click "Schedule New Task" to add one!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenanceTasks.map((task) => (
                  <tr key={task._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/pm/scheduled-maintenance/${task._id}`} className="text-green-600 hover:underline">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {task.property?.name || 'N/A'} {task.unit?.unitName ? `(${task.unit.unitName})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(task.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{task.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/pm/scheduled-maintenance/${task._id}`} className="text-blue-600 hover:text-blue-800 mr-3">View</Link>
                      <Link to={`/pm/scheduled-maintenance/edit/${task._id}`} className="text-yellow-600 hover:text-yellow-800 mr-3">Edit</Link>
                      <select
                          onChange={e => handleUpdateStatus(task._id, e.target.value)}
                          value={task.status} // Controlled select for current status
                          className="px-2 py-1 border border-gray-300 rounded-md text-xs mr-3"
                      >
                          {['scheduled', 'in_progress', 'completed', 'canceled'].map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                      </select>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PropertyManagerLayout>
  );
}

export default ScheduledMaintenancePage;
