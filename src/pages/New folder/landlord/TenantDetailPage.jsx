import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserById,
  updateUserById,
  deleteUserById,
} from "../../services/userService";
import { getPropertyById } from "../../services/propertyService";
import {
  assignTenantToUnit,
  removeTenantFromUnit,
} from "../../services/unitService";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Helper for displaying messages (replace with toast in production)
const showMessage = (msg, type = "info") => {
  alert(msg);
};

function TenantDetailPage() {
  const { propertyId, tenantId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [assignError, setAssignError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const tenantData = await getUserById(tenantId);
        if (tenantData.role !== "tenant") {
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
        setError(
          "Failed to load tenant or property details: " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [propertyId, tenantId]);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const updates = {
        name: formData.name,
        phone: formData.phone,
      };
      const updatedTenant = await updateUserById(tenantId, updates);
      setTenant(updatedTenant);
      setIsEditing(false);
      showMessage("Tenant profile updated successfully!", "success");
    } catch (err) {
      setError(
        "Failed to update tenant: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDeleteTenant = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this tenant? This action cannot be undone and will remove all their associations from the system."
      )
    ) {
      try {
        await deleteUserById(tenantId);
        showMessage("Tenant deleted successfully!", "success");
        navigate(`/properties/${propertyId}/tenants`);
      } catch (err) {
        showMessage(
          "Failed to delete tenant: " +
            (err.response?.data?.message || err.message),
          "error"
        );
      }
    }
  };

  const handleAssignUnit = async () => {
    setAssignError("");
    if (!selectedUnitId) {
      setAssignError("Please select a unit.");
      return;
    }
    try {
      await assignTenantToUnit(propertyId, selectedUnitId, tenantId);
      showMessage(`Tenant assigned to unit successfully!`, "success");
      setShowAssignModal(false);

      // Re-fetch tenant and property details to update UI
      const updatedTenantData = await getUserById(tenantId);
      setTenant(updatedTenantData);
      const updatedPropertyData = await getPropertyById(propertyId);
      setProperty(updatedPropertyData);
    } catch (err) {
      setAssignError(
        "Failed to assign tenant to unit: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleRemoveUnit = async (unitToRemoveId) => {
    const unit = property.units.find((u) => u._id === unitToRemoveId);
    if (
      window.confirm(
        `Are you sure you want to remove this tenant from unit "${unit?.unitName}"?`
      )
    ) {
      try {
        await removeTenantFromUnit(propertyId, unitToRemoveId, tenantId);
        showMessage("Tenant removed from unit successfully!", "success");
        const updatedTenantData = await getUserById(tenantId);
        setTenant(updatedTenantData);
        const updatedPropertyData = await getPropertyById(propertyId);
        setProperty(updatedPropertyData);
      } catch (err) {
        showMessage(
          "Failed to remove tenant from unit: " +
            (err.response?.data?.message || err.message),
          "error"
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
          Loading tenant details...
        </p>
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
  const currentTenancies =
    tenant.associations?.tenancies?.filter(
      (t) => t.property?._id === propertyId && t.unit
    ) || [];

  const availableUnits =
    property.units?.filter(
      (unit) => !currentTenancies.some((t) => t.unit._id === unit._id)
    ) || [];

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3 flex flex-wrap items-end gap-3"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        Manage Tenant: {tenant.name}
        <span className="text-xl font-medium text-gray-600">
          ({property.name})
        </span>
      </h1>
      <div
        className="bg-white p-8 rounded-xl shadow-lg border max-w-3xl mx-auto"
        style={{ borderColor: PRIMARY_COLOR + "14" }}
      >
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1"
                style={{ color: PRIMARY_COLOR }}
              >
                Name:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: PRIMARY_COLOR }}
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
                style={{ color: PRIMARY_COLOR }}
              >
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                className="w-full px-4 py-2 border bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
                style={{ borderColor: PRIMARY_COLOR + "33" }}
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">
                Email cannot be changed.
              </p>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-1"
                style={{ color: PRIMARY_COLOR }}
              >
                Phone:
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: PRIMARY_COLOR }}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2 px-5 rounded-lg"
                style={{
                  backgroundColor: "#e4e4e7",
                  color: PRIMARY_COLOR,
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="py-2 px-5 rounded-lg"
                style={{
                  backgroundColor: PRIMARY_COLOR,
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              <p className="text-gray-700 text-lg">
                <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>
                  Name:
                </span>{" "}
                {tenant.name}
              </p>
              <p className="text-gray-700 text-lg">
                <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>
                  Email:
                </span>{" "}
                {tenant.email}
              </p>
              <p className="text-gray-700 text-lg">
                <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>
                  Phone:
                </span>{" "}
                {tenant.phone || "N/A"}
              </p>
            </div>

            <h3
              className="text-xl font-semibold mt-8 mb-4 border-t pt-4"
              style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR + "14" }}
            >
              Unit Assignments for {property.name}
            </h3>
            {currentTenancies.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {currentTenancies.map((tenancy) => (
                  <li
                    key={tenancy.unit._id}
                    className="flex items-center justify-between py-1"
                  >
                    <span>
                      Unit:{" "}
                      <strong style={{ color: SECONDARY_COLOR }}>
                        {tenancy.unit.unitName}
                      </strong>{" "}
                      <span className="text-gray-500 text-xs">
                        (ID: {tenancy.unit._id})
                      </span>
                    </span>
                    <Button
                      onClick={() => handleRemoveUnit(tenancy.unit._id)}
                      className="px-4 py-1 rounded-md text-sm"
                      style={{
                        backgroundColor: "#e64848",
                        color: "#fff",
                        fontWeight: 500,
                      }}
                    >
                      Remove from Unit
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 italic">
                This tenant is not currently assigned to any unit in this
                property.
              </p>
            )}

            <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
              <Button
                onClick={() => setIsEditing(true)}
                className="py-2 px-5 rounded-lg"
                style={{
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Edit Tenant Details
              </Button>
              <Button
                onClick={() => setShowAssignModal(true)}
                className="py-2 px-5 rounded-lg"
                style={{
                  backgroundColor: "#a78bfa",
                  color: "#2d3748",
                  fontWeight: 600,
                  opacity:
                    availableUnits.length === 0 && currentTenancies.length > 0
                      ? 0.6
                      : 1,
                  pointerEvents:
                    availableUnits.length === 0 && currentTenancies.length > 0
                      ? "none"
                      : "auto",
                }}
                disabled={
                  availableUnits.length === 0 && currentTenancies.length > 0
                }
              >
                Assign to Unit
              </Button>
            </div>
            <div className="mt-6 text-center">
              <Button
                onClick={handleDeleteTenant}
                className="py-2 px-5 rounded-lg"
                style={{
                  backgroundColor: "#e64848",
                  color: "#fff",
                  fontWeight: 600,
                }}
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
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Assign Tenant to Unit</span>}
      >
        <div className="p-4">
          {assignError && <p className="text-red-500 mb-3">{assignError}</p>}
          <p className="mb-4 text-gray-700">
            Select a unit to assign <span className="font-semibold">{tenant.name}</span> in <span className="font-semibold">{property.name}</span>:
          </p>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md mb-4"
            style={{ borderColor: PRIMARY_COLOR }}
          >
            <option value="">-- Select a Unit --</option>
            {availableUnits.map((unit) => (
              <option key={unit._id} value={unit._id}>
                {unit.unitName}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={() => setShowAssignModal(false)}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUnit}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: PRIMARY_COLOR,
                color: "#fff",
                fontWeight: 600,
              }}
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

export default TenantDetailPage;