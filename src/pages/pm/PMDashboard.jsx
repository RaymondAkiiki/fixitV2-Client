import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllProperties, createProperty } from "../../services/propertyService";
import { getAllRequests, assignRequest, updateRequest } from "../../services/requestService";
import { getAllVendors, addVendor } from "../../services/vendorService";
import { getAllScheduledMaintenance, createScheduledMaintenance } from "../../services/scheduledMaintenanceService";
import { getMyProfile, getAllUsers } from "../../services/userService";
import { sendInvite } from "../../services/inviteService";
import { getAllNotifications, markAsRead } from "../../services/notificationService";
import { Tabs } from '../../components/common/Tabs.jsx';
import DashboardFilters from "../../components/common/DashboardFilters";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { Wrench, Building, Users, Package, Clock, Send, FileText, PlusCircle } from "lucide-react";
import { useGlobalAlert } from "../../context/GlobalAlertContext";

// Brand palette
const PRIMARY = "#219377";
const SECONDARY = "#ffbd59";
const LIGHT_BG = "#f8fafc";

const quickActionColors = [
  { bg: "bg-[#219377]", hover: "hover:bg-[#197a66]", text: "text-white" },
  { bg: "bg-[#ffbd59]", hover: "hover:bg-[#e7a741]", text: "text-[#1c2522]" },
  { bg: "bg-[#3390ec]", hover: "hover:bg-[#217fc9]", text: "text-white" },
  { bg: "bg-[#9467bd]", hover: "hover:bg-[#7e4e9e]", text: "text-white" },
  { bg: "bg-[#f5983c]", hover: "hover:bg-[#df7d0d]", text: "text-white" },
  { bg: "bg-[#22bfa1]", hover: "hover:bg-[#1c9a82]", text: "text-white" },
];

const requestStatusColors = {
  new: { bg: "bg-[#e5f6f4]", text: "text-[#219377]" }, // light emerald
  assigned: { bg: "bg-[#fff4df]", text: "text-[#ffbd59]" }, // light yellow
  in_progress: { bg: "bg-[#fffbe6]", text: "text-[#d29f00]" }, // light gold
  completed: { bg: "bg-[#eafcf2]", text: "text-[#219377]" },
  verified: { bg: "bg-[#e7f9fa]", text: "text-[#22bfa1]" },
  reopened: { bg: "bg-[#fff3e0]", text: "text-[#e59819]" },
  archived: { bg: "bg-gray-100", text: "text-gray-700" },
  canceled: { bg: "bg-[#fde2e5]", text: "text-[#e64848]" },
  scheduled: { bg: "bg-[#f0fdfa]", text: "text-[#219377]" },
  default: { bg: "bg-gray-100", text: "text-gray-700" },
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
  const [scheduledMaintenanceTasks, setScheduledMaintenanceTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [propertyForm, setPropertyForm] = useState({ name: "", address: { street: "", city: "", state: "", country: "" }, details: "" });
  const [addPropertyError, setAddPropertyError] = useState("");
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
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
    role: "tenant",
    propertyId: "",
    unitId: ""
  });
  const [inviteError, setInviteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({ search: "", propertyId: "", category: "" });
  const [loadingRequests, setLoadingRequests] = useState(false);
  const { showSuccess, showError } = useGlobalAlert();
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
        getAllUsers(),
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
      showError("Failed to load dashboard data. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
    // eslint-disable-next-line
  }, []);

  // Requests filtered by tab and filters
  const fetchRequests = async () => {
    setLoadingRequests(true);
    setError("");
    try {
      const requestParams = {
        status: activeTab === "all" ? undefined : activeTab,
        search: filters.search,
        propertyId: filters.propertyId,
        category: filters.category,
      };
      const data = await getAllRequests(requestParams);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load service requests.");
      setRequests([]);
      showError("Failed to load service requests.");
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchRequests();
    }
    // eslint-disable-next-line
  }, [activeTab, filters, loading]);

  // --- Quick Add Property ---
  const handlePropertyFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
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
      showSuccess("Property added successfully!");
      setShowAddPropertyModal(false);
      setPropertyForm({ name: "", address: { street: "", city: "", state: "", country: "" }, details: "" });
      await fetchAllDashboardData();
    } catch (err) {
      setAddPropertyError("Failed to add property: " + (err.response?.data?.message || err.message));
      showError("Failed to add property: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Invite User ---
  const handleInviteFormChange = (e) => {
    const { name, value } = e.target;
    setInviteForm(f => ({ ...f, [name]: value }));
    setInviteError("");
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
      showError('Email and Property must be selected.');
      return;
    }
    try {
      await sendInvite(inviteForm);
      showSuccess('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteForm({ email: "", role: "tenant", propertyId: "", unitId: "" });
    } catch (err) {
      setInviteError('Failed to send invitation: ' + (err.response?.data?.message || err.message));
      showError('Failed to send invitation: ' + (err.response?.data?.message || err.message));
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
      const payload = { ...vendorForm, services: [vendorForm.service] };
      delete payload.service;
      await addVendor(payload);
      showSuccess("Vendor added successfully!");
      setShowAddVendorModal(false);
      setVendorForm({ name: "", phone: "", email: "", service: "", address: "", description: "" });
      await fetchAllDashboardData();
    } catch (err) {
      setAddVendorError("Failed to add vendor: " + (err.response?.data?.message || err.message));
      showError("Failed to add vendor: " + (err.response?.data?.message || err.message));
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
      showSuccess("Scheduled maintenance task added!");
      setShowScheduleMaintenanceModal(false);
      setTaskForm({ title: "", description: "", category: "", property: "", unit: "", scheduledDate: "", recurring: false, frequency: {} });
      await fetchAllDashboardData();
    } catch (err) {
      setAddTaskError("Failed to add scheduled maintenance: " + (err.response?.data?.message || err.message));
      showError("Failed to add scheduled maintenance: " + (err.response?.data?.message || err.message));
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
      showSuccess("Vendor assigned successfully!");
      fetchRequests();
    } catch (err) {
      showError(`Failed to assign vendor: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleMarkStatus = async (requestId, newStatus) => {
    try {
      await updateRequest(requestId, { status: newStatus.toLowerCase() });
      showSuccess(`Request status updated to "${newStatus}"!`);
      fetchRequests();
    } catch (err) {
      showError(`Failed to update request status: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    } catch (err) {
      // Silent fail
    }
  };

  // --- Stats for Summary Cards ---
  const stats = [
    { label: "Total Requests", count: requests.length, icon: Wrench, color: PRIMARY },
    { label: "Pending Review", count: requests.filter((r) => r.status === "new").length, icon: Clock, color: "#3390ec" },
    { label: "In Progress", count: requests.filter((r) => r.status === "in_progress" || r.status === "assigned").length, icon: Wrench, color: "#f5983c" },
    { label: "Completed", count: requests.filter((r) => r.status === "completed" || r.status === "verified").length, icon: PlusCircle, color: "#22bfa1" },
    { label: "Managed Properties", count: properties.length, icon: Building, color: SECONDARY },
    { label: "Active Tenants", count: users.filter(u => u.role === 'tenant').length, icon: Users, color: PRIMARY },
    { label: "Registered Vendors", count: vendors.length, icon: Package, color: "#9467bd" },
  ];

  // --- Status/Badge helpers ---
  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    const colors = requestStatusColors[s] || requestStatusColors.default;
    return `px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${colors.bg} ${colors.text}`;
  };

  const getPriorityBadgeClass = (priority) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";
    switch (priority?.toLowerCase()) {
      case "low": return `${base} bg-gray-200 text-gray-700`;
      case "medium": return `${base} bg-blue-50 text-blue-700`;
      case "high": return `${base} bg-[#ffe6a3] text-[#e09d17]`;
      case "urgent": return `${base} bg-[#fde2e5] text-[#e64848]`;
      default: return `${base} bg-gray-100 text-gray-600`;
    }
  };

  function RecurringSection({ form, setForm }) {
    // ... (unchanged, omitted for brevity)
    // Use your existing RecurringSection logic here
    return null;
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
    <div className="bg-[#f8fafc] min-h-full p-6 sm:p-8">
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: PRIMARY }}>
        Welcome, {profile?.name || profile?.email}!
      </h1>
      <p className="text-lg text-gray-700 mb-8">Your central hub for managing properties, requests, and personnel.</p>

      {error && (
        <div className="bg-[#fde2e5] border border-[#e64848] text-[#e64848] px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center justify-between group transition-transform transform hover:scale-105"
            style={{ borderTop: `4px solid ${stat.color}` }}
          >
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-500 uppercase">{stat.label}</div>
              <div className="text-4xl font-extrabold mt-1" style={{ color: stat.color }}>{stat.count}</div>
            </div>
            <stat.icon className={`w-10 h-10 opacity-80 group-hover:scale-110`} style={{ color: stat.color, transition: "all 0.2s" }} />
          </div>
        ))}
      </div>

      {/* Quick Actions and Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-5" style={{ color: PRIMARY }}>Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setShowAddPropertyModal(true)}
              className="flex items-center justify-center p-4 bg-[#219377] hover:bg-[#197a66] text-white rounded-lg shadow-md transition"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Add Property
            </Button>
            <Button
              onClick={() => setShowAddVendorModal(true)}
              className="flex items-center justify-center p-4 bg-[#ffbd59] hover:bg-[#e7a741] text-[#1c2522] rounded-lg shadow-md transition"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Add Vendor
            </Button>
            <Button
              onClick={() => setShowScheduleMaintenanceModal(true)}
              className="flex items-center justify-center p-4 bg-[#22bfa1] hover:bg-[#1c9a82] text-white rounded-lg shadow-md transition"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Schedule Maintenance
            </Button>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center justify-center p-4 bg-[#3390ec] hover:bg-[#217fc9] text-white rounded-lg shadow-md transition"
            >
              <Send className="w-5 h-5 mr-2" /> Invite User
            </Button>
            <Link to="/pm/requests/add" className="flex items-center justify-center p-4 bg-[#9467bd] hover:bg-[#7e4e9e] text-white rounded-lg shadow-md transition">
              <PlusCircle className="w-5 h-5 mr-2" /> Create New Request
            </Link>
            <Link to="/pm/reports" className="flex items-center justify-center p-4 bg-[#f5983c] hover:bg-[#df7d0d] text-white rounded-lg shadow-md transition">
              <FileText className="w-5 h-5 mr-2" /> View Reports
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-5 flex justify-between items-center" style={{ color: PRIMARY }}>
            Recent Notifications
            <Link to="/pm/notifications" className="text-[#219377] text-base hover:text-[#ffbd59] font-semibold transition">View All</Link>
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
          <h2 className="text-2xl font-semibold" style={{ color: PRIMARY }}>Service Requests</h2>
          <Link to="/pm/requests" className="text-[#219377] text-base hover:text-[#ffbd59] font-semibold transition">View All Requests &rarr;</Link>
        </div>
        <div className="mb-4">
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          <DashboardFilters
            filters={filters}
            setFilters={setFilters}
            properties={properties}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.slice(0, 10).map((req) => (
                  <tr key={req._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/pm/requests/${req._id}`} className="text-[#219377] hover:underline font-semibold">
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(req.status)}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadgeClass(req.priority)}>
                        {req.priority}
                      </span>
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
                      {req.status === 'new' && (
                        <Button onClick={() => handleMarkStatus(req._id, 'in_progress')} className="bg-[#f5983c] hover:bg-[#e09d17] text-white px-3 py-1 rounded-md text-xs mr-2">
                          Start Progress
                        </Button>
                      )}
                      {req.status === 'in_progress' && (
                        <Button onClick={() => handleMarkStatus(req._id, 'completed')} className="bg-[#22bfa1] hover:bg-[#1c9a82] text-white px-3 py-1 rounded-md text-xs mr-2">
                          Mark Completed
                        </Button>
                      )}
                      {req.status === 'completed' && (
                        <Button onClick={() => handleMarkStatus(req._id, 'verified')} className="bg-[#219377] hover:bg-[#197a66] text-white px-3 py-1 rounded-md text-xs mr-2">
                          Verify
                        </Button>
                      )}
                      {req.status === 'verified' && (
                        <Button onClick={() => handleMarkStatus(req._id, 'archived')} className="bg-gray-400 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-xs">
                          Archive
                        </Button>
                      )}
                      {req.status !== 'archived' && (
                        <Link to={`/pm/requests/${req._id}`} className="text-[#3390ec] hover:underline text-xs ml-2">Details</Link>
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
          <h2 className="text-2xl font-semibold" style={{ color: PRIMARY }}>Upcoming Scheduled Maintenance</h2>
          <Link to="/pm/scheduled-maintenance" className="text-[#219377] text-base hover:text-[#ffbd59] font-semibold transition">View All Maintenance &rarr;</Link>
        </div>
        {scheduledMaintenanceTasks.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">No upcoming scheduled maintenance tasks.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledMaintenanceTasks.slice(0, 6).map((task) => (
              <div key={task._id} className="bg-[#f8fafc] p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-[#9467bd] mr-2" />
                  <h3 className="text-lg font-medium" style={{ color: PRIMARY }}>{task.title}</h3>
                </div>
                <p className="text-gray-700 text-sm truncate">{task.description}</p>
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>Property:</strong> {task.property?.name || 'N/A'}</p>
                  {task.unit && <p><strong>Unit:</strong> {task.unit?.unitName || 'N/A'}</p>}
                  <p><strong>Date:</strong> {new Date(task.scheduledDate).toLocaleDateString()}</p>
                  <p><strong>Category:</strong> <span className="capitalize">{task.category}</span></p>
                  <p><strong>Status:</strong> <span className={getStatusBadgeClass(task.status)}>{task.status}</span></p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link to={`/pm/scheduled-maintenance/${task._id}`} className="text-[#3390ec] hover:underline text-sm">Details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 h-24 focus:ring-[#219377] focus:border-[#219377]"
              maxLength={1000}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddPropertyModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-[#219377] hover:bg-[#ffbd59] text-white py-2 px-4 rounded-lg transition">Add Property</Button>
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          <div>
            <label htmlFor="addVendorDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="addVendorDescription"
              name="description"
              value={vendorForm.description}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 h-24 focus:ring-[#219377] focus:border-[#219377]"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddVendorModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-[#9467bd] hover:bg-[#7e4e9e] text-white py-2 px-4 rounded-lg transition">Add Vendor</Button>
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 h-24 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
                className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
              className="mt-1 block w-full border border-[#e6f7f2] rounded-lg shadow-sm p-2 focus:ring-[#219377] focus:border-[#219377]"
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
            <Button type="button" onClick={() => setShowScheduleMaintenanceModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-[#22bfa1] hover:bg-[#1c9a82] text-white py-2 px-4 rounded-lg transition">Schedule Task</Button>
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
                className="w-full px-3 py-2 border border-[#e6f7f2] rounded-lg focus:ring-[#219377] focus:border-[#219377]"
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
                className="w-full px-3 py-2 border border-[#e6f7f2] rounded-lg focus:ring-[#219377] focus:border-[#219377]"
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
                className="w-full px-3 py-2 border border-[#e6f7f2] rounded-lg focus:ring-[#219377] focus:border-[#219377]"
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
                  className="w-full px-3 py-2 border border-[#e6f7f2] rounded-lg focus:ring-[#219377] focus:border-[#219377]"
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
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#3390ec] hover:bg-[#217fc9] text-white py-2 px-4 rounded-lg transition"
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
