// frontend/src/pages/pm/UserProfileManagementPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import {
  User, Mail, Phone, Building, Home, CheckSquare, XSquare, Trash2, PenSquare, ArrowLeft
} from "lucide-react";

// Import updated service functions
import { getUserById, updateUser, deleteUser, approveUser, updateUserRole } from "../../services/userService";
import { assignTenantToUnit, removeTenantFromUnit, listUnits } from "../../services/unitService"; // For tenant unit assignment
import { getAllProperties } from "../../services/propertyService"; // To select properties/units for assignment

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * UserProfileManagementPage allows Property Managers (or Admins) to view and edit details
 * of any specific user in the system, and manage their roles and associations.
 */
function UserProfileManagementPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "" });
  const [formErrors, setFormErrors] = useState({});

  // States for Assign Unit Modal (specific to tenant role)
  const [showAssignUnitModal, setShowAssignUnitModal] = useState(false);
  const [assignUnitPropertyId, setAssignUnitPropertyId] = useState('');
  const [assignUnitId, setAssignUnitId] = useState('');
  const [properties, setProperties] = useState([]); // All properties PM can see
  const [unitsForAssign, setUnitsForAssign] = useState([]); // Units for selected property in modal
  const [assignUnitModalError, setAssignUnitModalError] = useState('');

  const userRoles = ['tenant', 'landlord', 'propertymanager', 'vendor', 'admin']; // All possible roles

  // Fetch user profile and relevant data
  useEffect(() => {
    async function fetchUserProfileData() {
      setLoading(true);
      setError(null);
      try {
        const userData = await getUserById(userId);
        setUserProfile(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          role: userData.role || "",
        });

        // Also fetch properties for the assignment modal if needed
        const propertiesData = await getAllProperties(); // PM's accessible properties
        setProperties(propertiesData);

        // Pre-populate units for assign modal if property is already set for a tenant
        if (userData.role === 'tenant' && userData.associations?.tenancies?.length > 0) {
            const firstTenancyPropertyId = userData.associations.tenancies[0].property?._id;
            if (firstTenancyPropertyId) {
                setAssignUnitPropertyId(firstTenancyPropertyId);
                const selectedProp = propertiesData.find(p => p._id === firstTenancyPropertyId);
                setUnitsForAssign(selectedProp?.units || []);
            }
        }

      } catch (err) {
        setError("Failed to load user profile: " + (err.response?.data?.message || err.message));
        console.error("Fetch user profile error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserProfileData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePropertyChangeForAssignModal = (e) => {
    const propertyId = e.target.value;
    setAssignUnitPropertyId(propertyId);
    setAssignUnitId(''); // Clear selected unit
    const selectedProperty = properties.find(p => p._id === propertyId);
    setUnitsForAssign(selectedProperty?.units || []);
    setAssignUnitModalError(''); // Clear error
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required.";
    // Email is usually read-only or managed by separate auth flows
    // if (!formData.email.trim()) errors.email = "Email is required.";
    // else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = "Invalid email format.";
    if (!formData.role.trim()) errors.role = "Role is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) {
      showMessage("Please correct the form errors.", 'error');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        name: formData.name,
        phone: formData.phone,
        // Role update is handled by separate updateUserRole, not here
        // Email typically not editable directly by another user
      };
      await updateUser(userId, updates);

      // If role was changed, call updateUserRole
      if (formData.role !== userProfile.role) {
        await updateUserRole(userId, formData.role);
      }

      showMessage("User profile updated successfully!", 'success');
      setIsEditing(false);
      fetchUserProfileData(); // Re-fetch to get latest data
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to update user profile: ${msg}`);
      showMessage(`Failed to update user profile: ${msg}`, 'error');
      console.error("Update user profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async () => {
    if (window.confirm("Are you sure you want to approve this user? They will gain full access to the platform based on their role.")) {
      try {
        await approveUser(userId);
        showMessage("User approved successfully!", 'success');
        fetchUserProfileData(); // Re-fetch to update status
      } catch (err) {
        showMessage(`Failed to approve user: ${err.response?.data?.message || err.message}`, 'error');
        console.error("Approve user error:", err);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone and will remove all their data and associations from the system.")) {
      try {
        await deleteUser(userId);
        showMessage("User deleted successfully!", 'success');
        navigate('/pm/users'); // Redirect to user list
      } catch (err) {
        showMessage(`Failed to delete user: ${err.response?.data?.message || err.message}`, 'error');
        console.error("Delete user error:", err);
      }
    }
  };

  // --- Unit Assignment Handlers (specific for tenant users) ---
  const handleAssignUnitSubmit = async () => {
    setAssignUnitModalError('');
    if (!assignUnitPropertyId || !assignUnitId) {
      setAssignUnitModalError('Please select both a property and a unit.');
      return;
    }
    try {
      await assignTenantToUnit(assignUnitPropertyId, assignUnitId, userId); // Use unitService
      showMessage(`Tenant assigned to unit successfully!`, 'success');
      setShowAssignUnitModal(false);
      fetchUserProfileData(); // Re-fetch user profile to show updated associations
    } catch (err) {
      setAssignUnitModalError(`Failed to assign unit: ${err.response?.data?.message || err.message}`);
      console.error("Assign unit error:", err);
    }
  };

  const handleRemoveUnit = async (propertyIdToRemove, unitIdToRemove) => {
    if (window.confirm("Are you sure you want to remove this tenant from this unit?")) {
      try {
        await removeTenantFromUnit(propertyIdToRemove, unitIdToRemove, userId); // Use unitService
        showMessage("Tenant removed from unit successfully!", 'success');
        fetchUserProfileData(); // Re-fetch user profile to show updated associations
      } catch (err) {
        showMessage(`Failed to remove unit: ${err.response?.data?.message || err.message}`, 'error');
        console.error("Remove unit error:", err);
      }
    }
  };


  if (loading) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Loading user profile...</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  if (error) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  if (!userProfile) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">User not found.</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  // Determine available units for assignment (units in selected property that are not already assigned to this user)
  const availableUnitsForAssign = assignUnitPropertyId
    ? unitsForAssign.filter(
        unit => !userProfile.associations?.tenancies?.some(
            t => t.unit?._id === unit._id && t.property?._id === assignUnitPropertyId
        )
    )
    : [];

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <div className="flex items-center mb-6">
          <Button
            onClick={() => navigate('/pm/users')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg flex items-center mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Users
          </Button>
          <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-2 flex-1 flex items-center">
            <User className="w-8 h-8 mr-3 text-green-700" />
            Manage User: {userProfile.name || userProfile.email}
          </h1>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-4xl mx-auto">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                  disabled={loading}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
                  disabled // Email cannot be changed directly via this form
                />
                <p className="mt-1 text-sm text-gray-500">Email is read-only.</p>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role:</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${formErrors.role ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 capitalize`}
                  required
                  disabled={loading} // Only certain roles can change other's roles
                >
                  {userRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-5 rounded-lg shadow-sm flex items-center"
                  disabled={loading}
                >
                  <XSquare className="w-5 h-5 mr-2" /> Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
                  disabled={loading}
                >
                  <CheckSquare className="w-5 h-5 mr-2" /> Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-lg">
                <p className="flex items-center"><User className="w-5 h-5 mr-2 text-gray-500" /> <strong>Name:</strong> {userProfile.name || 'N/A'}</p>
                <p className="flex items-center"><Mail className="w-5 h-5 mr-2 text-gray-500" /> <strong>Email:</strong> {userProfile.email}</p>
                <p className="flex items-center"><Phone className="w-5 h-5 mr-2 text-gray-500" /> <strong>Phone:</strong> {userProfile.phone || 'N/A'}</p>
                <p className="flex items-center"><strong>Role:</strong> <span className="capitalize">{userProfile.role}</span></p>
                <p className="flex items-center">
                  <strong>Status:</strong>
                  <span className={`ml-2 px-2.5 py-1 rounded-full text-sm font-semibold ${userProfile.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {userProfile.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                </p>
              </div>

              {/* Approval Action */}
              {!userProfile.isApproved && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleApproveUser} className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" /> Approve User
                  </Button>
                </div>
              )}

              <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4 border-t pt-4">User Associations</h3>
              {userProfile.associations?.tenancies?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Tenancies:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {userProfile.associations.tenancies.map(tenancy => (
                      <li key={tenancy.unit?._id || tenancy.property?._id} className="flex items-center justify-between">
                        <span>
                          Property: <Link to={`/pm/properties/${tenancy.property?._id}`} className="text-blue-600 hover:underline font-medium">{tenancy.property?.name || 'N/A'}</Link>
                          {tenancy.unit && <span>, Unit: <Link to={`/pm/properties/${tenancy.property?._id}/units/${tenancy.unit?._id}`} className="text-blue-600 hover:underline font-medium">{tenancy.unit?.unitName || 'N/A'}</Link></span>}
                        </span>
                        {userProfile.role === 'tenant' && (
                          <Button
                            onClick={() => handleRemoveUnit(tenancy.property._id, tenancy.unit._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm ml-4"
                          >
                            Remove
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {userProfile.associations?.managedProperties?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Managed Properties:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {userProfile.associations.managedProperties.map(property => (
                      <li key={property._id}>
                        <Link to={`/pm/properties/${property._id}`} className="text-blue-600 hover:underline font-medium">{property.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {userProfile.associations?.assignedVendors?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Vendor Companies:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {userProfile.associations.assignedVendors.map(vendor => (
                      <li key={vendor._id}>
                        <Link to={`/pm/vendors/${vendor._id}`} className="text-blue-600 hover:underline font-medium">{vendor.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add other associations as needed (e.g., ownedProperties for Landlords) */}
              {!userProfile.associations?.tenancies?.length &&
               !userProfile.associations?.managedProperties?.length &&
               !userProfile.associations?.assignedVendors?.length && (
                <p className="text-gray-600 italic">No specific property/unit associations found for this user.</p>
              )}


              <div className="mt-8 flex justify-between space-x-4">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
                >
                  <PenSquare className="w-5 h-5 mr-2" /> Edit User Profile
                </Button>
                {userProfile.role === 'tenant' && (
                    <Button
                        onClick={() => setShowAssignUnitModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
                    >
                        <Home className="w-5 h-5 mr-2" /> Assign Unit
                    </Button>
                )}
                {/* Admin-level delete button */}
                <Button
                  onClick={handleDeleteUser}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
                >
                  <Trash2 className="w-5 h-5 mr-2" /> Delete User
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Assign Unit Modal (for tenant users) */}
        {userProfile.role === 'tenant' && (
          <Modal
            isOpen={showAssignUnitModal}
            onClose={() => setShowAssignUnitModal(false)}
            title={`Assign ${userProfile.name || userProfile.email} to Unit`}
          >
            <div className="p-4 space-y-4">
              {assignUnitModalError && <p className="text-red-500 mb-3">{assignUnitModalError}</p>}
              <div>
                <label htmlFor="assignUnitProperty" className="block text-sm font-medium text-gray-700">Select Property:</label>
                <select
                  id="assignUnitProperty"
                  value={assignUnitPropertyId}
                  onChange={handlePropertyChangeForAssignModal}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select Property --</option>
                  {properties.map(prop => (
                    <option key={prop._id} value={prop._id}>{prop.name}</option>
                  ))}
                </select>
              </div>
              {assignUnitPropertyId && (
                <div>
                  <label htmlFor="assignUnit" className="block text-sm font-medium text-gray-700">Select Unit:</label>
                  <select
                    id="assignUnit"
                    value={assignUnitId}
                    onChange={e => {setAssignUnitId(e.target.value); setAssignUnitModalError('');}}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={availableUnitsForAssign.length === 0}
                  >
                    <option value="">-- Select Unit --</option>
                    {availableUnitsForAssign.map(unit => (
                      <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                    ))}
                  </select>
                  {availableUnitsForAssign.length === 0 && <p className="text-sm text-gray-500 mt-1">No unassigned units available in this property.</p>}
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setShowAssignUnitModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignUnitSubmit}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
                  disabled={!assignUnitPropertyId || !assignUnitId}
                >
                  Assign Unit
                </Button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </PropertyManagerLayout>
  );
}

export default UserProfileManagementPage;
