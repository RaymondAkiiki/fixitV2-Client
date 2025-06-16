// frontend/src/pages/pm/PMDashboard.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Import updated service functions
import { getAllProperties, createProperty } from "../../services/propertyService";
import { getAllRequests, assignRequest, updateRequest } from "../../services/requestService"; // markAsResolved is part of updateRequest status now
import { getAllVendors, addVendor } from "../../services/vendorService";
import { getAllScheduledMaintenance, createScheduledMaintenance } from "../../services/scheduledMaintenanceService"; // Renamed from getUserTasks, createTask
import { getMyProfile, getAllUsers } from "../../services/userService"; // getProfile -> getMyProfile
import { sendInvite } from "../../services/inviteService"; // Assuming this service exists for invitations
import { getAllNotifications, markAsRead } from "../../services/notificationService"; // For notifications section

// Common UI components (assuming these exist in your project)
import { Tabs } from '../../components/common/Tabs.jsx'; // Correct
import DashboardFilters from "../../components/common/DashboardFilters"; // Assuming a generic DashboardFilters component
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { Wrench, Building, Users, Package, Clock, Send, FileText, PlusCircle } from "lucide-react"; // Icons for dashboard cards and actions

// Helper for displaying messages to user (instead of alert)
const showMessage = (msg, type = 'info') => {
  // Implement a toast/snackbar/modal system here for better UX
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert for now, but strongly recommend a UI component
};

const tabs = [
  { name: "all", label: "All" },
  { name: "new", label: "New" },
  { name: "assigned", label: "Assigned" },
  { name: "in_progress", label: "In Progress" },
  { name: "completed", label: "Completed" },
  { name: "verified", label: "Verified" },
  { name: "archived", label: "Archived" },
  { name: "canceled", label: "Canceled" }
];

export default function PMDashboard() {
  // --- State ---
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [scheduledMaintenanceTasks, setScheduledMaintenanceTasks] = useState([]); // Renamed from tasks
  const [users, setUsers] = useState([]); // All users PM can see
  const [notifications, setNotifications] = useState([]);

  // Form states for modals
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [propertyForm, setPropertyForm] = useState({ name: "", address: { street: "", city: "", state: "", country: "" }, details: "" });
  const [addPropertyError, setAddPropertyError] = useState("");

  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "", // single value for dropdown, will be converted to array for API
    address: "",
    description: ""
  });
  const [addVendorError, setAddVendorError] = useState("");

  const serviceOptions = [
    { value: 'Plumbing', label: 'Plumbing' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'Appliance', label: 'Appliance' },
    { value: 'Structural', label: 'Structural' },
    { value: 'Landscaping', label: 'Landscaping' },
    { value: 'Other', label: 'Other' },
    { value: 'Cleaning', label: 'Cleaning' },
    { value: 'Security', label: 'Security' },
    { value: 'Pest Control', label: 'Pest Control' }
  ];

  // At the top of your PMDashboard.jsx
  const [showScheduleMaintenanceModal, setShowScheduleMaintenanceModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    category: "",
    property: "",
    unit: "",
    scheduledDate: "",
    recurring: false,
    frequency: {}
  });
  const [addTaskError, setAddTaskError] = useState("");
  const [unitsForAddTask, setUnitsForAddTask] = useState([]);

  const maintenanceCategories = [
    'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
    'landscaping', 'other', 'cleaning', 'security', 'pest_control'
  ];

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "tenant", // or allow selection if you want to invite vendors/PMs/landlords
    propertyId: "",
    unitId: ""
  });
  const [inviteError, setInviteError] = useState("");

  const [loading, setLoading] = useState(true); // Global loading for initial data
  const [error, setError] = useState("");
  

  // Request Dashboard UI States
  const [activeTab, setActiveTab] = useState("all"); // Lowercase to match backend
  const [filters, setFilters] = useState({ search: "", propertyId: "", category: "" }); // Removed 'date' filter for simplicity on dashboard
  const [loadingRequests, setLoadingRequests] = useState(false);

  const navigate = useNavigate();

  // --- Data Fetching ---
  const fetchAllDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const userProfile = await getMyProfile();
      setProfile(userProfile);

      const [
        propertiesData,
        vendorsData,
        usersData,
        scheduledMaintenanceData,
        notificationsData
      ] = await Promise.all([
        getAllProperties(),
        getAllVendors(),
        getAllUsers(), // Fetch all users PM can see (tenants, landlords, other PMs, vendors)
        getAllScheduledMaintenance(),
        getAllNotifications()
      ]);

      setProperties(propertiesData);
      setVendors(vendorsData);
      setUsers(usersData);
      setScheduledMaintenanceTasks(scheduledMaintenanceData?.tasks || []);
      setNotifications(notificationsData);

    } catch (err) {
      setError("Failed to load dashboard data. Please check your network and try again.");
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  // Requests filtered by tab and filters
  const fetchRequests = async () => {
    setLoadingRequests(true);
    setError(""); // Clear request-specific error
    try {
      const requestParams = {
        status: activeTab === "all" ? undefined : activeTab, // Send 'all' as undefined
        search: filters.search,
        propertyId: filters.propertyId,
        category: filters.category,
        // Backend filters by user's associated properties automatically
      };
      const data = await getAllRequests(requestParams);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load service requests.");
      setRequests([]);
      console.error("Fetch requests error:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!loading) { // Only fetch requests once initial data is loaded
      fetchRequests();
    }
  }, [activeTab, filters, loading]); // Depend on loading to ensure profile is fetched

  // --- Quick Add Property ---
  const handlePropertyFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) { // Handle nested address fields
      const [parent, child] = name.split('.');
      setPropertyForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setPropertyForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    setAddPropertyError("");
    try {
      await createProperty(propertyForm);
      showMessage("Property added successfully!", 'success');
      setShowAddPropertyModal(false);
      setPropertyForm({ name: "", address: { street: "", city: "", state: "", country: "" }, details: "" }); // Reset form
      await fetchAllDashboardData(); // Refresh data
    } catch (err) {
      setAddPropertyError("Failed to add property: " + (err.response?.data?.message || err.message));
      console.error("Add property error:", err);
    }
  };


  // --- Invite User ---
  const handleInviteFormChange = (e) => {
    const { name, value } = e.target;
    setInviteForm(f => ({ ...f, [name]: value }));
    setInviteError(""); // Clear error on change
  };

  const handleInvitePropertyChange = (e) => {
    const propertyId = e.target.value;
    setInviteForm(f => ({ ...f, propertyId, unitId: "" }));
    setInviteError("");
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    if (!inviteForm.email || !inviteForm.propertyId) {
      setInviteError('Email and Property must be selected.');
      return;
    }
    try {
      await sendInvite(inviteForm); // { email, role, propertyId, unitId }
      showMessage('Invitation sent successfully!', 'success');
      setShowInviteModal(false);
      setInviteForm({ email: "", role: "tenant", propertyId: "", unitId: "" });
    } catch (err) {
      setInviteError('Failed to send invitation: ' + (err.response?.data?.message || err.message));
    }
  };

  // --- Vendor CRUD ---
  const handleAddVendorFormChange = (e) => {
    const { name, value } = e.target;
    setVendorForm(f => ({ ...f, [name]: value }));
  };

  const handleAddVendorSubmit = async (e) => {
    e.preventDefault();
    setAddVendorError("");
    try {
      // API expects array for services, even if single selected
      const payload = { ...vendorForm, services: [vendorForm.service] };
      delete payload.service;
      await addVendor(payload);
      showMessage("Vendor added successfully!", 'success');
      setShowAddVendorModal(false);
      setVendorForm({ name: "", phone: "", email: "", service: "", address: "", description: "" });
      await fetchAllDashboardData(); // refresh vendors in dashboard
    } catch (err) {
      setAddVendorError("Failed to add vendor: " + (err.response?.data?.message || err.message));
      console.error("Add vendor error:", err);
    }
  };

  // --- Scheduled Maintenance ---
  const handleAddTaskFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'property') {
      const selectedProperty = properties.find(p => p._id === value);
      setUnitsForAddTask(selectedProperty?.units || []);
      setTaskForm(prev => ({ ...prev, unit: '' }));
    }
  };

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    setAddTaskError("");
    try {
      const payload = {
        ...taskForm,
        category: (taskForm.category || "").toLowerCase(),
        frequency: buildBackendFrequency(taskForm)
      };
      await createScheduledMaintenance(payload);
      showMessage("Scheduled maintenance task added!", 'success');
      setShowScheduleMaintenanceModal(false);
      setTaskForm({ title: "", description: "", category: "", property: "", unit: "", scheduledDate: "", recurring: false, frequency: {} });
      await fetchAllDashboardData(); // to refresh all
    } catch (err) {
      setAddTaskError("Failed to add scheduled maintenance: " + (err.response?.data?.message || err.message));
      if (err.response?.data?.errors) {
        setAddTaskError(
          err.response.data.errors.map(e => e.msg).join(", ")
        );
      }
      console.error("Add task error:", err);
    }
  };

  function buildBackendFrequency(form) {
    if (!form.recurring) return {};
    let backend = {};
    let freqType = (form.frequency.frequencyType || "").toLowerCase();
    if (freqType === "custom") freqType = "custom_days";
    backend.type = freqType;
    backend.interval = Math.max(1, parseInt(form.frequency.interval, 10) || 1);

    if (freqType === "weekly" && Array.isArray(form.frequency.daysOfWeek)) {
      const daysLookup = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      backend.dayOfWeek = form.frequency.daysOfWeek.map(day => daysLookup.indexOf(day)).filter(i => i >= 0);
    }
    if (freqType === "monthly" && form.frequency.dayOfMonth) {
      backend.dayOfMonth = form.frequency.dayOfMonth;
    }
    if (freqType === "yearly") {
      if (form.frequency.dayOfMonth) backend.dayOfMonth = form.frequency.dayOfMonth;
      if (form.frequency.monthOfYear) backend.monthOfYear = form.frequency.monthOfYear;
    }
    if (freqType === "custom_days" && Array.isArray(form.frequency.customDays)) {
      backend.customDays = form.frequency.customDays;
    }
    if (form.frequency.endsType) backend.endsType = form.frequency.endsType;
    if (form.frequency.endsAfter) backend.endsAfter = form.frequency.endsAfter;
    if (form.frequency.endsOnDate) backend.endsOnDate = form.frequency.endsOnDate;
    return backend;
  }

  // --- Request Actions ---
  const handleAssignVendor = async (requestId, assignedToId, assignedToModel) => {
    try {
      await assignRequest(requestId, { assignedToId, assignedToModel });
      showMessage("Vendor assigned successfully!", 'success');
      fetchRequests(); // Refresh requests
    } catch (err) {
      showMessage(`Failed to assign vendor: ${err.response?.data?.message || err.message}`, 'error');
      console.error("Assign vendor error:", err);
    }
  };

  const handleMarkStatus = async (requestId, newStatus) => {
    try {
      await updateRequest(requestId, { status: newStatus.toLowerCase() }); // Update status via updateRequest
      showMessage(`Request status updated to "${newStatus}"!`, 'success');
      fetchRequests(); // Refresh requests
    } catch (err) {
      showMessage(`Failed to update request status: ${err.response?.data?.message || err.message}`, 'error');
      console.error("Update request status error:", err);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // --- Stats for Summary Cards ---
  const stats = [
    { label: "Total Requests", count: requests.length, icon: Wrench },
    { label: "Pending Review", count: requests.filter((r) => r.status === "new").length, icon: Clock },
    { label: "In Progress", count: requests.filter((r) => r.status === "in_progress" || r.status === "assigned").length, icon: Wrench },
    { label: "Completed", count: requests.filter((r) => r.status === "completed" || r.status === "verified").length, icon: PlusCircle },
    { label: "Managed Properties", count: properties.length, icon: Building },
    { label: "Active Tenants", count: users.filter(u => u.role === 'tenant').length, icon: Users },
    { label: "Registered Vendors", count: vendors.length, icon: Package },
  ];

  // Helper for status badge styling
  const getStatusBadgeClass = (status) => {
    const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
    switch (status.toLowerCase()) {
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

  const getPriorityBadgeClass = (priority) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";
    switch (priority?.toLowerCase()) {
      case "low": return `${base} bg-gray-200 text-gray-700`;
      case "medium": return `${base} bg-blue-100 text-blue-700`;
      case "high": return `${base} bg-orange-100 text-orange-700`;
      case "urgent": return `${base} bg-red-100 text-red-700`;
      default: return `${base} bg-gray-100 text-gray-600`;
    }
  };

  function RecurringSection({ form, setForm }) {
    return (
      <div className="pl-2 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Repeat</label>
          <select
            name="frequencyType"
            value={form.frequency.frequencyType || ""}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                frequency: { ...prev.frequency, frequencyType: e.target.value }
              }))
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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

        {(form.frequency.frequencyType && ["hourly", "daily", "weekly", "monthly", "yearly", "custom"].includes(form.frequency.frequencyType)) && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {form.frequency.frequencyType === "hourly" ? "Every X hours"
                : form.frequency.frequencyType === "daily" ? "Every X days"
                : form.frequency.frequencyType === "weekly" ? "Every X weeks"
                : form.frequency.frequencyType === "monthly" ? "Every X months"
                : form.frequency.frequencyType === "yearly" ? "Every X years"
                : "Interval"}
            </label>
            <input
              type="number"
              min="1"
              name="interval"
              value={form.frequency.interval || 1}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  frequency: { ...prev.frequency, interval: Number(e.target.value) }
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        )}

        {form.frequency.frequencyType === "weekly" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">On Days</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.frequency.daysOfWeek?.includes(day)}
                    onChange={e => {
                      setForm(prev => {
                        let days = prev.frequency.daysOfWeek || [];
                        if (e.target.checked) {
                          days = [...days, day];
                        } else {
                          days = days.filter(d => d !== day);
                        }
                        return {
                          ...prev,
                          frequency: { ...prev.frequency, daysOfWeek: days }
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
          <label className="block text-sm font-medium text-gray-700">Ends</label>
          <select
            name="endsType"
            value={form.frequency.endsType || "never"}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                frequency: { ...prev.frequency, endsType: e.target.value }
              }))
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  frequency: { ...prev.frequency, endsAfter: Number(e.target.value) }
                }))
              }
              placeholder="Number of occurrences"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          )}
          {form.frequency.endsType === "onDate" && (
            <input
              type="date"
              name="endsOnDate"
              value={form.frequency.endsOnDate || ""}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  frequency: { ...prev.frequency, endsOnDate: e.target.value }
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          )}
        </div>
      </div>
    );
  }

  // --- Main Render ---
  if (loading) {
    return (
      
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Loading Property Manager Dashboard...</p>
      </div>
      
    );
  }

  return (
  
    <div className="bg-gray-50 min-h-full p-6 sm:p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome, {profile?.name || profile?.email}!</h1>
      <p className="text-lg text-gray-700 mb-8">Your central hub for managing properties, requests, and personnel.</p>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center justify-between transition-transform transform hover:scale-105">
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-500 uppercase">{stat.label}</div>
              <div className="text-4xl font-bold text-green-700 mt-1">{stat.count}</div>
            </div>
            <stat.icon className="w-10 h-10 text-gray-300" />
          </div>
        ))}
      </div>

      {/* Quick Actions and Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setShowAddPropertyModal(true)}
              className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Add Property
            </Button>
            <Button
              onClick={() => setShowAddVendorModal(true)}
              className="flex items-center justify-center p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Add Vendor
            </Button>
            <Button
              onClick={() => setShowScheduleMaintenanceModal(true)}
              className="flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Schedule Maintenance
            </Button>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition"
            >
              <Send className="w-5 h-5 mr-2" /> Invite User
            </Button>
            <Link to="/pm/requests/add" className="flex items-center justify-center p-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow-md transition">
              <PlusCircle className="w-5 h-5 mr-2" /> Create New Request
            </Link>
            <Link to="/pm/reports" className="flex items-center justify-center p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md transition">
              <FileText className="w-5 h-5 mr-2" /> View Reports
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex justify-between items-center">
            Recent Notifications
            <Link to="/pm/notifications" className="text-blue-600 text-base hover:underline">View All</Link>
          </h2>
          {notifications.length === 0 ? (
            <p className="text-gray-600 italic">No recent notifications.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.slice(0, 5).map(notif => (
                <li key={notif._id} className={`py-3 ${notif.isRead ? 'text-gray-500' : 'font-semibold text-gray-800'}`}>
                  <Link
                    to={notif.link || '#'}
                    onClick={() => handleMarkNotificationRead(notif._id)}
                    className="hover:underline"
                  >
                    {notif.message} <span className="text-gray-500 text-sm ml-2">({new Date(notif.createdAt).toLocaleString()})</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>


      {/* Service Requests Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold text-gray-800">Service Requests</h2>
          <Link to="/pm/requests" className="text-blue-600 text-base hover:underline">View All Requests &rarr;</Link>
        </div>

        {/* Request Filters & Tabs */}
        <div className="mb-4">
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          <DashboardFilters
            filters={filters}
            setFilters={setFilters}
            properties={properties} // Pass properties for filter dropdown
            showPropertyFilter={true}
            showCategoryFilter={true}
            showSearch={true}
          />
        </div>

        {loadingRequests ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading service requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">No service requests found matching the criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.slice(0, 10).map((req) => ( // Show first 10 requests on dashboard
                  <tr key={req._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/pm/requests/${req._id}`} className="text-green-600 hover:underline">
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadgeClass(req.status) && (
                          <span className={getStatusBadgeClass(req.status)}>
                              {req.status.replace(/_/g, ' ')}
                          </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadgeClass(req.priority) && (
                          <span className={getPriorityBadgeClass(req.priority)}>
                              {req.priority}
                          </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {req.property?.name || 'N/A'} {req.unit?.unitName ? `(${req.unit.unitName})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.createdBy?.name || req.createdBy?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.assignedTo?.name || req.assignedTo?.email || (req.assignedToModel === 'Vendor' ? 'Assigned Vendor' : 'Unassigned')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* Assign Vendor Dropdown */}
                      {!req.assignedTo && req.status !== 'completed' && req.status !== 'archived' && (
                        <select
                          onChange={e => handleAssignVendor(req._id, e.target.value, 'Vendor')}
                          className="mr-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">Assign Vendor</option>
                          {vendors.map(v => (
                            <option key={v._id} value={v._id}>{v.name}</option>
                          ))}
                        </select>
                      )}
                      {/* Status Actions */}
                      {req.status === 'new' && (
                        <Button onClick={() => handleMarkStatus(req._id, 'in_progress')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs mr-2">
                          Start Progress
                        </Button>
                      )}
                      {req.status === 'in_progress' && (
                        <Button onClick={() => handleMarkStatus(req._id, 'completed')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs mr-2">
                          Mark Completed
                        </Button>
                      )}
                      {req.status === 'completed' && (
                          <Button onClick={() => handleMarkStatus(req._id, 'verified')} className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-md text-xs mr-2">
                              Verify
                          </Button>
                      )}
                      {req.status === 'verified' && (
                            <Button onClick={() => handleMarkStatus(req._id, 'archived')} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-xs">
                              Archive
                          </Button>
                      )}
                      {req.status !== 'archived' && (
                          <Link to={`/pm/requests/${req._id}`} className="text-blue-600 hover:underline text-xs ml-2">Details</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scheduled Maintenance Overview */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold text-gray-800">Upcoming Scheduled Maintenance</h2>
          <Link to="/pm/scheduled-maintenance" className="text-blue-600 text-base hover:underline">View All Maintenance &rarr;</Link>
        </div>
        {scheduledMaintenanceTasks.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">No upcoming scheduled maintenance tasks.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledMaintenanceTasks.slice(0, 6).map((task) => ( // Show top 6 upcoming
              <div key={task._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800">{task.title}</h3>
                </div>
                <p className="text-gray-700 text-sm truncate">{task.description}</p>
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>Property:</strong> {task.property?.name || 'N/A'}</p>
                  {task.unit && <p><strong>Unit:</strong> {task.unit?.unitName || 'N/A'}</p>}
                  <p><strong>Date:</strong> {new Date(task.scheduledDate).toLocaleDateString()}</p>
                  <p><strong>Category:</strong> <span className="capitalize">{task.category}</span></p>
                  <p><strong>Status:</strong> {getStatusBadgeClass(task.status) && <span className={getStatusBadgeClass(task.status)}>{task.status}</span>}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link to={`/pm/scheduled-maintenance/${task._id}`} className="text-blue-600 hover:underline text-sm">Details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals for Quick Actions */}

      {/* Add Property Modal */}
       <Modal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        title="Add New Property"
      >
        <form onSubmit={handleAddPropertySubmit} className="p-4 space-y-4">
          {addPropertyError && <p className="text-red-500 text-sm mb-3">{addPropertyError}</p>}
          <div>
            <label htmlFor="modalPropertyName" className="block text-sm font-medium text-gray-700">Property Name</label>
            <input
              type="text"
              id="modalPropertyName"
              name="name"
              value={propertyForm.name}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyStreet" className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              type="text"
              id="modalPropertyStreet"
              name="address.street"
              value={propertyForm.address.street}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="modalPropertyCity" className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              id="modalPropertyCity"
              name="address.city"
              value={propertyForm.address.city}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyState" className="block text-sm font-medium text-gray-700">State / Province</label>
            <input
              type="text"
              id="modalPropertyState"
              name="address.state"
              value={propertyForm.address.state}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="modalPropertyCountry" className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              id="modalPropertyCountry"
              name="address.country"
              value={propertyForm.address.country}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyDetails" className="block text-sm font-medium text-gray-700">Details (Max 1000 chars)</label>
            <textarea
              id="modalPropertyDetails"
              name="details"
              value={propertyForm.details}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"
              maxLength={1000}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddPropertyModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-#219377 hover:bg-[#ffbd59] text-white py-2 px-4 rounded-lg">Add Property</Button>
          </div>
        </form>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        title="Add New Vendor"
      >
        <form onSubmit={handleAddVendorSubmit} className="p-4 space-y-4">
          {addVendorError && <p className="text-red-500 text-sm mb-3">{addVendorError}</p>}
          <div>
            <label htmlFor="addVendorName" className="block text-sm font-medium text-gray-700">Vendor Name</label>
            <input
              type="text"
              id="addVendorName"
              name="name"
              value={vendorForm.name}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="addVendorEmail" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="addVendorEmail"
              name="email"
              value={vendorForm.email}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="addVendorPhone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              id="addVendorPhone"
              name="phone"
              value={vendorForm.phone}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="addVendorService" className="block text-sm font-medium text-gray-700">Service</label>
            <select
              id="addVendorService"
              name="service"
              value={vendorForm.service}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Select Service</option>
              {serviceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="addVendorAddress" className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              id="addVendorAddress"
              name="address"
              value={vendorForm.address}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="addVendorDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="addVendorDescription"
              name="description"
              value={vendorForm.description}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddVendorModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg">Add Vendor</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={showScheduleMaintenanceModal}
        onClose={() => setShowScheduleMaintenanceModal(false)}
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
            <label htmlFor="modalTaskVendor" className="block text-sm font-medium text-gray-700">Assign to Vendor (optional)</label>
            <select
              id="modalTaskVendor"
              name="assignedTo"
              value={taskForm.assignedTo || ""}
              onChange={handleAddTaskFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Do not assign</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>
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
          {taskForm.recurring && <RecurringSection form={taskForm} setForm={setTaskForm} />}
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowScheduleMaintenanceModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg">Schedule Task</Button>
          </div>
        </form>
      </Modal>  
  
      {/* Invite User Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite New Tenant"
      >
        <form onSubmit={handleSendInvite}>
          <div className="p-4">
            <p className="text-gray-700 mb-4">
              Send an invitation to a new tenant. They will be prompted to set up their account and link to a specific property and unit.
            </p>
            {inviteError && <p className="text-red-500 mb-3">{inviteError}</p>}
            <div className="mb-4">
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">Tenant Email:</label>
              <input
                type="email"
                id="inviteEmail"
                name="email"
                value={inviteForm.email}
                onChange={handleInviteFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="tenant@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-1">Role:</label>
              <select
                id="inviteRole"
                name="role"
                value={inviteForm.role}
                onChange={handleInviteFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="tenant">Tenant</option>
                <option value="propertymanager">Property Manager</option>
                <option value="vendor">Vendor</option>
                <option value="landlord">Landlord</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="inviteProperty" className="block text-sm font-medium text-gray-700 mb-1">Property:</label>
              <select
                id="inviteProperty"
                name="propertyId"
                value={inviteForm.propertyId}
                onChange={handleInvitePropertyChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Property</option>
                {properties.map(prop => (
                  <option key={prop._id} value={prop._id}>{prop.name}</option>
                ))}
              </select>
            </div>
            {inviteForm.propertyId && (
              <div className="mb-4">
                <label htmlFor="inviteUnit" className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional, but recommended for tenants):</label>
                <select
                  id="inviteUnit"
                  name="unitId"
                  value={inviteForm.unitId}
                  onChange={handleInviteFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Unit (Optional)</option>
                  {properties.find(p => p._id === inviteForm.propertyId)?.units?.map(unit => (
                    <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-[#219377] text-white py-2 px-4 rounded-lg"
              >
                Send Invite
              </Button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
    
  );
}