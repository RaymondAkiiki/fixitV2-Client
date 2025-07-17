// frontend/src/pages/property/PMTenantDetailPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById, updateUserById, deleteUserById } from "../../services/userService"; // For managing other users
import { getPropertyById } from "../../services/propertyService"; // To verify context
import { assignTenantToUnit, removeTenantFromUnit } from "../../services/unitService"; // To manage unit assignments
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";

// Helper for displaying messages to user (instead of alert)
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Keeping alert for now
};

/**
 * PMTenantDetailPage allows a Property Manager/pm to view and edit details
 * of a specific tenant within a property they manage.
 * Also allows assigning/removing tenant from units.
 */
function PMTenantDetailPage() {
  const { propertyId, tenantId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [assignError, setAssignError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const tenantData = await getUserById(tenantId); // Get tenant details via userService
        if (tenantData.role !== 'tenant') { // Ensure it's actually a tenant
          setError("User is not a tenant.");
          setLoading(false);
          return;
        }
        setTenant(tenantData);
        setFormData({
          name: tenantData.name || "",
          email: tenantData.email || "",
          phone: tenantData.phone || "",
        });

        const propertyData = await getPropertyById(propertyId);
        setProperty(propertyData);

      } catch (err) {
        setError("Failed to load tenant or property details: " + (err.response?.data?.message || err.message));
        console.error("Fetch tenant/property details error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [propertyId, tenantId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Only send updatable fields as a PM/pm
      const updates = {
        name: formData.name,
        phone: formData.phone,
        // Do NOT include email or role changes here as they are restricted or handled elsewhere
      };
      const updatedTenant = await updateUserById(tenantId, updates); // Update via userService
      setTenant(updatedTenant);
      setIsEditing(false);
      showMessage("Tenant profile updated successfully!", 'success');
    } catch (err) {
      setError("Failed to update tenant: " + (err.response?.data?.message || err.message));
      console.error("Update tenant error:", err);
    }
  };

  const handleDeleteTenant = async () => {
    if (window.confirm("Are you sure you want to delete this tenant? This action cannot be undone and will remove all their associations from the system.")) {
      try {
        await deleteUserById(tenantId); // Delete via userService
        showMessage("Tenant deleted successfully!", 'success');
        navigate(`/properties/${propertyId}/tenants`); // Redirect back to tenant list
      } catch (err) {
        showMessage("Failed to delete tenant: " + (err.response?.data?.message || err.message), 'error');
        console.error("Delete tenant error:", err);
      }
    }
  };

  const handleAssignUnit = async () => {
    setAssignError('');
    if (!selectedUnitId) {
      setAssignError('Please select a unit.');
      return;
    }
    try {
      await assignTenantToUnit(propertyId, selectedUnitId, tenantId); // Use unitService
      showMessage(`Tenant assigned to unit ${selectedUnitId} successfully!`, 'success');
      setShowAssignModal(false);
      // Re-fetch tenant and property details to update UI
      const updatedTenantData = await getUserById(tenantId);
      setTenant(updatedTenantData);
      const updatedPropertyData = await getPropertyById(propertyId);
      setProperty(updatedPropertyData);
    } catch (err) {
      setAssignError("Failed to assign tenant to unit: " + (err.response?.data?.message || err.message));
      console.error("Assign unit error:", err);
    }
  };

  const handleRemoveUnit = async (unitToRemoveId) => {
    if (window.confirm(`Are you sure you want to remove this tenant from unit ${property.units.find(u => u._id === unitToRemoveId)?.unitName}?`)) {
      try {
        await removeTenantFromUnit(propertyId, unitToRemoveId, tenantId); // Use unitService
        showMessage("Tenant removed from unit successfully!", 'success');
        // Re-fetch tenant and property details to update UI
        const updatedTenantData = await getUserById(tenantId);
        setTenant(updatedTenantData);
        const updatedPropertyData = await getPropertyById(propertyId);
        setProperty(updatedPropertyData);
      } catch (err) {
        showMessage("Failed to remove tenant from unit: " + (err.response?.data?.message || err.message), 'error');
        console.error("Remove unit error:", err);
      }
    }
  };


  if (loading) {
    return (
      
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Loading tenant details...</p>
      </div>
      
    );
  }

  if (error) {
    return (
      
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    
    );
  }

  if (!tenant || !property) {
    return (
      
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Tenant or Property data not found.</p>
      </div>
    
    );
  }

  // Find the unit(s) this tenant is currently assigned to within this property
  const currentTenancies = tenant.associations?.tenancies?.filter(
    t => t.property?._id === propertyId && t.unit
  ) || [];

  const availableUnits = property.units?.filter(
    unit => !currentTenancies.some(t => t.unit._id === unit._id)
  ) || [];


  return (
  
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">
        Manage Tenant: {tenant.name}
        <span className="text-xl text-gray-600 ml-4">({property.name})</span>
      </h1>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-3xl mx-auto">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed.</p>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-5 rounded-lg shadow-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700 text-lg"><strong>Name:</strong> {tenant.name}</p>
            <p className="text-gray-700 text-lg"><strong>Email:</strong> {tenant.email}</p>
            <p className="text-gray-700 text-lg"><strong>Phone:</strong> {tenant.phone || "N/A"}</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4 border-t pt-4">Unit Assignments for {property.name}</h3>
            {currentTenancies.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {currentTenancies.map(tenancy => (
                  <li key={tenancy.unit._id} className="flex items-center justify-between py-1">
                    <span>Unit: <strong>{tenancy.unit.unitName}</strong> (ID: {tenancy.unit._id})</span>
                    <Button
                      onClick={() => handleRemoveUnit(tenancy.unit._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm ml-4"
                    >
                      Remove from Unit
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 italic">This tenant is not currently assigned to any unit in this property.</p>
            )}

            <div className="mt-8 flex justify-between space-x-4">
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg shadow-md"
              >
                Edit Tenant Details
              </Button>
              <Button
                onClick={() => setShowAssignModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg shadow-md"
                disabled={availableUnits.length === 0 && currentTenancies.length > 0} // Disable if no units left or already assigned
              >
                Assign to Unit
              </Button>
            </div>
            <div className="mt-6 text-center">
              <Button
                onClick={handleDeleteTenant}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-5 rounded-lg shadow-md"
              >
                Delete Tenant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Unit Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Tenant to Unit"
      >
        <div className="p-4">
          {assignError && <p className="text-red-500 mb-3">{assignError}</p>}
          <p className="mb-4 text-gray-700">Select a unit to assign {tenant.name} to in {property.name}:</p>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-4"
          >
            <option value="">-- Select a Unit --</option>
            {availableUnits.map(unit => (
              <option key={unit._id} value={unit._id}>{unit.unitName}</option>
            ))}
          </select>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={() => setShowAssignModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUnit}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
              disabled={!selectedUnitId}
            >
              Assign Unit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  
  );
}

export default PMTenantDetailPage;
