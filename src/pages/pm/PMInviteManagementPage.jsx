// frontend/src/pages/pm/PMInviteManagementPage.jsx (COMPLETED & REVISED)

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, XCircle, RefreshCw, Send, UserPlus } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';

// Import NEW service functions
import { sendInvite, getAllInvites, revokeInvite, resendInvite } from '../../services/inviteService';
import { getAllProperties } from '../../services/propertyService';
import { listUnits } from '../../services/unitService';

const PMInviteManagementPage = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);

    // Pagination and filters
    const [filters, setFilters] = useState({ page: 1, limit: 10 });
    const [totalPages, setTotalPages] = useState(1);

    // State for invite modal
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: "", role: "tenant", propertyId: "", unitId: "" });
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchInvites = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllInvites(filters);
            setInvites(data.invites || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError('Failed to fetch invites.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    // Fetch properties when the modal is about to be opened
    useEffect(() => {
        if (showInviteModal && properties.length === 0) {
            getAllProperties()
                .then(data => setProperties(data.properties || []))
                .catch(err => setFormError("Could not load properties."));
        }
    }, [showInviteModal, properties.length]);
    
    // Fetch units when a property is selected in the form
    useEffect(() => {
        if (inviteForm.propertyId && inviteForm.role === 'tenant') {
            setLoadingUnits(true);
            listUnits(inviteForm.propertyId)
                .then(data => setUnits(data.units || []))
                .catch(err => setFormError("Could not load units for the selected property."))
                .finally(() => setLoadingUnits(false));
        } else {
            setUnits([]);
        }
    }, [inviteForm.propertyId, inviteForm.role]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setInviteForm(prev => ({ ...prev, [name]: value }));
        // Reset unitId if property changes
        if(name === 'propertyId') {
            setInviteForm(prev => ({...prev, unitId: ''}));
        }
    };
    
    const handleSendInvite = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!inviteForm.email || !inviteForm.role || !inviteForm.propertyId) {
            setFormError("Email, Role, and Property are required.");
            return;
        }
        if (inviteForm.role === 'tenant' && !inviteForm.unitId) {
            setFormError("A unit must be selected for a tenant invite.");
            return;
        }

        try {
            await sendInvite({
                email: inviteForm.email,
                role: inviteForm.role,
                property: inviteForm.propertyId,
                unit: inviteForm.role === 'tenant' ? inviteForm.unitId : undefined
            });
            setShowInviteModal(false);
            setInviteForm({ email: "", role: "tenant", propertyId: "", unitId: "" });
            fetchInvites(); // Refresh the list
            alert('Invite sent successfully!');
        } catch (err) {
            setFormError('Failed to send invite: ' + (err.response?.data?.message || err.message));
        }
    };
    
    const handleRevoke = async (inviteId) => {
        if (!window.confirm("Are you sure you want to revoke this invite?")) return;
        try {
            await revokeInvite(inviteId);
            fetchInvites();
            alert('Invite revoked.');
        } catch(err) {
            alert('Failed to revoke invite: ' + (err.response?.data?.message || err.message));
        }
    };
    
    const handleResend = async (inviteId) => {
        if (!window.confirm("Are you sure you want to resend this invite?")) return;
        try {
            await resendInvite(inviteId);
            alert('Invite resent.');
        } catch(err) {
             alert('Failed to resend invite: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'expired':
            case 'revoked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div>Loading invites...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Invite Management</h1>
                <Button onClick={() => setShowInviteModal(true)} icon={<UserPlus className="mr-2" />}>
                    Send New Invite
                </Button>
            </div>
            
             <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Email</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Role</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Property</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Expires</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invites.map((invite) => (
                                <tr key={invite._id}>
                                    <td className="p-4 whitespace-nowrap">{invite.email}</td>
                                    <td className="p-4 whitespace-nowrap capitalize">{invite.roleToInvite}</td>
                                    <td className="p-4 whitespace-nowrap">{invite.property?.name || 'N/A'}</td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(invite.status)}`}>
                                            {invite.status}
                                        </span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-gray-500 text-xs">{new Date(invite.expiresAt).toLocaleString()}</td>
                                    <td className="p-4 whitespace-nowrap space-x-2">
                                        {invite.status.toLowerCase() === 'pending' && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => handleResend(invite._id)} icon={<RefreshCw className="w-3.5 h-3.5"/>} />
                                                <Button size="sm" variant="danger" onClick={() => handleRevoke(invite._id)} icon={<XCircle className="w-3.5 h-3.5"/>} />
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <Pagination currentPage={filters.page} totalPages={totalPages} onPageChange={(page) => setFilters(p => ({...p, page}))} />
            </div>

            {showInviteModal && (
                <Modal title="Send New Invite" onClose={() => setShowInviteModal(false)}>
                    <form onSubmit={handleSendInvite} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                            <input type="email" name="email" value={inviteForm.email} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select name="role" value={inviteForm.role} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md">
                                <option value="tenant">Tenant</option>
                                <option value="propertymanager">Property Manager</option>
                                <option value="landlord">Landlord</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Property</label>
                            <select name="propertyId" value={inviteForm.propertyId} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md">
                                <option value="">-- Select a property --</option>
                                {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        {inviteForm.role === 'tenant' && (
                           <div>
                                <label className="block text-sm font-medium text-gray-700">Unit</label>
                                <select name="unitId" value={inviteForm.unitId} onChange={handleFormChange} required={inviteForm.role === 'tenant'} disabled={loadingUnits} className="mt-1 w-full p-2 border rounded-md">
                                    <option value="">{loadingUnits ? 'Loading units...' : '-- Select a unit --'}</option>
                                    {units.map(u => <option key={u._id} value={u._id}>{u.unitIdentifier}</option>)}
                                </select>
                            </div>
                        )}
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                        <div className="flex justify-end pt-4">
                            <Button type="submit" icon={<Send className="mr-2" />}>Send Invite</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default PMInviteManagementPage;