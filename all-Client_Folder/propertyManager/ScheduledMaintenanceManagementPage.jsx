// frontend/src/pages/pm/ScheduledMaintenanceManagementPage.jsx

import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";

// Service imports
import { getAllScheduledMaintenance, createScheduledMaintenance, updateScheduledMaintenance, deleteScheduledMaintenance } from "../../services/scheduledMaintenanceService";
import { getAllProperties } from "../../services/propertyService";
import { getAllVendors } from "../../services/vendorService";
import { getAllUsers } from "../../services/userService";

// Icons
import { PlusCircle, Search, CalendarCheck, Edit, Trash2, Eye } from 'lucide-react';

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Keeping alert for now
};

/**
 * ScheduledMaintenanceManagementPage provides a comprehensive view and management interface for
 * all scheduled maintenance tasks associated with the Property Manager's properties.
 */
function ScheduledMaintenanceManagementPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]); // For filter dropdown
  const [vendors, setVendors] = useState([]); // For assignment dropdown
  const [internalUsers, setInternalUsers] = useState([]); // For internal user assignment dropdown

  // State for filters and pagination
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterProperty, setFilterProperty] = useState(searchParams.get('propertyId') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterSearch, setFilterSearch] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTasks, setTotalTasks] = useState(0);

  // State for Add Task Modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", category: "", property: "", unit: "", scheduledDate: "", recurring: false, frequency: {} });
  const [addTaskError, setAddTaskError] = useState("");
  const [unitsForAddTask, setUnitsForAddTask] = useState([]);

  // State for Edit Task Modal
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({ title: "", description: "", category: "", property: "", unit: "", scheduledDate: "", recurring: false, frequency: {}, status: "" });
  const [editTaskError, setEditTaskError] = useState("");
  const [unitsForEditTask, setUnitsForEditTask] = useState([]);


  const maintenanceStatuses = ['scheduled', 'in_progress', 'completed', 'canceled'];
  const maintenanceCategories = ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'landscaping', 'other', 'cleaning', 'security', 'pest_control']; // Matches request categories

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTasks();
    const newParams = {};
    if (filterStatus) newParams.status = filterStatus;
    if (filterProperty) newParams.propertyId = filterProperty;
    if (filterSearch) newParams.search = filterSearch;
    newParams.page = currentPage;
    newParams.limit = itemsPerPage;
    setSearchParams(newParams);
  }, [filterStatus, filterProperty, filterSearch, currentPage, itemsPerPage]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const propertiesData = await getAllProperties();
      setProperties(propertiesData);
      const vendorsData = await getAllVendors();
      setVendors(vendorsData);
      const allUsers = await getAllUsers();
      const assignableRoles = ['propertymanager', 'landlord', 'admin', 'vendor'];
      setInternalUsers(allUsers.filter(user => assignableRoles.includes(user.role)));

    } catch (err) {
      setError('Failed to load initial data: ' + (err.response?.data?.message || err.message));
      console.error("Initial data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: filterStatus || undefined,
        propertyId: filterProperty || undefined,
        search: filterSearch || undefined,
        page: currentPage,
        limit: itemsPerPage,
      };
      const res = await getAllScheduledMaintenance(params);
      setTasks(res.tasks || []);
      setTotalTasks(res.total || 0);
    } catch (err) {
      setError('Failed to fetch scheduled maintenance tasks: ' + (err.response?.data?.message || err.message));
      console.error("Fetch tasks error:", err);
      setTasks([]);
      setTotalTasks(0);
    } finally {
      setLoading(false);
    }
  };

  // --- Add Task Handlers ---
  const handleAddTaskFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'property' && value) {
        const selectedProperty = properties.find(p => p._id === value);
        setUnitsForAddTask(selectedProperty?.units || []);
        setTaskForm(prev => ({ ...prev, unit: '' })); // Reset unit when property changes
    } else if (name === 'property' && !value) {
        setUnitsForAddTask([]);
        setTaskForm(prev => ({ ...prev, unit: '' }));
    }
  };

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    setAddTaskError("");
    try {
      await createScheduledMaintenance(taskForm);
      showMessage("Scheduled maintenance task added!", 'success');
      setShowAddTaskModal(false);
      setTaskForm({ title: "", description: "", category: "", property: "", unit: "", scheduledDate: "", recurring: false, frequency: {} });
      fetchTasks();
    } catch (err) {
      setAddTaskError("Failed to add scheduled maintenance: " + (err.response?.data?.message || err.message));
      console.error("Add task error:", err);
    }
  };

  // --- Edit Task Handlers ---
  const handleOpenEditTaskModal = (task) => {
    setEditingTaskId(task._id);
    setEditTaskForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "",
      property: task.property?._id || "",
      unit: task.unit?._id || "",
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate).toISOString().split('T')[0] : "", // Format for input type="date"
      recurring: task.recurring || false,
      frequency: task.frequency || {},
      status: task.status || "",
    });
    const selectedProperty = properties.find(p => p._id === (task.property?._id || task.property));
    setUnitsForEditTask(selectedProperty?.units || []);
    setShowEditTaskModal(true);
  };

  const handleEditTaskFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditTaskForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'property' && value) {
        const selectedProperty = properties.find(p => p._id === value);
        setUnitsForEditTask(selectedProperty?.units || []);
        setEditTaskForm(prev => ({ ...prev, unit: '' })); // Reset unit when property changes
    } else if (name === 'property' && !value) {
        setUnitsForEditTask([]);
        setEditTaskForm(prev => ({ ...prev, unit: '' }));
    }
  };

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    setEditTaskError("");
    try {
      await updateScheduledMaintenance(editingTaskId, editTaskForm);
      showMessage("Scheduled maintenance task updated!", 'success');
      setShowEditTaskModal(false);
      setEditingTaskId(null);
      fetchTasks();
    } catch (err) {
      setEditTaskError("Failed to update scheduled maintenance: " + (err.response?.data?.message || err.message));
      console.error("Edit task error:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this scheduled maintenance task? This action cannot be undone.")) {
      try {
        await deleteScheduledMaintenance(taskId);
        showMessage("Scheduled maintenance task deleted!", 'success');
        fetchTasks();
      } catch (err) {
        showMessage("Failed to delete task: " + (err.response?.data?.message || err.message), 'error');
        console.error("Delete task error:", err);
      }
    }
  };


  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">Scheduled Maintenance</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        {/* Controls and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <Button
            onClick={() => setShowAddTaskModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center space-x-2"
          >
            <PlusCircle className="w-5 h-5" /> <span>Schedule New Task</span>
          </Button>

          <div className="flex items-center gap-3">
            <label htmlFor="filterStatus" className="sr-only">Filter by Status</label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {maintenanceStatuses.map(status => (
                <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <label htmlFor="filterProperty" className="sr-only">Filter by Property</label>
            <select
              id="filterProperty"
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Properties</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>

            <form onSubmit={(e) => { e.preventDefault(); fetchTasks(); }} className="flex items-center gap-2">
              <label htmlFor="filterSearch" className="sr-only">Search Tasks</label>
              <input
                type="text"
                id="filterSearch"
                placeholder="Search by title/description"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <Button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg">
                <Search className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Scheduled Maintenance Table */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-600">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-gray-600 italic text-center py-8">No scheduled maintenance tasks found matching your criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(task.status)}`}>
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{task.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {task.property?.name || 'N/A'} {task.unit?.unitName ? `/ ${task.unit.unitName}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(task.scheduledDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.assignedTo?.name || task.assignedTo?.email || 'Unassigned'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                           {/* Add view details if a separate details page is desired */}
                           <Button onClick={() => handleOpenEditTaskModal(task)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md" title="Edit">
                               <Edit className="w-5 h-5" />
                           </Button>
                           <Button onClick={() => handleDeleteTask(task._id)} className="text-red-600 hover:text-red-900 p-1 rounded-md" title="Delete">
                               <Trash2 className="w-5 h-5" />
                           </Button>
                           <Link to={`/pm/scheduled-maintenance/${task._id}/public-link`} className="text-green-600 hover:text-green-900 p-1 rounded-md" title="Manage Public Link">
                               <FileText className="w-5 h-5" />
                           </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          <Pagination
            totalItems={totalTasks}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Add New Task Modal (reused from dashboard) */}
        <Modal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          title="Schedule New Maintenance"
        >
          <form onSubmit={handleAddTaskSubmit} className="p-4 space-y-4">
            {addTaskError && <p className="text-red-500 text-sm mb-3">{addTaskError}</p>}
            <div>
              <label htmlFor="modalTaskTitle" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="modalTaskTitle"
                name="title"
                value={taskForm.title}
                onChange={handleAddTaskFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="modalTaskDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="modalTaskDescription"
                name="description"
                value={taskForm.description}
                onChange={handleAddTaskFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="modalTaskCategory" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="modalTaskCategory"
                name="category"
                value={taskForm.category}
                onChange={handleAddTaskFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Select Category</option>
                {maintenanceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="modalTaskProperty" className="block text-sm font-medium text-gray-700">Property</label>
              <select
                id="modalTaskProperty"
                name="property"
                value={taskForm.property}
                onChange={handleAddTaskFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Select Property</option>
                {properties.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            {taskForm.property && (
              <div>
                <label htmlFor="modalTaskUnit" className="block text-sm font-medium text-gray-700">Unit (Optional)</label>
                <select
                  id="modalTaskUnit"
                  name="unit"
                  value={taskForm.unit}
                  onChange={handleAddTaskFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select Unit</option>
                  {unitsForAddTask.map(unit => (
                    <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="modalTaskScheduledDate" className="block text-sm font-medium text-gray-700">Scheduled Date</label>
              <input
                type="date"
                id="modalTaskScheduledDate"
                name="scheduledDate"
                value={taskForm.scheduledDate}
                onChange={handleAddTaskFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="modalTaskRecurring"
                name="recurring"
                checked={taskForm.recurring}
                onChange={handleAddTaskFormChange}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="modalTaskRecurring" className="ml-2 block text-sm text-gray-900">Recurring Task</label>
            </div>
            {taskForm.recurring && (
              <div className="pl-6 space-y-3">
                <p className="text-sm text-gray-600">Frequency options can be added here (e.g., dropdowns for type, interval)</p>
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" onClick={() => setShowAddTaskModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg">Schedule Task</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Task Modal */}
        <Modal
          isOpen={showEditTaskModal}
          onClose={() => setShowEditTaskModal(false)}
          title={`Edit Task: ${editTaskForm.title}`}
        >
          <form onSubmit={handleEditTaskSubmit} className="p-4 space-y-4">
            {editTaskError && <p className="text-red-500 text-sm mb-3">{editTaskError}</p>}
            <div>
              <label htmlFor="editTaskTitle" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" id="editTaskTitle" name="title" value={editTaskForm.title} onChange={handleEditTaskFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="editTaskDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="editTaskDescription" name="description" value={editTaskForm.description} onChange={handleEditTaskFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24" required></textarea>
            </div>
            <div>
              <label htmlFor="editTaskCategory" className="block text-sm font-medium text-gray-700">Category</label>
              <select id="editTaskCategory" name="category" value={editTaskForm.category} onChange={handleEditTaskFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
                <option value="">Select Category</option>
                {maintenanceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="editTaskProperty" className="block text-sm font-medium text-gray-700">Property</label>
              <select id="editTaskProperty" name="property" value={editTaskForm.property} onChange={handleEditTaskFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
                <option value="">Select Property</option>
                {properties.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            {editTaskForm.property && (
              <div>
                <label htmlFor="editTaskUnit" className="block text-sm font-medium text-gray-700">Unit (Optional)</label>
                <select id="editTaskUnit" name="unit" value={editTaskForm.unit} onChange={handleEditTaskFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                  <option value="">Select Unit</option>
                  {unitsForEditTask.map(unit => (
                    <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="editTaskScheduledDate" className="block text-sm font-medium text-gray-700">Scheduled Date</label>
              <input type="date" id="editTaskScheduledDate" name="scheduledDate" value={editTaskForm.scheduledDate} onChange={handleEditTaskFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="editTaskRecurring" name="recurring" checked={editTaskForm.recurring} onChange={handleEditTaskFormChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
              <label htmlFor="editTaskRecurring" className="ml-2 block text-sm text-gray-900">Recurring Task</label>
            </div>
            {editTaskForm.recurring && (
              <div className="pl-6 space-y-3">
                <p className="text-sm text-gray-600">Frequency options can be added here.</p>
              </div>
            )}
            <div>
              <label htmlFor="editTaskStatus" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="editTaskStatus" name="status" value={editTaskForm.status} onChange={handleEditTaskFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
                {maintenanceStatuses.map(status => (
                  <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" onClick={() => setShowEditTaskModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg">Save Changes</Button>
            </div>
          </form>
        </Modal>
      </div>
    </PropertyManagerLayout>
  );
}

export default ScheduledMaintenanceManagementPage;
