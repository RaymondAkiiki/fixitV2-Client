// frontend/src/pages/pm/ServiceRequestsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import Tabs from "../../components/common/Tabs"; // Assuming this exists
import DashboardFilters from "../../components/common/DashboardFilters"; // Assuming this exists
import Modal from "../../components/common/Modal"; // Assuming this exists
import { Wrench, PlusCircle, Search, Filter } from "lucide-react";

// Import updated service functions
import { getAllRequests, assignRequest, updateRequest } from "../../services/requestService";
import { getAllProperties } from "../../services/propertyService"; // To populate property filter
import { getAllVendors } from "../../services/vendorService"; // To populate assign vendor dropdown
import { getAllUsers } from "../../services/userService"; // To populate assign user dropdown

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

// Tabs for requests (lowercase to match backend enum)
const requestTabs = [
  { name: "all", label: "All" },
  { name: "new", label: "New" },
  { name: "assigned", label: "Assigned" },
  { name: "in_progress", label: "In Progress" },
  { name: "completed", label: "Completed" },
  { name: "verified", label: "Verified" },
  { name: "reopened", label: "Reopened" },
  { name: "archived", label: "Archived" },
];

// Reusable status badge component
const StatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case "new": return <span className={`${base} bg-blue-100 text-blue-800`}>{status.replace(/_/g, ' ')}</span>;
    case "assigned": return <span className={`${base} bg-purple-100 text-purple-800`}>{status.replace(/_/g, ' ')}</span>;
    case "in_progress": return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status.replace(/_/g, ' ')}</span>;
    case "completed": return <span className={`${base} bg-green-100 text-green-800`}>{status.replace(/_/g, ' ')}</span>;
    case "verified": return <span className={`${base} bg-teal-100 text-teal-800`}>{status.replace(/_/g, ' ')}</span>;
    case "reopened": return <span className={`${base} bg-orange-100 text-orange-800`}>{status.replace(/_/g, ' ')}</span>;
    case "archived": return <span className={`${base} bg-gray-200 text-gray-800`}>{status.replace(/_/g, ' ')}</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-800`}>{status.replace(/_/g, ' ')}</span>;
  }
};

// Reusable priority badge component
const PriorityBadge = ({ priority }) => {
  const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";
  switch (priority?.toLowerCase()) {
    case "low": return <span className={`${base} bg-gray-200 text-gray-700`}>{priority}</span>;
    case "medium": return `${base} bg-blue-100 text-blue-700`;
    case "high": return `${base} bg-orange-100 text-orange-700`;
    case "urgent": return `${base} bg-red-100 text-red-700`;
    default: return <span className={`${base} bg-gray-100 text-gray-600`}>{priority}</span>;
  }
};

/**
 * ServiceRequestsPage component for Property Managers to view and manage service requests.
 * Includes filtering, tab-based status view, and quick actions.
 */
function ServiceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    search: "",
    propertyId: "",
    unitId: "",
    category: "",
    priority: "",
    assignedToId: "", // For filtering by assigned user/vendor
    assignedToModel: ""
  });
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]); // Units for selected property filter
  const [vendors, setVendors] = useState([]);
  const [internalUsers, setInternalUsers] = useState([]); // Users with PM/Landlord roles who can be assigned

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentRequestIdForAssign, setCurrentRequestIdForAssign] = useState(null);
  const [assignedToType, setAssignedToType] = useState('User'); // 'User' or 'Vendor'
  const [assigneeId, setAssigneeId] = useState('');
  const [assignModalError, setAssignModalError] = useState('');

  const navigate = useNavigate();

  // Fetch initial data (properties, vendors, users)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [
          propertiesData,
          vendorsData,
          usersData
        ] = await Promise.all([
          getAllProperties(),
          getAllVendors(),
          getAllUsers({ roles: ['propertymanager', 'landlord', 'admin'] }) // Fetch internal users who can be assigned
        ]);
        setProperties(propertiesData);
        setVendors(vendorsData);
        setInternalUsers(usersData);
      } catch (err) {
        setError("Failed to load filter options.");
        console.error("Initial data fetch error:", err);
      }
    }
    fetchInitialData();
  }, []);

  // Fetch requests based on active tab and filters
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        status: activeTab === "all" ? undefined : activeTab,
        search: filters.search,
        propertyId: filters.propertyId,
        unitId: filters.unitId,
        category: filters.category,
        priority: filters.priority,
        assignedToId: filters.assignedToId,
        assignedToModel: filters.assignedToModel,
      };
      const data = await getAllRequests(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load service requests.");
      setRequests([]);
      console.error("Fetch requests error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]); // Memoize to avoid re-creation on every render

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]); // Call memoized function

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


  // --- Action Handlers ---

  const handleStatusChange = async (requestId, newStatus) => {
    if (window.confirm(`Are you sure you want to change this request's status to "${newStatus}"?`)) {
      try {
        await updateRequest(requestId, { status: newStatus.toLowerCase() });
        showMessage(`Request status updated to "${newStatus}"!`, 'success');
        fetchRequests(); // Re-fetch to update list
      } catch (err) {
        showMessage(`Failed to update status: ${err.response?.data?.message || err.message}`, 'error');
        console.error("Status update error:", err);
      }
    }
  };

  const openAssignModal = (requestId) => {
    setCurrentRequestIdForAssign(requestId);
    setAssignedToType('User'); // Default to assigning to a User
    setAssigneeId('');
    setAssignModalError('');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async () => {
    setAssignModalError('');
    if (!assigneeId) {
      setAssignModalError('Please select an assignee.');
      return;
    }
    try {
      await assignRequest(currentRequestIdForAssign, {
        assignedToId: assigneeId,
        assignedToModel: assignedToType,
      });
      showMessage(`Request assigned successfully to ${assignedToType}!`, 'success');
      setShowAssignModal(false);
      fetchRequests(); // Re-fetch to update list
    } catch (err) {
      setAssignModalError(`Failed to assign: ${err.response?.data?.message || err.message}`);
      console.error("Assign request error:", err);
    }
  };


  if (loading && requests.length === 0) { // Show full loading screen only on initial load
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-xl text-gray-600">Loading service requests...</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <Wrench className="w-8 h-8 mr-3 text-green-700" />
          Service Requests
        </h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button
            onClick={() => navigate('/pm/requests/add')}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Request
          </Button>
          {/* Add a button for reports if needed */}
          {/* <Link to="/pm/reports" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center">
            <FileText className="w-5 h-5 mr-2" /> View Reports
          </Link> */}
        </div>

        {/* Tabs for Status Filtering */}
        <div className="mb-4">
          <Tabs tabs={requestTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Dynamic Filters */}
        <DashboardFilters
          filters={filters}
          setFilters={setFilters}
          properties={properties}
          units={units}
          vendors={vendors} // Pass vendors for assignee filter
          internalUsers={internalUsers} // Pass internal users for assignee filter
          showPropertyFilter={true}
          showUnitFilter={true} // Add unit filter
          showCategoryFilter={true}
          showPriorityFilter={true}
          showAssignedToFilter={true} // New filter for assigned users/vendors
          showSearch={true}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600 italic">
            <p className="text-lg mb-4">No service requests found matching your criteria.</p>
            <p>Try adjusting your filters or create a new request.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-6">
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
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/pm/requests/${req._id}`} className="text-green-600 hover:underline">
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={req.priority} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.property?.name || 'N/A'} {req.unit?.unitName ? `(${req.unit.unitName})` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.createdBy?.name || req.createdBy?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.assignedTo?.name || req.assignedTo?.email || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/pm/requests/${req._id}`} className="text-blue-600 hover:text-blue-800 mr-3">View</Link>
                      {req.status !== 'completed' && req.status !== 'archived' && (
                        <Button
                          onClick={() => openAssignModal(req._id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-xs mr-3"
                        >
                          Assign
                        </Button>
                      )}
                      {req.status !== 'archived' && ( // Allow status changes if not archived
                        <select
                          onChange={e => handleStatusChange(req._id, e.target.value)}
                          defaultValue=""
                          className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                        >
                          <option value="" disabled>Change Status</option>
                          {requestTabs.filter(t => t.name !== 'all' && t.name !== req.status).map(t => (
                            <option key={t.name} value={t.name}>{t.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Assign Request Modal */}
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title="Assign Request"
        >
          <div className="p-4 space-y-4">
            {assignModalError && <p className="text-red-500 mb-3">{assignModalError}</p>}
            <div>
              <label htmlFor="assignToType" className="block text-sm font-medium text-gray-700">Assign To:</label>
              <select
                id="assignToType"
                value={assignedToType}
                onChange={e => {
                  setAssignedToType(e.target.value);
                  setAssigneeId(''); // Reset assignee when type changes
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="User">Internal User (PM/Landlord)</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
            <div>
              <label htmlFor="assigneeSelect" className="block text-sm font-medium text-gray-700">Select Assignee:</label>
              <select
                id="assigneeSelect"
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Select --</option>
                {assignedToType === 'User' ? (
                  internalUsers.map(user => (
                    <option key={user._id} value={user._id}>{user.name || user.email}</option>
                  ))
                ) : (
                  vendors.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                  ))
                )}
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignSubmit}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
                disabled={!assigneeId}
              >
                Assign
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PropertyManagerLayout>
  );
}

export default ServiceRequestsPage;
