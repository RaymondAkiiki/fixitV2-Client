// frontend/src/pages/pm/PMDashboard.jsx

  

import React, { useState, useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";

import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout"; // New PM-specific layout

  

// Import updated service functions

import { getMyProfile } from "../../services/userService"; // Renamed from getProfile

import { getAllProperties } from "../../services/propertyService";

import { getAllRequests } from "../../services/requestService"; // getAllRequests for filtered data

import { getAllVendors } from "../../services/vendorService";

import { getAllScheduledMaintenance } from "../../services/scheduledMaintenanceService"; // Renamed from getUserTasks

  

// Common UI components (assuming they exist or will be created)

import Modal from "../../components/common/Modal"; // For forms and messages

import Button from "../../components/common/Button"; // Generic button

// Assuming these are generic, reusable components:

// import Tabs from "../../components/common/Tabs"; // Adjust path if needed

// import DashboardFilters from "../../components/common/DashboardFilters"; // Adjust path if needed

// Or we'll create simpler versions here.

  

// Icons for better visuals

import {

  Wrench, Building, Users, Briefcase, CalendarCheck, PlusCircle,

  BarChart2, Edit, Trash2, ChevronRight, CheckCircle, Clock, Archive, Eye

} from 'lucide-react'; // Lucide-react icons

  

// Helper for displaying messages to user (instead of alert)

const showMessage = (msg, type = 'info') => {

  console.log(`${type.toUpperCase()}: ${msg}`);

  alert(msg); // Keeping alert for now for simplicity, but recommend a proper UI modal/toast

};

  

export default function PMDashboard() {

  // --- State ---

  const [profile, setProfile] = useState(null);

  const [properties, setProperties] = useState([]);

  const [requests, setRequests] = useState([]); // All requests associated with this PM's properties

  const [vendors, setVendors] = useState([]);

  const [scheduledMaintenance, setScheduledMaintenance] = useState([]); // Renamed from tasks

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  

  // Quick action states

  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

  const [propertyForm, setPropertyForm] = useState({ name: "", address: { street: "", city: "", state: "", country: "" } });

  const [addPropertyError, setAddPropertyError] = useState("");

  

  const [showInviteModal, setShowInviteModal] = useState(false);

  const [inviteForm, setInviteForm] = useState({ email: "", role: "tenant", propertyId: "", unitId: "" });

  const [inviteError, setInviteError] = useState("");

  const [unitsForInvite, setUnitsForInvite] = useState([]); // Units for selected property in invite form

  

  const [showAddVendorModal, setShowAddVendorModal] = useState(false);

  const [vendorForm, setVendorForm] = useState({ name: "", phone: "", email: "", services: [], address: "", description: "" });

  const [addVendorError, setAddVendorError] = useState("");

  

  const [showAddScheduledMaintenanceModal, setShowAddScheduledMaintenanceModal] = useState(false);

  const [scheduledMaintenanceForm, setScheduledMaintenanceForm] = useState({ title: "", description: "", category: "", property: "", unit: "", scheduledDate: "", recurring: false, frequency: {} });

  const [addScheduledMaintenanceError, setAddScheduledMaintenanceError] = useState("");

  

  const navigate = useNavigate();

  

  // --- Data Fetching ---

  useEffect(() => {

    async function fetchAllData() {

      setLoading(true);

      setError("");

      try {

        const userProfile = await getMyProfile();

        setProfile(userProfile);

  

        const propertiesData = await getAllProperties(); // Backend filters by user association

        setProperties(propertiesData);

  

        const vendorsData = await getAllVendors(); // Backend filters by user association

        setVendors(vendorsData);

  

        const scheduledMaintenanceData = await getAllScheduledMaintenance(); // Backend filters by user association

        setScheduledMaintenance(scheduledMaintenanceData.tasks || []); // Assuming response has a 'tasks' array

  

        // Fetch requests for properties this PM manages (backend handles this filtering)

        const requestsData = await getAllRequests(); // This will return requests relevant to the PM

        setRequests(requestsData);

  

      } catch (err) {

        setError("Failed to load dashboard data. " + (err.response?.data?.message || err.message));

        console.error("PM Dashboard fetch error:", err);

      } finally {

        setLoading(false);

      }

    }

    fetchAllData();

  }, []);

  

  // --- Handlers for Quick Actions ---

  

  // Property

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

      // Create property (backend will automatically associate PM who created it)

      await getAllProperties.createProperty(propertyForm); // Use propertyService.createProperty

      showMessage("Property added successfully!", 'success');

      setShowAddPropertyModal(false);

      setPropertyForm({ name: "", address: { street: "", city: "", state: "", country: "" } });

      // Re-fetch properties to update dashboard

      setProperties(await getAllProperties());

    } catch (err) {

      setAddPropertyError("Failed to add property: " + (err.response?.data?.message || err.message));

      console.error("Add property error:", err);

    }

  };

  

  // Invite

  const handleInviteFormChange = async (e) => {

    const { name, value } = e.target;

    setInviteForm(prev => ({ ...prev, [name]: value }));

  

    // If property changes, fetch units for that property

    if (name === 'propertyId' && value) {

      try {

        const selectedProperty = properties.find(p => p._id === value);

        if (selectedProperty && selectedProperty.units) {

          setUnitsForInvite(selectedProperty.units);

        } else {

          // If units are not populated on property object, fetch them explicitly

          // (This assumes propertyService.getPropertyById returns units or unitService.listUnits is available)

          // For simplicity, we assume properties from getAllProperties include units or that getPropertyById will be used if needed.

          // For now, I'll rely on the properties array having units.

          const res = await getAllProperties.getPropertyById(value); // Assuming this returns property with units

          setUnitsForInvite(res.units || []);

        }

        setInviteForm(prev => ({ ...prev, unitId: "" })); // Reset unit selection

      } catch (err) {

        console.error("Error fetching units for invite:", err);

        setUnitsForInvite([]);

      }

    } else if (name === 'propertyId' && !value) {

      setUnitsForInvite([]);

      setInviteForm(prev => ({ ...prev, unitId: "" }));

    }

  };

  

  const handleSendInvite = async (e) => {

    e.preventDefault();

    setInviteError("");

    try {

      // This will call the inviteService.sendInvite function once available

      // For now, it's a placeholder as inviteService is not yet implemented

      showMessage(`Inviting ${inviteForm.email} as a ${inviteForm.role} to property ${inviteForm.propertyId} (Unit: ${inviteForm.unitId || 'N/A'}) (Simulated)`, 'info');

      setShowInviteModal(false);

      setInviteForm({ email: "", role: "tenant", propertyId: "", unitId: "" });

      setUnitsForInvite([]);

    } catch (err) {

      setInviteError("Failed to send invitation: " + (err.response?.data?.message || err.message));

      console.error("Send invite error:", err);

    }

  };

  

  // Vendor

  const handleVendorFormChange = (e) => setVendorForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddVendorSubmit = async (e) => {

    e.preventDefault();

    setAddVendorError("");

    try {

      // Ensure services are parsed correctly (comma-separated string to array)

      const payload = {

        ...vendorForm,

        services: vendorForm.services.split(',').map(s => s.trim()).filter(s => s),

      };

      await getAllVendors.addVendor(payload); // Use vendorService.addVendor

      showMessage("Vendor added successfully!", 'success');

      setShowAddVendorModal(false);

      setVendorForm({ name: "", phone: "", email: "", services: [], address: "", description: "" });

      setVendors(await getAllVendors()); // Re-fetch vendors

    } catch (err) {

      setAddVendorError("Failed to add vendor: " + (err.response?.data?.message || err.message));

      console.error("Add vendor error:", err);

    }

  };

  

  // Scheduled Maintenance

  const handleScheduledMaintenanceFormChange = (e) => {

    const { name, value, type, checked } = e.target;

    setScheduledMaintenanceForm(prev => ({

      ...prev,

      [name]: type === 'checkbox' ? checked : value

    }));

  };

  const handleAddScheduledMaintenanceSubmit = async (e) => {

    e.preventDefault();

    setAddScheduledMaintenanceError("");

    try {

      // Ensure data format matches backend expectations (e.g., property is just ID)

      await getAllScheduledMaintenance.createScheduledMaintenance(scheduledMaintenanceForm); // Use scheduledMaintenanceService.createScheduledMaintenance

      showMessage("Scheduled maintenance task added!", 'success');

      setShowAddScheduledMaintenanceModal(false);

      setScheduledMaintenanceForm({ title: "", description: "", category: "", property: "", unit: "", scheduledDate: "", recurring: false, frequency: {} });

      setScheduledMaintenance((await getAllScheduledMaintenance()).tasks || []); // Re-fetch tasks

    } catch (err) {

      setAddScheduledMaintenanceError("Failed to add scheduled maintenance: " + (err.response?.data?.message || err.message));

      console.error("Add scheduled maintenance error:", err);

    }

  };

  

  // --- Request Actions (from table) ---

  const handleUpdateStatus = async (requestId, newStatus) => {

    try {

      await getAllRequests.updateRequest(requestId, { status: newStatus }); // Use requestService.updateRequest

      showMessage(`Request status updated to ${newStatus.replace(/_/g, ' ')}!`, 'success');

      setRequests(await getAllRequests()); // Re-fetch requests

    } catch (err) {

      showMessage("Failed to update status: " + (err.response?.data?.message || err.message), 'error');

      console.error("Update request status error:", err);

    }

  };

  

  const handleAssignToVendor = async (requestId, assignedToId, assignedToModel) => {

    try {

      await getAllRequests.assignRequest(requestId, { assignedToId, assignedToModel }); // Use requestService.assignRequest

      showMessage(`Request assigned to ${assignedToModel} successfully!`, 'success');

      setRequests(await getAllRequests()); // Re-fetch requests

    } catch (err) {

      showMessage("Failed to assign request: " + (err.response?.data?.message || err.message), 'error');

      console.error("Assign request error:", err);

    }

  };

  

  const handleMarkResolved = (requestId) => handleUpdateStatus(requestId, 'completed'); // Direct status update

  const handleVerifyRequest = (requestId) => handleUpdateStatus(requestId, 'verified');

  const handleReopenRequest = (requestId) => handleUpdateStatus(requestId, 'reopened');

  const handleArchiveRequest = (requestId) => handleUpdateStatus(requestId, 'archived');

  
  

  // --- Stats for Summary Cards ---

  const stats = [

    { label: "Total Properties", count: properties.length, icon: Building, link: '/pm/properties' },

    { label: "Total Requests", count: requests.length, icon: Wrench, link: '/pm/requests' },

    { label: "Pending Requests", count: requests.filter(r => r.status === 'new').length, icon: Clock, link: '/pm/requests?status=new' },

    { label: "In Progress Requests", count: requests.filter(r => r.status === 'in_progress').length, icon: Clock, link: '/pm/requests?status=in_progress' },

    { label: "Scheduled Maint. Tasks", count: scheduledMaintenance.length, icon: CalendarCheck, link: '/pm/scheduled-maintenance' },

    { label: "Total Vendors", count: vendors.length, icon: Briefcase, link: '/pm/vendors' },

  ];

  
  

  if (loading) {

    return (

      <PropertyManagerLayout>

        <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">

          <p className="text-xl text-gray-600">Loading your dashboard...</p>

        </div>

      </PropertyManagerLayout>

    );

  }

  

  return (

    <PropertyManagerLayout>

      <div className="p-4 md:p-8 bg-gray-50 min-h-full">

        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">

          Welcome, {profile?.name || profile?.email}!

        </h1>

        <p className="text-lg text-gray-700 mb-8">

          Your centralized hub for managing properties, maintenance, and resources.

        </p>

  

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">

          <strong className="font-bold">Error!</strong>

          <span className="block sm:inline"> {error}</span>

        </div>}

  

        {/* Stats Summary Cards */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">

          {stats.map((stat) => (

            <Link key={stat.label} to={stat.link} className="block">

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transform hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer flex items-center space-x-4">

                {stat.icon && <stat.icon className="w-10 h-10 text-indigo-600 flex-shrink-0" />}

                <div>

                  <div className="text-sm font-medium text-gray-500">{stat.label}</div>

                  <div className="text-4xl font-bold text-gray-900">{stat.count}</div>

                </div>

              </div>

            </Link>

          ))}

        </div>

  

        {/* Quick Actions Section */}

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-10">

          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <Button

              onClick={() => setShowAddPropertyModal(true)}

              className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-lg shadow-md flex items-center justify-center text-lg space-x-2 transition duration-200"

            >

              <PlusCircle className="w-5 h-5" /> <span>Add New Property</span>

            </Button>

            <Button

              onClick={() => navigate('/pm/requests/create')}

              className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg shadow-md flex items-center justify-center text-lg space-x-2 transition duration-200"

            >

              <Wrench className="w-5 h-5" /> <span>Create Maintenance Request</span>

            </Button>

            <Button

              onClick={() => setShowInviteModal(true)}

              className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg shadow-md flex items-center justify-center text-lg space-x-2 transition duration-200"

            >

              <Mail className="w-5 h-5" /> <span>Invite New User</span>

            </Button>

            <Button

              onClick={() => setShowAddVendorModal(true)}

              className="bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg shadow-md flex items-center justify-center text-lg space-x-2 transition duration-200"

            >

              <Briefcase className="w-5 h-5" /> <span>Add New Vendor</span>

            </Button>

            <Button

              onClick={() => setShowAddScheduledMaintenanceModal(true)}

              className="bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-lg shadow-md flex items-center justify-center text-lg space-x-2 transition duration-200"

            >

              <CalendarCheck className="w-5 h-5" /> <span>Schedule Maintenance</span>

            </Button>

            <Link to="/pm/reports" className="flex items-center justify-center">

              <Button

                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-lg shadow-md flex items-center justify-center text-lg space-x-2 transition duration-200"

              >

                <BarChart2 className="w-5 h-5" /> <span>View Reports</span>

              </Button>

            </Link>

          </div>

        </div>

  

        {/* Recent Maintenance Requests Table */}

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-10">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-semibold text-gray-800">Recent Maintenance Requests</h2>

            <Link to="/pm/requests" className="text-blue-600 hover:underline font-medium flex items-center space-x-1">

              <span>View All Requests</span> <ChevronRight className="w-4 h-4" />

            </Link>

          </div>

          {requests.length === 0 ? (

            <p className="text-gray-600 italic text-center py-6">No recent maintenance requests found.</p>

          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>

                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                  </tr>

                </thead>

                <tbody className="bg-white divide-y divide-gray-200">

                  {requests.slice(0, 7).map((req) => ( // Show recent 7 requests

                    <tr key={req._id}>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                        <Link to={`/pm/requests/${req._id}`} className="text-indigo-600 hover:underline">

                          {req.title}

                        </Link>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${

                          req.status === 'new' ? 'bg-blue-100 text-blue-800' :

                          req.status === 'assigned' ? 'bg-purple-100 text-purple-800' :

                          req.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :

                          req.status === 'completed' ? 'bg-green-100 text-green-800' :

                          req.status === 'verified' ? 'bg-teal-100 text-teal-800' :

                          req.status === 'reopened' ? 'bg-orange-100 text-orange-800' :

                          'bg-gray-100 text-gray-800'

                        }`}>

                          {req.status.replace(/_/g, ' ')}

                        </span>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">

                        <span className={`font-semibold ${

                          req.priority === 'urgent' ? 'text-red-600' :

                          req.priority === 'high' ? 'text-orange-500' :

                          'text-gray-700'

                        }`}>

                          {req.priority || 'Medium'}

                        </span>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                        {req.property?.name || 'N/A'} {req.unit?.unitName ? `/ ${req.unit.unitName}` : ''}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.requestedBy?.name || req.requestedBy?.email || 'N/A'}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.assignedTo?.name || req.assignedTo?.email || 'Unassigned'}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">

                        <div className="flex items-center space-x-2">

                           <Link to={`/pm/requests/${req._id}`} className="text-indigo-600 hover:text-indigo-900"><Eye className="w-5 h-5" /></Link>

                           {/* Simplified actions for dashboard, more detailed on request details page */}

                           {req.status === 'new' && (

                             <button

                               onClick={() => handleUpdateStatus(req._id, 'assigned')}

                               className="text-purple-600 hover:text-purple-900"

                               title="Mark as Assigned"

                             >

                               <CheckCircle className="w-5 h-5" />

                             </button>

                           )}

                           {req.status === 'in_progress' && (

                             <button

                               onClick={() => handleMarkResolved(req._id)}

                               className="text-green-600 hover:text-green-900"

                               title="Mark as Completed"

                             >

                               <CheckCircle className="w-5 h-5" />

                             </button>

                           )}

                           {req.status === 'completed' && (

                             <button

                               onClick={() => handleVerifyRequest(req._id)}

                               className="text-teal-600 hover:text-teal-900"

                               title="Verify Completion"

                             >

                               <CheckCircle className="w-5 h-5" />

                             </button>

                           )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

  

        {/* Modals for Quick Actions */}

  

        {/* Add New Property Modal */}

        <Modal

          isOpen={showAddPropertyModal}

          onClose={() => setShowAddPropertyModal(false)}

          title="Add New Property"

        >

          <form onSubmit={handleAddPropertySubmit} className="p-4 space-y-4">

            {addPropertyError && <p className="text-red-500 text-sm mb-3">{addPropertyError}</p>}

            <div>

              <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700">Property Name</label>

              <input

                type="text"

                id="propertyName"

                name="name"

                value={propertyForm.name}

                onChange={handlePropertyFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              />

            </div>

            <div>

              <label htmlFor="propertyStreet" className="block text-sm font-medium text-gray-700">Street Address</label>

              <input

                type="text"

                id="propertyStreet"

                name="address.street"

                value={propertyForm.address.street}

                onChange={handlePropertyFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

              />

            </div>

            <div>

              <label htmlFor="propertyCity" className="block text-sm font-medium text-gray-700">City</label>

              <input

                type="text"

                id="propertyCity"

                name="address.city"

                value={propertyForm.address.city}

                onChange={handlePropertyFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              />

            </div>

            <div>

              <label htmlFor="propertyState" className="block text-sm font-medium text-gray-700">State / Province</label>

              <input

                type="text"

                id="propertyState"

                name="address.state"

                value={propertyForm.address.state}

                onChange={handlePropertyFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

              />

            </div>

            <div>

              <label htmlFor="propertyCountry" className="block text-sm font-medium text-gray-700">Country</label>

              <input

                type="text"

                id="propertyCountry"

                name="address.country"

                value={propertyForm.address.country}

                onChange={handlePropertyFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              />

            </div>

            <div className="flex justify-end space-x-3 mt-6">

              <Button type="button" onClick={() => setShowAddPropertyModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>

              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg">Add Property</Button>

            </div>

          </form>

        </Modal>

  

        {/* Invite New User Modal */}

        <Modal

          isOpen={showInviteModal}

          onClose={() => setShowInviteModal(false)}

          title="Invite New User"

        >

          <form onSubmit={handleSendInvite} className="p-4 space-y-4">

            {inviteError && <p className="text-red-500 text-sm mb-3">{inviteError}</p>}

            <div>

              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">Email</label>

              <input

                type="email"

                id="inviteEmail"

                name="email"

                value={inviteForm.email}

                onChange={handleInviteFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                placeholder="user@example.com"

                required

              />

            </div>

            <div>

              <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700">Role</label>

              <select

                id="inviteRole"

                name="role"

                value={inviteForm.role}

                onChange={handleInviteFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              >

                <option value="tenant">Tenant</option>

                <option value="landlord">Landlord</option>

                <option value="propertymanager">Property Manager</option>

                <option value="vendor">Vendor</option>

              </select>

            </div>

            {/* Property and Unit Selection for invite */}

            {inviteForm.role !== 'admin' && ( // Admin typically doesn't need property/unit association for invite

              <>

                <div>

                  <label htmlFor="inviteProperty" className="block text-sm font-medium text-gray-700">Property</label>

                  <select

                    id="inviteProperty"

                    name="propertyId"

                    value={inviteForm.propertyId}

                    onChange={handleInviteFormChange}

                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                    required={inviteForm.role === 'tenant' || inviteForm.role === 'vendor'} // Property is required for tenants/vendors

                  >

                    <option value="">Select Property (Optional for PM/Landlord invite)</option>

                    {properties.map(p => (

                      <option key={p._id} value={p._id}>{p.name}</option>

                    ))}

                  </select>

                </div>

                {inviteForm.role === 'tenant' && inviteForm.propertyId && (

                  <div>

                    <label htmlFor="inviteUnit" className="block text-sm font-medium text-gray-700">Unit (for Tenant)</label>

                    <select

                      id="inviteUnit"

                      name="unitId"

                      value={inviteForm.unitId}

                      onChange={handleInviteFormChange}

                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                      required

                    >

                      <option value="">Select Unit</option>

                      {unitsForInvite.map(unit => (

                        <option key={unit._id} value={unit._id}>{unit.unitName}</option>

                      ))}

                    </select>

                  </div>

                )}

              </>

            )}

  

            <div className="flex justify-end space-x-3 mt-6">

              <Button type="button" onClick={() => setShowInviteModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>

              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">Send Invite</Button>

            </div>

          </form>

        </Modal>

  

        {/* Add New Vendor Modal */}

        <Modal

          isOpen={showAddVendorModal}

          onClose={() => setShowAddVendorModal(false)}

          title="Add New Vendor"

        >

          <form onSubmit={handleAddVendorSubmit} className="p-4 space-y-4">

            {addVendorError && <p className="text-red-500 text-sm mb-3">{addVendorError}</p>}

            <div>

              <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Name</label>

              <input

                type="text"

                id="vendorName"

                name="name"

                value={vendorForm.name}

                onChange={handleVendorFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              />

            </div>

            <div>

              <label htmlFor="vendorEmail" className="block text-sm font-medium text-gray-700">Email</label>

              <input

                type="email"

                id="vendorEmail"

                name="email"

                value={vendorForm.email}

                onChange={handleVendorFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              />

            </div>

            <div>

              <label htmlFor="vendorPhone" className="block text-sm font-medium text-gray-700">Phone</label>

              <input

                type="text"

                id="vendorPhone"

                name="phone"

                value={vendorForm.phone}

                onChange={handleVendorFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              />

            </div>

            <div>

              <label htmlFor="vendorServices" className="block text-sm font-medium text-gray-700">Services (comma separated)</label>

              <input

                type="text"

                id="vendorServices"

                name="services"

                value={vendorForm.services}

                onChange={handleVendorFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                placeholder="e.g., plumbing, electrical, HVAC"

              />

            </div>

            <div>

              <label htmlFor="vendorAddress" className="block text-sm font-medium text-gray-700">Address</label>

              <input

                type="text"

                id="vendorAddress"

                name="address"

                value={vendorForm.address}

                onChange={handleVendorFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

              />

            </div>

            <div>

              <label htmlFor="vendorDescription" className="block text-sm font-medium text-gray-700">Description</label>

              <textarea

                id="vendorDescription"

                name="description"

                value={vendorForm.description}

                onChange={handleVendorFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"

              ></textarea>

            </div>

            <div className="flex justify-end space-x-3 mt-6">

              <Button type="button" onClick={() => setShowAddVendorModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>

              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg">Add Vendor</Button>

            </div>

          </form>

        </Modal>

  

        {/* Schedule New Maintenance Modal */}

        <Modal

          isOpen={showAddScheduledMaintenanceModal}

          onClose={() => setShowAddScheduledMaintenanceModal(false)}

          title="Schedule New Maintenance"

        >

          <form onSubmit={handleAddScheduledMaintenanceSubmit} className="p-4 space-y-4">

            {addScheduledMaintenanceError && <p className="text-red-500 text-sm mb-3">{addScheduledMaintenanceError}</p>}

            <div>

              <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Title</label>

              <input

                type="text"

                id="taskTitle"

                name="title"

                value={scheduledMaintenanceForm.title}

                onChange={handleScheduledMaintenanceFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              />

            </div>

            <div>

              <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description</label>

              <textarea

                id="taskDescription"

                name="description"

                value={scheduledMaintenanceForm.description}

                onChange={handleScheduledMaintenanceFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"

                required

              ></textarea>

            </div>

            <div>

              <label htmlFor="taskCategory" className="block text-sm font-medium text-gray-700">Category</label>

              <select

                id="taskCategory"

                name="category"

                value={scheduledMaintenanceForm.category}

                onChange={handleScheduledMaintenanceFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              >

                <option value="">Select Category</option>

                {/* Categories from Request model for consistency */}

                {['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'landscaping', 'other', 'cleaning', 'security', 'pest_control'].map(cat => (

                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>

                ))}

              </select>

            </div>

            <div>

              <label htmlFor="taskProperty" className="block text-sm font-medium text-gray-700">Property</label>

              <select

                id="taskProperty"

                name="property"

                value={scheduledMaintenanceForm.property}

                onChange={handleScheduledMaintenanceFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              >

                <option value="">Select Property</option>

                {properties.map(p => (

                  <option key={p._id} value={p._id}>{p.name}</option>

                ))}

              </select>

            </div>

            {scheduledMaintenanceForm.property && ( // Optional Unit selection if property selected

              <div>

                <label htmlFor="taskUnit" className="block text-sm font-medium text-gray-700">Unit (Optional)</label>

                <select

                  id="taskUnit"

                  name="unit"

                  value={scheduledMaintenanceForm.unit}

                  onChange={handleScheduledMaintenanceFormChange}

                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                >

                  <option value="">Select Unit</option>

                  {properties.find(p => p._id === scheduledMaintenanceForm.property)?.units?.map(unit => (

                    <option key={unit._id} value={unit._id}>{unit.unitName}</option>

                  ))}

                </select>

              </div>

            )}

            <div>

              <label htmlFor="taskScheduledDate" className="block text-sm font-medium text-gray-700">Scheduled Date</label>

              <input

                type="date"

                id="taskScheduledDate"

                name="scheduledDate"

                value={scheduledMaintenanceForm.scheduledDate}

                onChange={handleScheduledMaintenanceFormChange}

                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                required

              />

            </div>

            <div className="flex items-center">

              <input

                type="checkbox"

                id="taskRecurring"

                name="recurring"

                checked={scheduledMaintenanceForm.recurring}

                onChange={handleScheduledMaintenanceFormChange}

                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"

              />

              <label htmlFor="taskRecurring" className="ml-2 block text-sm text-gray-900">Recurring Task</label>

            </div>

            {scheduledMaintenanceForm.recurring && (

              <div className="pl-6 space-y-3">

                <p className="text-sm text-gray-600">Frequency options can be added here (daily, weekly, monthly etc.)</p>

                {/* For now, simplified frequency setup. In a real app, this would be more complex. */}

              </div>

            )}

            <div className="flex justify-end space-x-3 mt-6">

              <Button type="button" onClick={() => setShowAddScheduledMaintenanceModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>

              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg">Schedule Task</Button>

            </div>

          </form>

        </Modal>

  

      </div>

    </PropertyManagerLayout>

  );

}



// import PropertiesPage from './pages/pm/PropertiesPage';
// import PropertyDetailPage from './pages/pm/PropertyDetailsPage';
// import UnitDetailsPage from './pages/pm/UnitDetailsPage'; // Assuming this page exists
// import CreateEditUnitPage from './pages/pm/CreateEditUnitPage'; // Assuming this page exists
// import ServiceRequestsPage from './pages/pm/ServiceRequestsPage';
// import RequestDetailPage from './pages/pm/RequestDetailsPage';
// import ScheduledMaintenancePage from './pages/pm/ScheduledMaintenancePage';
// import MaintenanceDetailPage from './pages/pm/ScheduledMaintenancePage'; // Reusing for detail, or a separate page
// import VendorsPage from './pages/pm/VendorsPage';
// import UserManagementPage from './pages/pm/UserManagementPage';
// import UserProfileManagementPage from './pages/pm/UserProfileManagementPage';