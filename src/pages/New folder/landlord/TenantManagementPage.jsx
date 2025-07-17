import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';

import { getAllUsers, deleteUserById, createUser } from '../../services/userService';
import { getAllProperties } from '../../services/propertyService';
import { createInvite } from '../../services/inviteService';

const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Helper for displaying messages (replace with toast in production)
const showMessage = (msg, type = 'info') => {
  alert(msg);
};

function TenantManagementPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterProperty, setFilterProperty] = useState('');
  const [properties, setProperties] = useState([]);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePropertyId, setInvitePropertyId] = useState('');
  const [inviteUnitId, setInviteUnitId] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Add tenant modal state
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [addTenantDetails, setAddTenantDetails] = useState({
    name: "",
    email: "",
    phone: "",
    propertyId: "",
    unitId: ""
  });
  const [addTenantError, setAddTenantError] = useState("");

  // Initial fetch
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      try {
        const userProperties = await getAllProperties();
        setProperties(userProperties);

        const initialTenants = await getAllUsers({ role: 'tenant' });
        setTenants(initialTenants);
      } catch (err) {
        setError('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  // Fetch tenants when filter changes
  useEffect(() => {
    async function fetchTenants() {
      setLoading(true);
      setError(null);
      try {
        const params = { role: 'tenant' };
        if (filterProperty) params.propertyId = filterProperty;
        const data = await getAllUsers(params);
        setTenants(data);
      } catch (err) {
        setError('Failed to fetch tenants.');
      } finally {
        setLoading(false);
      }
    }
    fetchTenants();
  }, [filterProperty]);

  // Delete tenant handler
  const handleDeleteTenant = async (tenantId) => {
    if (window.confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      try {
        await deleteUserById(tenantId);
        showMessage("Tenant deleted successfully!", 'success');
        setTenants(tenants.filter((tenant) => tenant._id !== tenantId));
      } catch (err) {
        showMessage("Failed to delete tenant: " + (err.response?.data?.message || err.message), 'error');
      }
    }
  };

  // Send invite handler
  const handleCreateInvite = async () => {
    setInviteError('');
    if (!inviteEmail || !invitePropertyId) {
      setInviteError('Email and Property must be selected.');
      return;
    }
    try {
      await createInvite({
        email: inviteEmail,
        role: 'tenant',
        property: invitePropertyId,
        unit: inviteUnitId || undefined
      });
      showMessage('Invitation sent successfully!', 'success');
      setShowInviteModal(false);
      setInviteEmail('');
      setInvitePropertyId('');
      setInviteUnitId('');
    } catch (err) {
      setInviteError('Failed to send invitation: ' + (err.response?.data?.message || err.message));
    }
  };

  // Add tenant handler
  const handleAddTenant = async () => {
    setAddTenantError("");
    const { name, email, phone, propertyId, unitId } = addTenantDetails;
    if (!name || !email || !propertyId) {
      setAddTenantError("Name, Email, and Property are required.");
      return;
    }
    try {
      const newTenant = await createUser({
        name,
        email,
        phone,
        propertyId,
        unitId: unitId || undefined
      });
      setTenants([...tenants, newTenant]);
      setShowAddTenantModal(false);
      setAddTenantDetails({ name: "", email: "", phone: "", propertyId: "", unitId: "" });
      showMessage("Tenant added successfully!", "success");
    } catch (err) {
      setAddTenantError("Failed to add tenant: " + (err.response?.data?.message || err.message));
    }
  };

  // Table for tenant associations
  const renderAssociations = (tenant) => {
    const tenancies = tenant.associations?.tenancies || [];
    if (!tenancies.length) return <span className="italic text-gray-500">No current unit</span>;
    return (
      <ul className="list-disc list-inside">
        {tenancies.map(t => (
          <li key={t.unit._id}>
            {t.property.name} ({t.unit.unitName})
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
        Tenant Management
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Filters and Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-lg shadow-sm border"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "14" }}
      >
        <div className="flex items-center gap-3">
          <label htmlFor="propertyFilter" className="text-gray-700 font-medium">Filter by Property:</label>
          <select
            id="propertyFilter"
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2"
            style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
          >
            <option value="">All Properties</option>
            {properties.map(prop => (
              <option key={prop._id} value={prop._id}>{prop.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddTenantModal(true)}
            className="py-2 px-5 rounded-lg shadow-md font-semibold"
            style={{ backgroundColor: SECONDARY_COLOR, color: "#1a3b34" }}
          >
            Add Tenant Manually
          </Button>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="py-2 px-5 rounded-lg shadow-md font-semibold"
            style={{ backgroundColor: PRIMARY_COLOR, color: "#fff" }}
          >
            Invite New Tenant
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading tenants...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg border" style={{ borderColor: PRIMARY_COLOR + "14" }}>
          <div className="overflow-x-auto">
            {tenants.length === 0 ? (
              <p className="text-gray-600 italic text-center py-8">No tenants found matching criteria.</p>
            ) : (
              <table className="min-w-full divide-y" style={{ borderColor: PRIMARY_COLOR + "10" }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Properties / Units</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant._id} className="hover:bg-[#f0fdfa] transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tenant.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{tenant.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{tenant.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{renderAssociations(tenant)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/landlord/properties/${tenant.associations?.tenancies?.[0]?.property?._id}/tenants/${tenant._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Manage
                        </Link>
                        <button
                          onClick={() => handleDeleteTenant(tenant._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination totalItems={tenants.length} itemsPerPage={10} currentPage={1} onPageChange={() => {}} />
        </div>
      )}

      {/* Invite Tenant Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Invite New Tenant</span>}
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">Send an invitation to a new tenant. They will be prompted to set up their account and link to a specific property and unit.</p>
          {inviteError && <p className="text-red-500 mb-3">{inviteError}</p>}
          <div className="mb-4">
            <label htmlFor="inviteEmail" className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Tenant Email:</label>
            <input
              type="email"
              id="inviteEmail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{ borderColor: PRIMARY_COLOR }}
              placeholder="tenant@example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="inviteProperty" className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Property:</label>
            <select
              id="inviteProperty"
              value={invitePropertyId}
              onChange={(e) => { setInvitePropertyId(e.target.value); setInviteUnitId(''); }}
              className="w-full px-3 py-2 border rounded-md"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>
          </div>
          {invitePropertyId && (
            <div className="mb-4">
              <label htmlFor="inviteUnit" className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
                Unit <span className="italic text-gray-500">(Optional, recommended for tenants)</span>:
              </label>
              <select
                id="inviteUnit"
                value={inviteUnitId}
                onChange={(e) => setInviteUnitId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                style={{ borderColor: PRIMARY_COLOR }}
              >
                <option value="">Select Unit (Optional)</option>
                {properties.find(p => p._id === invitePropertyId)?.units?.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={() => setShowInviteModal(false)}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvite}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: PRIMARY_COLOR,
                color: "#fff",
                fontWeight: 600
              }}
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Tenant Modal */}
      <Modal
        isOpen={showAddTenantModal}
        onClose={() => setShowAddTenantModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Add Tenant Manually</span>}
      >
        <div className="p-4">
          {addTenantError && <p className="text-red-500 mb-3">{addTenantError}</p>}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Name:</label>
            <input
              type="text"
              value={addTenantDetails.name}
              onChange={e => setAddTenantDetails(d => ({ ...d, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Email:</label>
            <input
              type="email"
              value={addTenantDetails.email}
              onChange={e => setAddTenantDetails(d => ({ ...d, email: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Phone:</label>
            <input
              type="tel"
              value={addTenantDetails.phone}
              onChange={e => setAddTenantDetails(d => ({ ...d, phone: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              style={{ borderColor: PRIMARY_COLOR }}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Property:</label>
            <select
              value={addTenantDetails.propertyId}
              onChange={e => setAddTenantDetails(d => ({ ...d, propertyId: e.target.value, unitId: "" }))}
              className="w-full px-3 py-2 border rounded-md"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>
          </div>
          {addTenantDetails.propertyId && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Unit:</label>
              <select
                value={addTenantDetails.unitId}
                onChange={e => setAddTenantDetails(d => ({ ...d, unitId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                style={{ borderColor: PRIMARY_COLOR }}
              >
                <option value="">Select Unit (optional)</option>
                {properties.find(p => p._id === addTenantDetails.propertyId)?.units?.map(unit => (
                  <option key={unit._id} value={unit._id}>{unit.unitName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={() => setShowAddTenantModal(false)}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTenant}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: SECONDARY_COLOR,
                color: "#1a3b34",
                fontWeight: 600
              }}
            >
              Add Tenant
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TenantManagementPage;