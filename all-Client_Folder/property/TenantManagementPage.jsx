// frontend/src/pages/property/TenantManagementPage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from "../../components/layout/MainLayout"; // Assuming PM/Landlord use MainLayout
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal'; // For invite modal
import Pagination from '../../components/common/Pagination'; // Assuming basic pagination component

// Import updated service functions
import { getAllUsers, deleteUser } from '../../services/userService'; // Use getAllUsers with role filter
import { getAllProperties } from '../../services/propertyService'; // To filter tenants by property

// Helper for displaying messages to user (instead of alert)
const showMessage = (msg, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${msg}`);
    alert(msg); // Keeping alert for now
};

/**
 * TenantManagementPage allows Property Managers/Landlords to view and manage tenants
 * associated with their properties.
 */
function TenantManagementPage() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterProperty, setFilterProperty] = useState(''); // Filter by property ID
    const [properties, setProperties] = useState([]); // List of properties for filtering
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePropertyId, setInvitePropertyId] = useState('');
    const [inviteUnitId, setInviteUnitId] = useState('');
    const [inviteError, setInviteError] = useState('');

    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            try {
                // Fetch properties for the current user to populate filter dropdown
                const userProperties = await getAllProperties(); // This already filters by user role
                setProperties(userProperties);

                // Fetch tenants. Initial fetch can be all tenants, or filtered by first property.
                // For now, fetch all users with role 'tenant'. Backend will filter by user's access.
                const initialTenants = await getAllUsers({ role: 'tenant' });
                setTenants(initialTenants);
            } catch (err) {
                setError('Failed to fetch data.');
                console.error("Initial data fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { role: 'tenant' };
            if (filterProperty) {
                params.propertyId = filterProperty;
            }
            const data = await getAllUsers(params);
            setTenants(data);
        } catch (err) {
            setError('Failed to fetch tenants.');
            console.error("Fetch tenants error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants(); // Re-fetch tenants when filterProperty changes
    }, [filterProperty]);


    const handleDeleteTenant = async (tenantId) => {
        if (window.confirm("Are you sure you want to delete this tenant? This action cannot be undone and will remove all their associations.")) {
            try {
                // Backend deleteUser handles cascading cleanup for PropertyUser entries etc.
                await deleteUser(tenantId);
                showMessage("Tenant deleted successfully!", 'success');
                setTenants(tenants.filter((tenant) => tenant._id !== tenantId)); // Update UI
            } catch (err) {
                showMessage("Failed to delete tenant: " + (err.response?.data?.message || err.message), 'error');
                console.error("Delete tenant error:", err);
            }
        }
    };

    const handleSendInvite = async () => {
        setInviteError('');
        if (!inviteEmail || !invitePropertyId) {
            setInviteError('Email and Property must be selected.');
            return;
        }
        // This would call your new inviteService.sendInvite function
        // For now, it's a placeholder as inviteService is not built yet.
        showMessage(`Inviting ${inviteEmail} to property ${invitePropertyId} (Unit: ${inviteUnitId || 'N/A'}) as a tenant. (Simulated)`, 'info');
        // Example if inviteService existed:
        // try {
        //     await inviteService.sendInvite({
        //         email: inviteEmail,
        //         role: 'tenant',
        //         propertyId: invitePropertyId,
        //         unitId: inviteUnitId || null
        //     });
        //     showMessage('Invitation sent successfully!', 'success');
        //     setShowInviteModal(false);
        //     setInviteEmail('');
        //     setInvitePropertyId('');
        //     setInviteUnitId('');
        // } catch (err) {
        //     setInviteError('Failed to send invitation: ' + (err.response?.data?.message || err.message));
        // }
    };


    return (
        <MainLayout> {/* Use MainLayout for PM/Landlord pages */}
            <div className="p-4 md:p-8 bg-gray-50 min-h-full">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">Tenant Management</h1>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>}

                {/* Filters and Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <label htmlFor="propertyFilter" className="text-gray-700 font-medium">Filter by Property:</label>
                        <select
                            id="propertyFilter"
                            value={filterProperty}
                            onChange={(e) => setFilterProperty(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Properties</option>
                            {properties.map(prop => (
                                <option key={prop._id} value={prop._id}>{prop.name}</option>
                            ))}
                        </select>
                    </div>
                    <Button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md"
                    >
                        Invite New Tenant
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-xl text-gray-600">Loading tenants...</p>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="overflow-x-auto">
                            {tenants.length === 0 ? (
                                <p className="text-gray-600 italic text-center py-8">No tenants found matching criteria.</p>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associated Properties/Units</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tenants.map((tenant) => (
                                            <tr key={tenant._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tenant.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tenant.phone || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {/* Displaying associated properties/units from fetched user details */}
                                                    {tenant.associations?.tenancies?.length > 0 ? (
                                                        <ul className="list-disc list-inside">
                                                            {tenant.associations.tenancies.map(t => (
                                                                <li key={t.unit._id}>
                                                                    {t.property.name} ({t.unit.unitName})
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="italic">No current unit</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link to={`/properties/${filterProperty}/tenants/${tenant._id}`} className="text-blue-600 hover:text-blue-900 mr-3">Manage</Link>
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
                        {/* Pagination (adjust props based on your Pagination component) */}
                        <Pagination totalItems={tenants.length} itemsPerPage={10} currentPage={1} onPageChange={() => {}} />
                    </div>
                )}

                {/* Invite Tenant Modal */}
                <Modal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    title="Invite New Tenant"
                >
                    <div className="p-4">
                        <p className="text-gray-700 mb-4">Send an invitation to a new tenant. They will be prompted to set up their account and link to a specific property and unit.</p>
                        {inviteError && <p className="text-red-500 mb-3">{inviteError}</p>}
                        <div className="mb-4">
                            <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">Tenant Email:</label>
                            <input
                                type="email"
                                id="inviteEmail"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="tenant@example.com"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="inviteProperty" className="block text-sm font-medium text-gray-700 mb-1">Property:</label>
                            <select
                                id="inviteProperty"
                                value={invitePropertyId}
                                onChange={(e) => { setInvitePropertyId(e.target.value); setInviteUnitId(''); }} // Reset unit when property changes
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                                <label htmlFor="inviteUnit" className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional, but recommended for tenants):</label>
                                <select
                                    id="inviteUnit"
                                    value={inviteUnitId}
                                    onChange={(e) => setInviteUnitId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendInvite}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                            >
                                Send Invite
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </MainLayout>
    );
}

export default TenantManagementPage;


import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/authService';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(token, password);
      setError(false);
      setMessage('✅ Password reset successfully. Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(true);
      setMessage('❌ Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-200 space-y-6 animate-fadeIn"
      >
        <h2 className="text-2xl font-bold text-center text-[#219377]">Reset Your Password</h2>
        <p className="text-sm text-center text-gray-500">Secure your FixIt account with a new password</p>

        {message && (
          <div
            className={`text-sm text-center font-medium px-4 py-2 rounded ${
              error ? 'bg-red-100 text-red-600' : 'bg-[#e6f8f2] text-[#219377]'
            }`}
          >
            {message}
          </div>
        )}

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377] transition"
        />

        <button
          type="submit"
          className="w-full py-2 px-4 rounded-md text-white font-medium bg-[#219377] hover:bg-[#1b7f66] transition"
        >
          Reset Password
        </button>

        <div className="text-sm text-center text-gray-600">
          <button
            onClick={() => navigate('/login')}
            type="button"
            className="text-[#ffbd59] hover:underline font-medium"
          >
            Back to Login
          </button>
        </div>
      </form>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default ResetPasswordPage;
