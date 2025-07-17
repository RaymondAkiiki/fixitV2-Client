// frontend/src/pages/pm/PMDashboard.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrench, Building, Users, Package, Clock, Send, FileText, PlusCircle, Home, DollarSign, CalendarDays
} from "lucide-react";

// Service Imports
import { getAllProperties, createProperty } from "../../services/propertyService.js";
import { getAllRequests, assignRequest, updateRequest } from "../../services/requestService.js";
import { getAllVendors, createVendor } from "../../services/vendorService.js";
import { getAllScheduledMaintenance, createScheduledMaintenance } from "../../services/scheduledMaintenanceService.js";
import { getMyProfile, getAllUsers } from "../../services/userService.js";
import { createInvite } from "../../services/inviteService.js";
import { getAllNotifications, markNotificationAsRead } from "../../services/notificationService.js";
import { getLeases } from "../../services/leaseService.js"; // New: Lease Service
import { getRentEntries } from "../../services/rentService.js"; // New: Rent Service

// Component Imports
import { Tabs } from '../../components/common/Tabs.jsx';
import DashboardFilters from "../../components/common/DashboardFilters.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx"; // Standardized Spinner
import StatCard from "../../components/admin/StatCard.jsx"; // Reusing StatCard
import Input from "../../components/common/Input.jsx"; // Reusing Input
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx"; // Global Alert
import useForm from "../../hooks/useForm.js"; // useForm hook

// Constants & Helpers
import {
  REQUEST_STATUSES,
  SCHEDULED_MAINTENANCE_STATUS_ENUM,
  MAINTENANCE_CATEGORIES,
  USER_ROLES,
  LEASE_STATUS_ENUM,
  RENT_STATUS_ENUM, // Assuming this exists or defining it here
  ROUTES
} from "../../utils/constants.js";
import { formatDate, formatDateTime } from "../../utils/helpers.js";

// Define Rent Status Enum if not in constants.js
// const RENT_STATUS_ENUM = {
//   PAID: 'Paid',
//   DUE: 'Due',
//   OVERDUE: 'Overdue',
//   PARTIALLY_PAID: 'Partially Paid',
// };

// Brand palette (re-defined for clarity, but ideally from a theme file)
const PRIMARY = "#219377";
const SECONDARY = "#ffbd59";

// Re-usable status badge components
const getStatusBadgeClass = (status) => {
  const s = (status || "").toLowerCase();
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (s) {
    case REQUEST_STATUSES.NEW:
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.ACTIVE: return `${base} bg-blue-100 text-blue-800`;
    case REQUEST_STATUSES.ASSIGNED: return `${base} bg-purple-100 text-purple-800`;
    case REQUEST_STATUSES.IN_PROGRESS:
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.IN_PROGRESS: return `${base} bg-yellow-100 text-yellow-800`;
    case REQUEST_STATUSES.COMPLETED:
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.COMPLETED: return `${base} bg-green-100 text-green-800`;
    case REQUEST_STATUSES.VERIFIED: return `${base} bg-teal-100 text-teal-800`;
    case REQUEST_STATUSES.REOPENED: return `${base} bg-orange-100 text-orange-800`;
    case REQUEST_STATUSES.ARCHIVED: return `${base} bg-gray-200 text-gray-800`;
    case REQUEST_STATUSES.CANCELED:
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.CANCELED: return `${base} bg-red-100 text-red-800`;
    default: return `${base} bg-gray-100 text-gray-700`;
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

const LeaseStatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case LEASE_STATUS_ENUM.ACTIVE: return `${base} bg-green-100 text-green-800`;
    case LEASE_STATUS_ENUM.EXPIRED: return `${base} bg-red-100 text-red-800`;
    case LEASE_STATUS_ENUM.PENDING_RENEWAL: return `${base} bg-yellow-100 text-yellow-800`;
    case LEASE_STATUS_ENUM.TERMINATED: return `${base} bg-gray-100 text-gray-800`;
    case LEASE_STATUS_ENUM.DRAFT: return `${base} bg-blue-100 text-blue-800`;
    default: return `${base} bg-gray-100 text-gray-800`;
  }
};

const PaymentStatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case RENT_STATUS_ENUM.PAID: return `${base} bg-green-100 text-green-800`;
    case RENT_STATUS_ENUM.DUE: return `${base} bg-yellow-100 text-yellow-800`;
    case RENT_STATUS_ENUM.OVERDUE: return `${base} bg-red-100 text-red-800`;
    case RENT_STATUS_ENUM.PARTIALLY_PAID: return `${base} bg-orange-100 text-orange-800`;
    default: return `${base} bg-gray-100 text-gray-800`;
  }
};


const tabs = [
  { name: "all", label: "All" },
  { name: REQUEST_STATUSES.NEW, label: "New" },
  { name: REQUEST_STATUSES.ASSIGNED, label: "Assigned" },
  { name: REQUEST_STATUSES.IN_PROGRESS, label: "In Progress" },
  { name: REQUEST_STATUSES.COMPLETED, label: "Completed" },
  { name: REQUEST_STATUSES.VERIFIED, label: "Verified" },
  { name: REQUEST_STATUSES.ARCHIVED, label: "Archived" },
  { name: REQUEST_STATUSES.CANCELED, label: "Canceled" }
];

export default function PMDashboard() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();

  // --- State ---
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [scheduledMaintenanceTasks, setScheduledMaintenanceTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leases, setLeases] = useState([]); // New state for leases
  const [rents, setRents] = useState([]); // New state for rents

  const [loading, setLoading] = useState(true); // Overall dashboard loading
  const [loadingRequests, setLoadingRequests] = useState(false); // Specific loading for requests table

  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({ search: "", propertyId: "", category: "" });

  // --- Modals State ---
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [showScheduleMaintenanceModal, setShowScheduleMaintenanceModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // --- Data Fetching ---
  const fetchAllDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        userProfile,
        propertiesData,
        vendorsData,
        usersData,
        scheduledMaintenanceData,
        notificationsData,
        leasesData, // Fetch leases
        rentsData // Fetch rents
      ] = await Promise.all([
        getMyProfile(),
        getAllProperties(),
        getAllVendors(),
        getAllUsers(),
        getAllScheduledMaintenance(),
        getAllNotifications(),
        getLeases(), // Call lease service
        getRentEntries() // Call rent service
      ]);

      setProfile(userProfile);
      setProperties(propertiesData);
      setVendors(vendorsData);
      setUsers(usersData);
      setScheduledMaintenanceTasks(scheduledMaintenanceData?.tasks || []);
      setNotifications(notificationsData);
      setLeases(leasesData); // Set leases
      setRents(rentsData); // Set rents

    } catch (err) {
      const message = err.response?.data?.message || "Failed to load dashboard data. Please check your network and try again.";
      showError(message);
      // Clear data on error
      setProperties([]);
      setVendors([]);
      setUsers([]);
      setScheduledMaintenanceTasks([]);
      setNotifications([]);
      setLeases([]);
      setRents([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  // Requests filtered by tab and filters
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
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
      showError("Failed to load service requests.");
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [activeTab, filters, showError]);

  useEffect(() => {
    // Only fetch requests once initial dashboard data is loaded
    if (!loading) {
      fetchRequests();
    }
  }, [fetchRequests, loading]);


  // --- Quick Add Property Form with useForm ---
  const {
    values: propertyForm,
    errors: propertyFormErrors,
    handleChange: handlePropertyFormChange,
    handleSubmit: handleAddPropertySubmit,
    isSubmitting: isAddingProperty,
    resetForm: resetPropertyForm
  } = useForm(
    { name: "", address: { street: "", city: "", state: "", country: "" }, details: "" },
    (values) => {
      const errors = {};
      if (!values.name.trim()) errors.name = "Property name is required.";
      if (!values.address.city.trim()) errors.address = { city: "City is required." };
      if (!values.address.country.trim()) errors.address = { country: "Country is required." };
      return errors;
    },
    async (formValues) => {
      try {
        await createProperty(formValues);
        showSuccess("Property added successfully!");
        setShowAddPropertyModal(false);
        resetPropertyForm();
        await fetchAllDashboardData(); // Refresh all data
      } catch (err) {
        showError("Failed to add property: " + (err.response?.data?.message || err.message));
      }
    }
  );

  // --- Invite User Form with useForm ---
  const {
    values: inviteForm,
    errors: inviteFormErrors,
    handleChange: handleInviteFormChange,
    handleSubmit: handleCreateInvite,
    isSubmitting: isSendingInvite,
    resetForm: resetInviteForm
  } = useForm(
    { email: "", role: USER_ROLES.TENANT, propertyId: "", unitId: "" },
    (values) => {
      const errors = {};
      if (!values.email.trim()) errors.email = "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Invalid email format.";
      if (!values.propertyId) errors.propertyId = "Property must be selected.";
      return errors;
    },
    async (formValues) => {
      try {
        await createInvite(formValues);
        showSuccess('Invitation sent successfully!');
        setShowInviteModal(false);
        resetInviteForm();
      } catch (err) {
        showError('Failed to send invitation: ' + (err.response?.data?.message || err.message));
      }
    }
  );

  const handleInvitePropertyChange = (e) => {
    const propertyId = e.target.value;
    handleInviteFormChange({ target: { name: 'propertyId', value: propertyId } });
    handleInviteFormChange({ target: { name: 'unitId', value: '' } }); // Reset unit when property changes
  };


  // --- Vendor CRUD Form with useForm ---
  const {
    values: vendorForm,
    errors: vendorFormErrors,
    handleChange: handleCreateVendorFormChange,
    handleSubmit: handleCreateVendorSubmit,
    isSubmitting: isAddingVendor,
    resetForm: resetVendorForm
  } = useForm(
    { name: "", phone: "", email: "", service: "", address: "", description: "" },
    (values) => {
      const errors = {};
      if (!values.name.trim()) errors.name = "Vendor name is required.";
      if (!values.email.trim()) errors.email = "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Invalid email format.";
      if (!values.phone.trim()) errors.phone = "Phone number is required.";
      if (!values.service.trim()) errors.service = "Service type is required.";
      return errors;
    },
    async (formValues) => {
      try {
        const payload = { ...formValues, services: [formValues.service] }; // Backend expects services as an array
        delete payload.service; // Remove singular service field
        await createVendor(payload);
        showSuccess("Vendor added successfully!");
        setShowCreateVendorModal(false);
        resetVendorForm();
        await fetchAllDashboardData();
      } catch (err) {
        showError("Failed to add vendor: " + (err.response?.data?.message || err.message));
      }
    }
  );

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

  // --- Scheduled Maintenance Form with useForm ---
  const [unitsForAddTask, setUnitsForAddTask] = useState([]);

  const {
    values: taskForm,
    errors: taskFormErrors,
    handleChange: handleAddTaskFormChange,
    handleSubmit: handleAddTaskSubmit,
    isSubmitting: isSchedulingTask,
    resetForm: resetTaskForm
  } = useForm(
    {
      title: "",
      description: "",
      category: "",
      property: "",
      unit: "",
      scheduledDate: "",
      recurring: false,
      frequency: {
        frequencyType: "", // e.g., 'daily', 'weekly', 'monthly', 'yearly', 'custom'
        interval: 1,
        daysOfWeek: [], // For weekly
        dayOfMonth: null, // For monthly/yearly
        monthOfYear: null, // For yearly
        customDays: [], // For custom
        endsType: "never", // 'never', 'after_occurrences', 'on_date'
        endsAfter: null,
        endsOnDate: null
      },
      assignedTo: "" // Vendor ID
    },
    (values) => {
      const errors = {};
      if (!values.title.trim()) errors.title = "Title is required.";
      if (!values.description.trim()) errors.description = "Description is required.";
      if (!values.category.trim()) errors.category = "Category is required.";
      if (!values.property.trim()) errors.property = "Property is required.";
      if (!values.scheduledDate) errors.scheduledDate = "Scheduled date is required.";

      if (values.recurring) {
        if (!values.frequency.frequencyType) errors.frequency = { frequencyType: "Frequency type is required." };
        if (values.frequency.frequencyType === 'weekly' && values.frequency.daysOfWeek?.length === 0) {
          errors.frequency = { daysOfWeek: "At least one day of the week is required for weekly recurrence." };
        }
        // Add more complex recurrence validation if needed
      }
      return errors;
    },
    async (formValues) => {
      try {
        const payload = {
          ...formValues,
          category: (formValues.category || "").toLowerCase(),
          scheduledDate: formValues.scheduledDate, // Ensure date format is correct for backend
          assignedTo: formValues.assignedTo || undefined, // Send as undefined if not selected
          frequency: formValues.recurring ? buildBackendFrequency(formValues.frequency) : undefined
        };
        await createScheduledMaintenance(payload);
        showSuccess("Scheduled maintenance task added!");
        setShowScheduleMaintenanceModal(false);
        resetTaskForm();
        setUnitsForAddTask([]); // Clear units
        await fetchAllDashboardData();
      } catch (err) {
        showError("Failed to add scheduled maintenance: " + (err.response?.data?.message || err.message));
      }
    }
  );

  // Effect to update units for task form when property changes
  useEffect(() => {
    if (taskForm.property) {
      const selectedProperty = properties.find(p => p._id === taskForm.property);
      setUnitsForAddTask(selectedProperty?.units || []);
    } else {
      setUnitsForAddTask([]);
    }
  }, [taskForm.property, properties]);


  // Helper for recurring frequency payload
  function buildBackendFrequency(frequencyForm) {
    let backend = {};
    let freqType = (frequencyForm.frequencyType || "").toLowerCase();
    if (freqType === "custom") freqType = "custom_days"; // Align with backend enum if different
    backend.type = freqType;
    backend.interval = Math.max(1, parseInt(frequencyForm.interval, 10) || 1);

    if (freqType === "weekly" && Array.isArray(frequencyForm.daysOfWeek)) {
      // Assuming daysOfWeek are strings like "Monday", "Tuesday"
      backend.dayOfWeek = frequencyForm.daysOfWeek;
    }
    if (freqType === "monthly" && frequencyForm.dayOfMonth) {
      backend.dayOfMonth = parseInt(frequencyForm.dayOfMonth, 10);
    }
    if (freqType === "yearly") {
      if (frequencyForm.dayOfMonth) backend.dayOfMonth = parseInt(frequencyForm.dayOfMonth, 10);
      if (frequencyForm.monthOfYear) backend.monthOfYear = parseInt(frequencyForm.monthOfYear, 10); // Month number (1-12)
    }
    if (freqType === "custom_days" && Array.isArray(frequencyForm.customDays)) {
      backend.customDays = frequencyForm.customDays.map(day => parseInt(day, 10));
    }

    // Recurrence end settings
    backend.endsType = frequencyForm.endsType || "never";
    if (backend.endsType === "after_occurrences" && frequencyForm.endsAfter) {
      backend.endsAfter = parseInt(frequencyForm.endsAfter, 10);
    }
    if (backend.endsType === "on_date" && frequencyForm.endsOnDate) {
      backend.endsOnDate = frequencyForm.endsOnDate; // Date string
    }
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
      showSuccess(`Request status updated to "${newStatus.replace(/_/g, ' ')}"!`);
      fetchRequests();
    } catch (err) {
      showError(`Failed to update request status: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    } catch (err) {
      // Silent fail, as it's a non-critical UI update
      console.error("Failed to mark notification as read:", err);
    }
  };

  // --- Stats for Summary Cards ---
  const stats = [
    { label: "Total Requests", count: requests.length, icon: Wrench, color: PRIMARY },
    { label: "Pending Review", count: requests.filter((r) => r.status === REQUEST_STATUSES.NEW).length, icon: Clock, color: "#3390ec" },
    { label: "In Progress", count: requests.filter((r) => r.status === REQUEST_STATUSES.IN_PROGRESS || r.status === REQUEST_STATUSES.ASSIGNED).length, icon: Wrench, color: "#f5983c" },
    { label: "Completed", count: requests.filter((r) => r.status === REQUEST_STATUSES.COMPLETED || r.status === REQUEST_STATUSES.VERIFIED).length, icon: PlusCircle, color: "#22bfa1" },
    { label: "Managed Properties", count: properties.length, icon: Building, color: SECONDARY },
    { label: "Active Tenants", count: users.filter(u => u.role === USER_ROLES.TENANT && u.isActive).length, icon: Users, color: PRIMARY },
    { label: "Registered Vendors", count: vendors.length, icon: Package, color: "#9467bd" },
    { label: "Active Leases", count: leases.filter(l => l.status === LEASE_STATUS_ENUM.ACTIVE).length, icon: FileText, color: "#a855f7" }, // New Lease Stat
    { label: "Upcoming Payments Due", count: rents.filter(r => r.paymentStatus === RENT_STATUS_ENUM.DUE || r.paymentStatus === RENT_STATUS_ENUM.OVERDUE).length, icon: DollarSign, color: "#ef4444" }, // New Rent Stat
  ];


  // --- Main Render ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" color={PRIMARY} className="mr-4" />
        <p className="text-xl text-gray-700 font-semibold">Loading Property Manager Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-full p-6 sm:p-8">
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: PRIMARY }}>
        Welcome, {profile?.name || profile?.email}!
      </h1>
      <p className="text-lg text-gray-700 mb-8">Your central hub for managing properties, requests, and personnel.</p>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <StatCard
            key={stat.label}
            title={stat.label}
            value={stat.count}
            icon={stat.icon}
            color={stat.color}
          />
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
              onClick={() => setShowCreateVendorModal(true)}
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
            <Link to={ROUTES.REQUEST_ADD} className="flex items-center justify-center p-4 bg-[#9467bd] hover:bg-[#7e4e9e] text-white rounded-lg shadow-md transition">
              <PlusCircle className="w-5 h-5 mr-2" /> Create New Request
            </Link>
            <Link to={ROUTES.PM_REPORTS} className="flex items-center justify-center p-4 bg-[#f5983c] hover:bg-[#df7d0d] text-white rounded-lg shadow-md transition">
              <FileText className="w-5 h-5 mr-2" /> View Reports
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-5 flex justify-between items-center" style={{ color: PRIMARY }}>
            Recent Notifications
            <Link to={ROUTES.NOTIFICATIONS} className="text-[#219377] text-base hover:text-[#ffbd59] font-semibold transition">View All</Link>
          </h2>
          {notifications.length === 0 ? (
            <p className="text-gray-600 italic">No recent notifications.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.slice(0, 5).map(notif => (
                <li key={notif._id} className={`py-3 ${notif.isRead ? 'text-gray-500' : 'font-semibold text-gray-800'}`}>
                  <Link
                    to={notif.link || '#'} // Assuming notifications might have a link
                    onClick={() => handleMarkNotificationRead(notif._id)}
                    className="hover:underline"
                  >
                    {notif.message} <span className="text-gray-500 text-sm ml-2">({formatDateTime(notif.createdAt)})</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Lease Agreements Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-orange-600 flex items-center">
            <FileText className="w-6 h-6 mr-2" /> Lease Agreements
          </h3>
          <Link
            to={ROUTES.LEASES}
            className="text-blue-600 hover:underline font-medium"
          >
            View All Leases &rarr;
          </Link>
        </div>
        {leases.length === 0 ? (
          <p className="text-gray-600 italic">No lease agreements found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property / Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lease Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rent Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leases.slice(0, 5).map((lease) => ( // Show top 5 recent leases
                  <tr key={lease._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lease.property?.name || "N/A"} / {lease.unit?.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lease.tenant?.name || lease.tenant?.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <LeaseStatusBadge status={lease.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ${lease.rentAmount?.toFixed(2) || "0.00"} / {lease.rentFrequency || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={ROUTES.LEASE_DETAILS.replace(':leaseId', lease._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Ledger Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-orange-600 flex items-center">
            <DollarSign className="w-6 h-6 mr-2" /> Recent Payments
          </h3>
          <Link
            to={ROUTES.PAYMENTS}
            className="text-blue-600 hover:underline font-medium"
          >
            View All Payments &rarr;
          </Link>
        </div>
        {rents.length === 0 ? (
          <p className="text-gray-600 italic">No recent payment records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property / Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rents.slice(0, 5).map((rent) => ( // Show top 5 recent payments
                  <tr key={rent._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rent.property?.name || "N/A"} / {rent.unit?.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {rent.tenant?.name || rent.tenant?.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ${rent.amountDue?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(rent.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      <PaymentStatusBadge status={rent.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {rent.paidAt ? formatDateTime(rent.paidAt) : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={ROUTES.PAYMENT_DETAILS.replace(':paymentId', rent._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      {/* Add actions like "Mark Paid" if applicable for PM */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Requests Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold" style={{ color: PRIMARY }}>Service Requests</h2>
          <Link to={ROUTES.REQUESTS} className="text-[#219377] text-base hover:text-[#ffbd59] font-semibold transition">View All Requests &rarr;</Link>
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
            <LoadingSpinner size="md" color={PRIMARY} />
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
                      <Link to={ROUTES.REQUEST_DETAILS.replace(':requestId', req._id)} className="text-[#219377] hover:underline font-semibold">
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
                      {!req.assignedTo && req.status !== REQUEST_STATUSES.COMPLETED && req.status !== REQUEST_STATUSES.ARCHIVED && (
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
                      {req.status === REQUEST_STATUSES.NEW && (
                        <Button onClick={() => handleMarkStatus(req._id, REQUEST_STATUSES.IN_PROGRESS)} className="bg-[#f5983c] hover:bg-[#e09d17] text-white px-3 py-1 rounded-md text-xs mr-2">
                          Start Progress
                        </Button>
                      )}
                      {req.status === REQUEST_STATUSES.IN_PROGRESS && (
                        <Button onClick={() => handleMarkStatus(req._id, REQUEST_STATUSES.COMPLETED)} className="bg-[#22bfa1] hover:bg-[#1c9a82] text-white px-3 py-1 rounded-md text-xs mr-2">
                          Mark Completed
                        </Button>
                      )}
                      {req.status === REQUEST_STATUSES.COMPLETED && (
                        <Button onClick={() => handleMarkStatus(req._id, REQUEST_STATUSES.VERIFIED)} className="bg-[#219377] hover:bg-[#197a66] text-white px-3 py-1 rounded-md text-xs mr-2">
                          Verify
                        </Button>
                      )}
                      {req.status === REQUEST_STATUSES.VERIFIED && (
                        <Button onClick={() => handleMarkStatus(req._id, REQUEST_STATUSES.ARCHIVED)} className="bg-gray-400 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-xs">
                          Archive
                        </Button>
                      )}
                      {req.status !== REQUEST_STATUSES.ARCHIVED && (
                        <Link to={ROUTES.REQUEST_DETAILS.replace(':requestId', req._id)} className="text-[#3390ec] hover:underline text-xs ml-2">Details</Link>
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
          <Link to={ROUTES.SCHEDULED_MAINTENANCE} className="text-[#219377] text-base hover:text-[#ffbd59] font-semibold transition">View All Maintenance &rarr;</Link>
        </div>
        {scheduledMaintenanceTasks.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">No upcoming scheduled maintenance tasks.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledMaintenanceTasks.slice(0, 6).map((task) => (
              <div key={task._id} className="bg-[#f8fafc] p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-2">
                  <CalendarDays className="w-5 h-5 text-[#9467bd] mr-2" />
                  <h3 className="text-lg font-medium" style={{ color: PRIMARY }}>{task.title}</h3>
                </div>
                <p className="text-gray-700 text-sm truncate">{task.description}</p>
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>Property:</strong> {task.property?.name || 'N/A'}</p>
                  {task.unit && <p><strong>Unit:</strong> {task.unit?.unitName || 'N/A'}</p>}
                  <p><strong>Date:</strong> {formatDate(task.scheduledDate)}</p>
                  <p><strong>Category:</strong> <span className="capitalize">{task.category}</span></p>
                  <p><strong>Status:</strong> <span className={getStatusBadgeClass(task.status)}>{task.status}</span></p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link to={ROUTES.SCHEDULED_MAINTENANCE_DETAILS.replace(':taskId', task._id)} className="text-[#3390ec] hover:underline text-sm">Details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      <Modal
        isOpen={showAddPropertyModal}
        onClose={() => { setShowAddPropertyModal(false); resetPropertyForm(); }}
        title="Add New Property"
      >
        <form onSubmit={handleAddPropertySubmit} className="p-4 space-y-4">
          <Input
            label="Property Name"
            id="modalPropertyName"
            name="name"
            type="text"
            value={propertyForm.name}
            onChange={handlePropertyFormChange}
            required
            error={propertyFormErrors.name}
            disabled={isAddingProperty}
          />
          <Input
            label="Street Address"
            id="modalPropertyStreet"
            name="address.street"
            type="text"
            value={propertyForm.address.street}
            onChange={handlePropertyFormChange}
            error={propertyFormErrors.address?.street}
            disabled={isAddingProperty}
          />
          <Input
            label="City"
            id="modalPropertyCity"
            name="address.city"
            type="text"
            value={propertyForm.address.city}
            onChange={handlePropertyFormChange}
            required
            error={propertyFormErrors.address?.city}
            disabled={isAddingProperty}
          />
          <Input
            label="State / Province"
            id="modalPropertyState"
            name="address.state"
            type="text"
            value={propertyForm.address.state}
            onChange={handlePropertyFormChange}
            error={propertyFormErrors.address?.state}
            disabled={isAddingProperty}
          />
          <Input
            label="Country"
            id="modalPropertyCountry"
            name="address.country"
            type="text"
            value={propertyForm.address.country}
            onChange={handlePropertyFormChange}
            required
            error={propertyFormErrors.address?.country}
            disabled={isAddingProperty}
          />
          <div className="relative">
            <label htmlFor="modalPropertyDetails" className="block text-sm font-medium text-gray-700 mb-1">
              Details (Max 1000 chars)
            </label>
            <textarea
              id="modalPropertyDetails"
              name="details"
              value={propertyForm.details}
              onChange={handlePropertyFormChange}
              className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${propertyFormErrors.details ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${isAddingProperty ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              maxLength={1000}
              disabled={isAddingProperty}
            ></textarea>
            {propertyFormErrors.details && <p className="mt-1 text-xs text-red-500">{propertyFormErrors.details}</p>}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => { setShowAddPropertyModal(false); resetPropertyForm(); }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
              disabled={isAddingProperty}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#219377] hover:bg-[#1a7b64] text-white py-2 px-4 rounded-lg transition"
              loading={isAddingProperty}
              disabled={isAddingProperty}
            >
              Add Property
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showCreateVendorModal}
        onClose={() => { setShowCreateVendorModal(false); resetVendorForm(); }}
        title="Add New Vendor"
      >
        <form onSubmit={handleCreateVendorSubmit} className="p-4 space-y-4">
          <Input
            label="Vendor Name"
            id="createVendorName"
            name="name"
            type="text"
            value={vendorForm.name}
            onChange={handleCreateVendorFormChange}
            required
            error={vendorFormErrors.name}
            disabled={isAddingVendor}
          />
          <Input
            label="Email"
            id="createVendorEmail"
            name="email"
            type="email"
            value={vendorForm.email}
            onChange={handleCreateVendorFormChange}
            required
            error={vendorFormErrors.email}
            disabled={isAddingVendor}
          />
          <Input
            label="Phone"
            id="createVendorPhone"
            name="phone"
            type="text"
            value={vendorForm.phone}
            onChange={handleCreateVendorFormChange}
            required
            error={vendorFormErrors.phone}
            disabled={isAddingVendor}
          />
          <div>
            <label htmlFor="createVendorService" className="block text-sm font-medium text-gray-700 mb-1">Service <span className="text-red-500">*</span></label>
            <select
              id="createVendorService"
              name="service"
              value={vendorForm.service}
              onChange={handleCreateVendorFormChange}
              className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${vendorFormErrors.service ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${isAddingVendor ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              required
              disabled={isAddingVendor}
            >
              <option value="">Select Service</option>
              {serviceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {vendorFormErrors.service && <p className="mt-1 text-xs text-red-500">{vendorFormErrors.service}</p>}
          </div>
          <Input
            label="Address"
            id="createVendorAddress"
            name="address"
            type="text"
            value={vendorForm.address}
            onChange={handleCreateVendorFormChange}
            error={vendorFormErrors.address}
            disabled={isAddingVendor}
          />
          <div className="relative">
            <label htmlFor="createVendorDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="createVendorDescription"
              name="description"
              value={vendorForm.description}
              onChange={handleCreateVendorFormChange}
              className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${vendorFormErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${isAddingVendor ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              disabled={isAddingVendor}
            ></textarea>
            {vendorFormErrors.description && <p className="mt-1 text-xs text-red-500">{vendorFormErrors.description}</p>}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => { setShowCreateVendorModal(false); resetVendorForm(); }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
              disabled={isAddingVendor}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#9467bd] hover:bg-[#7e4e9e] text-white py-2 px-4 rounded-lg transition"
              loading={isAddingVendor}
              disabled={isAddingVendor}
            >
              Add Vendor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={showScheduleMaintenanceModal}
        onClose={() => { setShowScheduleMaintenanceModal(false); resetTaskForm(); setUnitsForAddTask([]); }}
        title="Schedule New Maintenance"
      >
        <form onSubmit={handleAddTaskSubmit} className="p-4 space-y-4">
          <Input
            label="Title"
            id="modalTaskTitle"
            name="title"
            type="text"
            value={taskForm.title}
            onChange={handleAddTaskFormChange}
            required
            error={taskFormErrors.title}
            disabled={isSchedulingTask}
          />
          <div className="relative">
            <label htmlFor="modalTaskDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="modalTaskDescription"
              name="description"
              value={taskForm.description}
              onChange={handleAddTaskFormChange}
              className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${taskFormErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${isSchedulingTask ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              required
              disabled={isSchedulingTask}
            ></textarea>
            {taskFormErrors.description && <p className="mt-1 text-xs text-red-500">{taskFormErrors.description}</p>}
          </div>
          <div>
            <label htmlFor="modalTaskCategory" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
            <select
              id="modalTaskCategory"
              name="category"
              value={taskForm.category}
              onChange={handleAddTaskFormChange}
              className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${taskFormErrors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${isSchedulingTask ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              required
              disabled={isSchedulingTask}
            >
              <option value="">Select Category</option>
              {Object.values(MAINTENANCE_CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
              ))}
            </select>
            {taskFormErrors.category && <p className="mt-1 text-xs text-red-500">{taskFormErrors.category}</p>}
          </div>
          <div>
            <label htmlFor="modalTaskProperty" className="block text-sm font-medium text-gray-700 mb-1">Property <span className="text-red-500">*</span></label>
            <select
              id="modalTaskProperty"
              name="property"
              value={taskForm.property}
              onChange={handleAddTaskFormChange}
              className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${taskFormErrors.property ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${isSchedulingTask ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              required
              disabled={isSchedulingTask}
            >
              <option value="">Select Property</option>
              {properties.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {taskFormErrors.property && <p className="mt-1 text-xs text-red-500">{taskFormErrors.property}</p>}
          </div>
          {taskForm.property && (
            <div>
              <label htmlFor="modalTaskUnit" className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional)</label>
              <select
                id="modalTaskUnit"
                name="unit"
                value={taskForm.unit}
                onChange={handleAddTaskFormChange}
                className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                  ${taskFormErrors.unit ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                  ${isSchedulingTask ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
                `}
                disabled={isSchedulingTask}
              >
                <option value="">Select Unit</option>
                {unitsForAddTask.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                ))}
              </select>
              {taskFormErrors.unit && <p className="mt-1 text-xs text-red-500">{taskFormErrors.unit}</p>}
            </div>
          )}
          <div>
            <label htmlFor="modalTaskVendor" className="block text-sm font-medium text-gray-700 mb-1">Assign to Vendor (optional)</label>
            <select
              id="modalTaskVendor"
              name="assignedTo"
              value={taskForm.assignedTo}
              onChange={handleAddTaskFormChange}
              className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${taskFormErrors.assignedTo ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${isSchedulingTask ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              disabled={isSchedulingTask}
            >
              <option value="">Do not assign</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
            {taskFormErrors.assignedTo && <p className="mt-1 text-xs text-red-500">{taskFormErrors.assignedTo}</p>}
          </div>
          <Input
            label="Scheduled Date"
            id="modalTaskScheduledDate"
            name="scheduledDate"
            type="date"
            value={taskForm.scheduledDate}
            onChange={handleAddTaskFormChange}
            required
            error={taskFormErrors.scheduledDate}
            disabled={isSchedulingTask}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="modalTaskRecurring"
              name="recurring"
              checked={taskForm.recurring}
              onChange={handleAddTaskFormChange}
              className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              disabled={isSchedulingTask}
            />
            <label htmlFor="modalTaskRecurring" className="ml-2 block text-sm text-gray-900">Recurring Task</label>
          </div>
          {/* Recurring section placeholder - you would integrate your RecurringSection component here */}
          {/* {taskForm.recurring && <RecurringSection form={taskForm} setForm={setTaskForm} />} */}
          {taskForm.recurring && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h4 className="text-md font-semibold text-gray-800">Recurrence Details</h4>
              <div>
                <label htmlFor="frequencyType" className="block text-sm font-medium text-gray-700 mb-1">Frequency Type</label>
                <select
                  id="frequencyType"
                  name="frequency.frequencyType"
                  value={taskForm.frequency.frequencyType}
                  onChange={handleAddTaskFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  disabled={isSchedulingTask}
                >
                  <option value="">Select Type</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {taskFormErrors.frequency?.frequencyType && <p className="mt-1 text-xs text-red-500">{taskFormErrors.frequency.frequencyType}</p>}
              </div>
              {/* Add more recurrence fields based on frequencyType as needed, with appropriate validation */}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => { setShowScheduleMaintenanceModal(false); resetTaskForm(); setUnitsForAddTask([]); }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
              disabled={isSchedulingTask}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#22bfa1] hover:bg-[#1c9a82] text-white py-2 px-4 rounded-lg transition"
              loading={isSchedulingTask}
              disabled={isSchedulingTask}
            >
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => { setShowInviteModal(false); resetInviteForm(); }}
        title="Invite New User"
      >
        <form onSubmit={handleCreateInvite} className="p-4 space-y-4">
          <p className="text-gray-700 mb-4">
            Send an invitation to a new user. They will be prompted to set up their account and link to a specific property and unit if applicable.
          </p>
          <Input
            label="User Email"
            id="inviteEmail"
            name="email"
            type="email"
            value={inviteForm.email}
            onChange={handleInviteFormChange}
            placeholder="user@example.com"
            required
            error={inviteFormErrors.email}
            disabled={isSendingInvite}
          />
          <div>
            <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
            <select
              id="inviteRole"
              name="role"
              value={inviteForm.role}
              onChange={handleInviteFormChange}
              className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${inviteFormErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${isSendingInvite ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              required
              disabled={isSendingInvite}
            >
              {Object.values(USER_ROLES).map(role => (
                <option key={role} value={role}>{role.replace(/_/g, ' ').charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}</option>
              ))}
            </select>
            {inviteFormErrors.role && <p className="mt-1 text-xs text-red-500">{inviteFormErrors.role}</p>}
          </div>
          <div>
            <label htmlFor="inviteProperty" className="block text-sm font-medium text-gray-700 mb-1">Property <span className="text-red-500">*</span></label>
            <select
              id="inviteProperty"
              name="propertyId"
              value={inviteForm.propertyId}
              onChange={handleInvitePropertyChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-[#219377] focus:border-[#219377]
                ${inviteFormErrors.propertyId ? 'border-red-500' : 'border-gray-300'}
              `}
              required
              disabled={isSendingInvite}
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>
            {inviteFormErrors.propertyId && <p className="mt-1 text-xs text-red-500">{inviteFormErrors.propertyId}</p>}
          </div>
          {inviteForm.propertyId && (
            <div>
              <label htmlFor="inviteUnit" className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional, but recommended for tenants):</label>
              <select
                id="inviteUnit"
                name="unitId"
                value={inviteForm.unitId}
                onChange={handleInviteFormChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-[#219377] focus:border-[#219377]
                  ${inviteFormErrors.unitId ? 'border-red-500' : 'border-gray-300'}
                `}
                disabled={isSendingInvite}
              >
                <option value="">Select Unit (Optional)</option>
                {properties.find(p => p._id === inviteForm.propertyId)?.units?.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                ))}
              </select>
              {inviteFormErrors.unitId && <p className="mt-1 text-xs text-red-500">{inviteFormErrors.unitId}</p>}
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => { setShowInviteModal(false); resetInviteForm(); }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
              disabled={isSendingInvite}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#3390ec] hover:bg-[#217fc9] text-white py-2 px-4 rounded-lg transition"
              loading={isSendingInvite}
              disabled={isSendingInvite}
            >
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
