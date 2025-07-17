import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import {
  getAllScheduledMaintenance,
  createScheduledMaintenance,
  updateScheduledMaintenance,
  deleteScheduledMaintenance,
} from "../../services/scheduledMaintenanceService";
import { getAllProperties } from "../../services/propertyService";
import { getAllVendors } from "../../services/vendorService";
import { getAllUsers } from "../../services/userService";
import { PlusCircle, Search, Edit, Trash2, FileText } from "lucide-react";
import ScheduledMaintenancePublicLinkModal from "../../components/common/ScheduledMaintenancePublicLinkModal";

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Helper for displaying messages (replace with toast in production)
const showMessage = (msg, type = "info") => {
  alert(msg);
};

const maintenanceStatuses = [
  "scheduled",
  "in_progress",
  "completed",
  "canceled",
];
const maintenanceCategories = [
  "plumbing",
  "electrical",
  "hvac",
  "appliance",
  "structural",
  "landscaping",
  "other",
  "cleaning",
  "security",
  "pest_control",
];

// Helper to map frontend frequency object to backend format
function buildBackendFrequency(form) {
  if (!form.recurring) return {};
  let backend = {};
  let freqType = (form.frequency.frequencyType || "").toLowerCase();
  if (freqType === "custom") freqType = "custom_days";
  backend.type = freqType;
  backend.interval = Math.max(1, parseInt(form.frequency.interval, 10) || 1);

  if (freqType === "weekly" && Array.isArray(form.frequency.daysOfWeek)) {
    const daysLookup = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    backend.dayOfWeek = form.frequency.daysOfWeek
      .map((day) => daysLookup.indexOf(day))
      .filter((i) => i >= 0);
  }
  if (freqType === "monthly" && form.frequency.dayOfMonth) {
    backend.dayOfMonth = form.frequency.dayOfMonth;
  }
  if (freqType === "yearly") {
    if (form.frequency.dayOfMonth) backend.dayOfMonth = form.frequency.dayOfMonth;
    if (form.frequency.monthOfYear) backend.monthOfYear = form.frequency.monthOfYear;
  }
  if (
    freqType === "custom_days" &&
    Array.isArray(form.frequency.customDays)
  ) {
    backend.customDays = form.frequency.customDays;
  }
  if (form.frequency.endsType) backend.endsType = form.frequency.endsType;
  if (form.frequency.endsAfter) backend.endsAfter = form.frequency.endsAfter;
  if (form.frequency.endsOnDate) backend.endsOnDate = form.frequency.endsOnDate;
  return backend;
}

function RecurringSection({ form, setForm }) {
  return (
    <div className="pl-2 space-y-3">
      <div>
        <label className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>
          Repeat
        </label>
        <select
          name="frequencyType"
          value={form.frequency.frequencyType || ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              frequency: { ...prev.frequency, frequencyType: e.target.value },
            }))
          }
          className="mt-1 block w-full border rounded-md shadow-sm p-2"
          style={{ borderColor: PRIMARY_COLOR }}
          required
        >
          <option value="">Select...</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom Interval</option>
        </select>
      </div>

      {form.frequency.frequencyType &&
        [
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
          "custom",
        ].includes(form.frequency.frequencyType) && (
          <div>
            <label className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>
              {form.frequency.frequencyType === "hourly"
                ? "Every X hours"
                : form.frequency.frequencyType === "daily"
                ? "Every X days"
                : form.frequency.frequencyType === "weekly"
                ? "Every X weeks"
                : form.frequency.frequencyType === "monthly"
                ? "Every X months"
                : form.frequency.frequencyType === "yearly"
                ? "Every X years"
                : "Interval"}
            </label>
            <input
              type="number"
              min="1"
              name="interval"
              value={form.frequency.interval || 1}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  frequency: {
                    ...prev.frequency,
                    interval: Number(e.target.value),
                  },
                }))
              }
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
            />
          </div>
        )}

      {form.frequency.frequencyType === "weekly" && (
        <div>
          <label className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>
            On Days
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.frequency.daysOfWeek?.includes(day)}
                  onChange={(e) => {
                    setForm((prev) => {
                      let days = prev.frequency.daysOfWeek || [];
                      if (e.target.checked) {
                        days = [...days, day];
                      } else {
                        days = days.filter((d) => d !== day);
                      }
                      return {
                        ...prev,
                        frequency: { ...prev.frequency, daysOfWeek: days },
                      };
                    });
                  }}
                  className="mr-1"
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>
          Ends
        </label>
        <select
          name="endsType"
          value={form.frequency.endsType || "never"}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              frequency: { ...prev.frequency, endsType: e.target.value },
            }))
          }
          className="mt-1 block w-full border rounded-md shadow-sm p-2"
          style={{ borderColor: PRIMARY_COLOR }}
        >
          <option value="never">Never</option>
          <option value="after">After N Occurrences</option>
          <option value="onDate">On Date</option>
        </select>
        {form.frequency.endsType === "after" && (
          <input
            type="number"
            min="1"
            name="endsAfter"
            value={form.frequency.endsAfter || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                frequency: {
                  ...prev.frequency,
                  endsAfter: Number(e.target.value),
                },
              }))
            }
            placeholder="Number of occurrences"
            className="mt-1 block w-full border rounded-md shadow-sm p-2"
            style={{ borderColor: PRIMARY_COLOR }}
          />
        )}
        {form.frequency.endsType === "onDate" && (
          <input
            type="date"
            name="endsOnDate"
            value={form.frequency.endsOnDate || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                frequency: { ...prev.frequency, endsOnDate: e.target.value },
              }))
            }
            className="mt-1 block w-full border rounded-md shadow-sm p-2"
            style={{ borderColor: PRIMARY_COLOR }}
          />
        )}
      </div>
    </div>
  );
}

function ScheduledMaintenanceManagementPage() {
  // --- State ---
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [componentError, setComponentError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [internalUsers, setInternalUsers] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterProperty, setFilterProperty] = useState(searchParams.get("propertyId") || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
  const [filterSearch, setFilterSearch] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTasks, setTotalTasks] = useState(0);
  const [showPublicLinkModal, setShowPublicLinkModal] = useState(false);
  const [publicLinkTask, setPublicLinkTask] = useState(null);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    category: "",
    property: "",
    unit: "",
    scheduledDate: "",
    recurring: false,
    frequency: {},
  });
  const [addTaskError, setAddTaskError] = useState("");
  const [unitsForAddTask, setUnitsForAddTask] = useState([]);

  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({
    title: "",
    description: "",
    category: "",
    property: "",
    unit: "",
    scheduledDate: "",
    recurring: false,
    frequency: {},
    status: "",
  });
  const [editTaskError, setEditTaskError] = useState("");
  const [unitsForEditTask, setUnitsForEditTask] = useState([]);

  // --- Effects ---
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line
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
    // eslint-disable-next-line
  }, [filterStatus, filterProperty, filterSearch, currentPage, itemsPerPage]);

  // --- Fetchers ---
  const fetchInitialData = async () => {
    setLoading(true);
    setComponentError(null);
    try {
      const propertiesData = await getAllProperties();
      setProperties(propertiesData);
      const vendorsData = await getAllVendors();
      setVendors(vendorsData);
      const allUsers = await getAllUsers();
      const assignableRoles = [
        "propertymanager",
        "landlord",
        "admin",
        "vendor",
      ];
      setInternalUsers(
        allUsers.filter((user) => assignableRoles.includes(user.role))
      );
    } catch (err) {
      setComponentError(
        "Failed to load initial data: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setComponentError(null);
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
      setComponentError(
        "Failed to fetch scheduled maintenance tasks: " +
          (err.response?.data?.message || err.message)
      );
      setTasks([]);
      setTotalTasks(0);
    } finally {
      setLoading(false);
    }
  };

  // --- Add Task Handlers ---
  const handleAddTaskFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "property" && value) {
      const selectedProperty = properties.find((p) => p._id === value);
      setUnitsForAddTask(selectedProperty?.units || []);
      setTaskForm((prev) => ({ ...prev, unit: "" }));
    } else if (name === "property" && !value) {
      setUnitsForAddTask([]);
      setTaskForm((prev) => ({ ...prev, unit: "" }));
    }
  };

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    setAddTaskError("");
    try {
      const payload = {
        ...taskForm,
        category: (taskForm.category || "").toLowerCase(),
        frequency: buildBackendFrequency(taskForm),
      };
      await createScheduledMaintenance(payload);
      showMessage("Scheduled maintenance task added!", "success");
      setShowAddTaskModal(false);
      setTaskForm({
        title: "",
        description: "",
        category: "",
        property: "",
        unit: "",
        scheduledDate: "",
        recurring: false,
        frequency: {},
      });
      fetchTasks();
    } catch (err) {
      setAddTaskError(
        "Failed to add scheduled maintenance: " +
          (err.response?.data?.message || err.message)
      );
      if (err.response?.data?.errors) {
        setAddTaskError(
          err.response.data.errors.map((e) => e.msg).join(", ")
        );
      }
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
      scheduledDate: task.scheduledDate
        ? new Date(task.scheduledDate).toISOString().split("T")[0]
        : "",
      recurring: task.recurring || false,
      frequency: task.frequency || {},
      status: task.status || "",
    });
    const selectedProperty = properties.find(
      (p) => p._id === (task.property?._id || task.property)
    );
    setUnitsForEditTask(selectedProperty?.units || []);
    setShowEditTaskModal(true);
  };

  const handleEditTaskFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditTaskForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "property" && value) {
      const selectedProperty = properties.find((p) => p._id === value);
      setUnitsForEditTask(selectedProperty?.units || []);
      setEditTaskForm((prev) => ({ ...prev, unit: "" }));
    } else if (name === "property" && !value) {
      setUnitsForEditTask([]);
      setEditTaskForm((prev) => ({ ...prev, unit: "" }));
    }
  };

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    setEditTaskError("");
    try {
      const payload = {
        ...editTaskForm,
        frequency: buildBackendFrequency(editTaskForm),
      };
      await updateScheduledMaintenance(editingTaskId, payload);
      showMessage("Scheduled maintenance task updated!", "success");
      setShowEditTaskModal(false);
      setEditingTaskId(null);
      fetchTasks();
    } catch (err) {
      setEditTaskError(
        "Failed to update scheduled maintenance: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this scheduled maintenance task? This action cannot be undone."
      )
    ) {
      try {
        await deleteScheduledMaintenance(taskId);
        showMessage("Scheduled maintenance task deleted!", "success");
        fetchTasks();
      } catch (err) {
        showMessage(
          "Failed to delete task: " +
            (err.response?.data?.message || err.message),
          "error"
        );
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        Scheduled Maintenance
      </h1>
      {componentError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {componentError}</span>
        </div>
      )}

      {/* Filters and Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-lg shadow-sm border"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "14" }}
      >
        <Button
          onClick={() => setShowAddTaskModal(true)}
          className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold"
          style={{ backgroundColor: PRIMARY_COLOR, color: "#fff" }}
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Schedule New Task
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
            style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
          >
            <option value="">All Statuses</option>
            {maintenanceStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            id="filterProperty"
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-3 py-2 border rounded-md"
            style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
          >
            <option value="">All Properties</option>
            {properties.map((prop) => (
              <option key={prop._id} value={prop._id}>
                {prop.name}
              </option>
            ))}
          </select>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchTasks();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              id="filterSearch"
              placeholder="Search by title/description"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="px-3 py-2 border rounded-md"
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
            />
            <Button
              type="submit"
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600,
              }}
            >
              <Search className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
      <div
        className="bg-white p-6 rounded-xl shadow-lg border"
        style={{ borderColor: PRIMARY_COLOR + "14" }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
              Loading tasks...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">
            No scheduled maintenance tasks found matching your criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y"
              style={{ borderColor: PRIMARY_COLOR + "10" }}
            >
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Title
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Category
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Property / Unit
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Scheduled Date
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Assigned To
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-[#f0fdfa] transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(
                          task.status
                        )}`}
                      >
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {task.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {task.property?.name || "N/A"}{" "}
                      {task.unit?.unitName ? `/ ${task.unit.unitName}` : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {task.scheduledDate
                        ? new Date(task.scheduledDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {task.assignedTo?.name ||
                        task.assignedTo?.email ||
                        "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleOpenEditTaskModal(task)}
                          className="p-2 rounded-md"
                          style={{
                            backgroundColor: "#eef2ff",
                            color: "#3730a3",
                          }}
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 rounded-md"
                          style={{
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => {
                            setPublicLinkTask(task);
                            setShowPublicLinkModal(true);
                          }}
                          className="p-2 rounded-md"
                          style={{
                            backgroundColor: "#d1fae5",
                            color: PRIMARY_COLOR,
                          }}
                          title="Manage Public Link"
                        >
                          <FileText className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          totalItems={totalTasks}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
      {/* Add New Task Modal */}
      <Modal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Schedule New Maintenance</span>}
      >
        <form onSubmit={handleAddTaskSubmit} className="p-4 space-y-4">
          {addTaskError && <p className="text-red-500 text-sm mb-3">{addTaskError}</p>}
          <div>
            <label htmlFor="modalTaskTitle" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Title</label>
            <input
              type="text"
              id="modalTaskTitle"
              name="title"
              value={taskForm.title}
              onChange={handleAddTaskFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label htmlFor="modalTaskDescription" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Description</label>
            <textarea
              id="modalTaskDescription"
              name="description"
              value={taskForm.description}
              onChange={handleAddTaskFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 h-24"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="modalTaskCategory" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Category</label>
            <select
              id="modalTaskCategory"
              name="category"
              value={taskForm.category}
              onChange={handleAddTaskFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            >
              <option value="">Select Category</option>
              {maintenanceCategories.map(cat => (
                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="modalTaskProperty" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Property</label>
            <select
              id="modalTaskProperty"
              name="property"
              value={taskForm.property}
              onChange={handleAddTaskFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
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
              <label htmlFor="modalTaskUnit" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Unit (Optional)</label>
              <select
                id="modalTaskUnit"
                name="unit"
                value={taskForm.unit}
                onChange={handleAddTaskFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }}
              >
                <option value="">Select Unit</option>
                {unitsForAddTask.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="modalTaskVendor" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Assign to Vendor (optional)</label>
            <select
              id="modalTaskVendor"
              name="assignedTo"
              value={taskForm.assignedTo || ""}
              onChange={handleAddTaskFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
            >
              <option value="">Do not assign</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="modalTaskScheduledDate" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Scheduled Date</label>
            <input
              type="date"
              id="modalTaskScheduledDate"
              name="scheduledDate"
              value={taskForm.scheduledDate}
              onChange={handleAddTaskFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
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
              className="h-4 w-4"
              style={{ borderColor: PRIMARY_COLOR }}
            />
            <label htmlFor="modalTaskRecurring" className="ml-2 block text-sm" style={{ color: PRIMARY_COLOR }}>Recurring Task</label>
          </div>
          {taskForm.recurring && <RecurringSection form={taskForm} setForm={setTaskForm} />}
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddTaskModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg">Schedule Task</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditTaskModal}
        onClose={() => setShowEditTaskModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>{`Edit Task: ${editTaskForm.title}`}</span>}
      >
        <form onSubmit={handleEditTaskSubmit} className="p-4 space-y-4">
          {editTaskError && <p className="text-red-500 text-sm mb-3">{editTaskError}</p>}
          <div>
            <label htmlFor="editTaskTitle" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Title</label>
            <input type="text" id="editTaskTitle" name="title" value={editTaskForm.title} onChange={handleEditTaskFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} required />
          </div>
          <div>
            <label htmlFor="editTaskDescription" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Description</label>
            <textarea id="editTaskDescription" name="description" value={editTaskForm.description} onChange={handleEditTaskFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 h-24" style={{ borderColor: PRIMARY_COLOR }} required></textarea>
          </div>
          <div>
            <label htmlFor="editTaskCategory" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Category</label>
            <select id="editTaskCategory" name="category" value={editTaskForm.category} onChange={handleEditTaskFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} required>
              <option value="">Select Category</option>
              {maintenanceCategories.map(cat => (
                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="editTaskProperty" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Property</label>
            <select id="editTaskProperty" name="property" value={editTaskForm.property} onChange={handleEditTaskFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} required>
              <option value="">Select Property</option>
              {properties.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          {editTaskForm.property && (
            <div>
              <label htmlFor="editTaskUnit" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Unit (Optional)</label>
              <select id="editTaskUnit" name="unit" value={editTaskForm.unit} onChange={handleEditTaskFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }}>
                <option value="">Select Unit</option>
                {unitsForEditTask.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="modalTaskVendor" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Assign to Vendor (optional)</label>
            <select
              id="modalTaskVendor"
              name="assignedTo"
              value={editTaskForm.assignedTo || ""}
              onChange={handleEditTaskFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
            >
              <option value="">Do not assign</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="editTaskScheduledDate" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Scheduled Date</label>
            <input type="date" id="editTaskScheduledDate" name="scheduledDate" value={editTaskForm.scheduledDate} onChange={handleEditTaskFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} required />
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="editTaskRecurring" name="recurring" checked={editTaskForm.recurring} onChange={handleEditTaskFormChange} className="h-4 w-4" style={{ borderColor: PRIMARY_COLOR }} />
            <label htmlFor="editTaskRecurring" className="ml-2 block text-sm" style={{ color: PRIMARY_COLOR }}>Recurring Task</label>
          </div>
          {editTaskForm.recurring && <RecurringSection form={editTaskForm} setForm={setEditTaskForm} />}
          <div>
            <label htmlFor="editTaskStatus" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Status</label>
            <select id="editTaskStatus" name="status" value={editTaskForm.status} onChange={handleEditTaskFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} required>
              {maintenanceStatuses.map(status => (
                <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowEditTaskModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <ScheduledMaintenancePublicLinkModal
        isOpen={showPublicLinkModal}
        onClose={() => setShowPublicLinkModal(false)}
        task={publicLinkTask}
        onLinkChanged={() => fetchTasks()}
      />
    </div>
  );
}

export default ScheduledMaintenanceManagementPage;