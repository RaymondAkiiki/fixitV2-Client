// frontend/src/pages/pm/UserManagementPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import DashboardFilters from "../../components/common/DashboardFilters"; // Assuming this exists
import { Users, PlusCircle, UserPlus, Search } from "lucide-react";

// Import updated service functions
import { getAllUsers } from "../../services/userService";
import { getAllProperties } from "../../services/propertyService"; // For property filter
import { sendInvite } from "../../services/inviteService"; // For inviting new users

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * UserManagementPage component for Property Managers to view and manage all users.
 * This replaces the previous TenantsPage for PMs, making it more general.
 */
function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    role: "all", // 'all', 'tenant', 'landlord', 'propertymanager', 'vendor'
    propertyId: "",
    isApproved: "" // 'all', 'true', 'false'
  });
  const [properties, setProperties] = useState([]); // List of properties for filtering

  // Invite Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "tenant", propertyId: "", unitId: "" });
  const [inviteFormErrors, setInviteFormErrors] = useState({});
  const [unitsForInvite, setUnitsForInvite] = useState([]); // Units of selected property for invite

  const navigate = useNavigate();

  // Fetch initial data (properties)
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const propertiesData = await getAllProperties(); // This already filters by user's associated properties
        setProperties(propertiesData);
      } catch (err) {
        setError("Failed to load filter options.");
        console.error("Initial data fetch error:", err);
      }
    }
    fetchInitialData();
  }, []);

  // Fetch users based on filters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: filters.search,
        role: filters.role === "all" ? undefined : filters.role,
        propertyId: filters.propertyId,
        isApproved: filters.isApproved === "all" ? undefined : (filters.isApproved === "true"),
      };
      // Backend's getAllUsers should automatically filter users accessible by the logged-in PM
      const data = await getAllUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load users. " + (err.response?.data?.message || err.message));
      setUsers([]);
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Memoize based on filters

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Call memoized function

  // Invite Modal Handlers
  const handleInviteFormChange = (e) => {
    const { name, value } = e.target;
    setInviteForm(f => ({ ...f, [name]: value }));
    setInviteFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleInvitePropertyChange = (e) => {
    const propertyId = e.target.value;
    setInviteForm(f => ({ ...f, propertyId: propertyId, unitId: "" })); // Reset unit when property changes
    setInviteFormErrors(prev => ({ ...prev, propertyId: '', unitId: '' }));
    const selectedProperty = properties.find(p => p._id === propertyId);
    setUnitsForInvite(selectedProperty?.units || []);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteFormErrors({});
    try {
      const errors = {};
      if (!inviteForm.email) errors.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email.trim())) errors.email = "Invalid email format.";
      if (!inviteForm.role) errors.role = "Role is required.";
      // Property ID is required for roles that need association
      if (['tenant', 'propertymanager', 'vendor', 'landlord'].includes(inviteForm.role) && !inviteForm.propertyId) {
          errors.propertyId = "Property is required for this role.";
      }
      if (Object.keys(errors).length > 0) {
          setInviteFormErrors(errors);
          return;
      }

      setLoading(true); // Indicate loading for the invite send operation
      await sendInvite(inviteForm);
      showMessage(`Invitation sent successfully to ${inviteForm.email} as ${inviteForm.role}!`, 'success');
      setInviteForm({ email: "", role: "tenant", propertyId: "", unitId: "" });
      setUnitsForInvite([]);
      setShowInviteModal(false);
      fetchUsers(); // Refresh user list in case invitation immediately registers a user
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setInviteFormErrors({ general: `Failed to send invitation: ${msg}` });
      showMessage(`Failed to send invitation: ${msg}`, 'error');
      console.error("Send invite error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0 && properties.length === 0) { // Show full loading screen only on initial empty load
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-xl text-gray-600">Loading user data...</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <Users className="w-8 h-8 mr-3 text-green-700" />
          User Management
        </h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Invite New User
          </Button>
        </div>

        {/* Filters */}
        <DashboardFilters
          filters={filters}
          setFilters={setFilters}
          properties={properties}
          showSearch={true}
          showRoleFilter={true} // New filter for user roles
          roleOptions={['all', 'tenant', 'landlord', 'propertymanager', 'vendor', 'admin']}
          showPropertyFilter={true}
          showApprovalStatusFilter={true} // New filter for approval status
        />

        {loading ? ( // Show loading indicator specifically for table if data is already present from initial load
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600 italic">
            <p className="text-lg mb-4">No users found matching your criteria.</p>
            <p>Click "Invite New User" to add one!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associated Properties/Units</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/pm/users/${user._id}`} className="text-green-600 hover:underline">
                        {user.name || 'N/A'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {user.isApproved ? 'Approved' : 'Pending'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                        {/* Display relevant associations. This can be complex depending on how backend sends it. */}
                        {user.associations?.tenancies?.length > 0 && (
                            <div className="mt-1">
                                <span className="font-semibold">Tenancies:</span>
                                <ul className="list-disc list-inside ml-2">
                                    {user.associations.tenancies.map(t => (
                                        <li key={t.unit?._id || t.property?._id}>
                                            {t.property?.name} ({t.unit?.unitName || 'Property-level'})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                         {user.associations?.managedProperties?.length > 0 && (
                            <div className="mt-1">
                                <span className="font-semibold">Managed:</span>
                                <ul className="list-disc list-inside ml-2">
                                    {user.associations.managedProperties.map(p => (
                                        <li key={p._id}>{p.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* Add more association types like vendor, landlord if your user model supports it */}
                        {!user.associations?.tenancies?.length && !user.associations?.managedProperties?.length && (
                            <span className="italic">None</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/pm/users/${user._id}`} className="text-blue-600 hover:text-blue-800 mr-3">Manage</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invite User Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite New User"
        >
          <form onSubmit={handleSendInvite} className="p-4 space-y-4">
            <p className="text-gray-700">Send an invitation for a user to join the platform with a specific role and property association. An email will be sent to the invited user.</p>
            {inviteFormErrors.general && <p className="text-red-500 text-sm mb-3">{inviteFormErrors.general}</p>}
            <div>
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">Email:</label>
              <input
                type="email"
                id="inviteEmail"
                name="email"
                value={inviteForm.email}
                onChange={handleInviteFormChange}
                className={`mt-1 block w-full px-3 py-2 border ${inviteFormErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                required
                disabled={loading}
              />
              {inviteFormErrors.email && <p className="text-red-500 text-xs mt-1">{inviteFormErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700">Role:</label>
              <select
                id="inviteRole"
                name="role"
                value={inviteForm.role}
                onChange={handleInviteFormChange}
                className={`mt-1 block w-full px-3 py-2 border ${inviteFormErrors.role ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                required
                disabled={loading}
              >
                <option value="tenant">Tenant</option>
                <option value="propertymanager">Property Manager</option>
                <option value="vendor">Vendor</option>
                <option value="landlord">Landlord</option>
                {/* Admin role typically not invited this way */}
              </select>
              {inviteFormErrors.role && <p className="text-red-500 text-xs mt-1">{inviteFormErrors.role}</p>}
            </div>
            {/* Conditional property/unit selection based on role */}
            {(inviteForm.role === 'tenant' || inviteForm.role === 'propertymanager' || inviteForm.role === 'vendor' || inviteForm.role === 'landlord') && (
              <div>
                <label htmlFor="inviteProperty" className="block text-sm font-medium text-gray-700">Property:</label>
                <select
                  id="inviteProperty"
                  name="propertyId"
                  value={inviteForm.propertyId}
                  onChange={handleInvitePropertyChange} // Use specific handler to update units
                  className={`mt-1 block w-full px-3 py-2 border ${inviteFormErrors.propertyId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
                  required={['tenant', 'propertymanager', 'vendor', 'landlord'].includes(inviteForm.role)}
                  disabled={loading}
                >
                  <option value="">Select Property</option>
                  {properties.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                {inviteFormErrors.propertyId && <p className="text-red-500 text-xs mt-1">{inviteFormErrors.propertyId}</p>}
              </div>
            )}
            {inviteForm.role === 'tenant' && inviteForm.propertyId && (
              <div>
                <label htmlFor="inviteUnit" className="block text-sm font-medium text-gray-700">Unit (Optional for Tenant):</label>
                <select
                  id="inviteUnit"
                  name="unitId"
                  value={inviteForm.unitId}
                  onChange={handleInviteFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  disabled={loading || unitsForInvite.length === 0}
                >
                  <option value="">Select Unit</option>
                  {unitsForInvite.map(u => (
                    <option key={u._id} value={u._id}>{u.unitName}</option>
                  ))}
                </select>
                {inviteFormErrors.unitId && <p className="text-red-500 text-xs mt-1">{inviteFormErrors.unitId}</p>}
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                disabled={loading}
              >
                Send Invite
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PropertyManagerLayout>
  );
}

export default UserManagementPage;
