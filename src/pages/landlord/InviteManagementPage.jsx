import React, { useState, useEffect, useCallback } from 'react';
import { XCircle, RefreshCw, Send, UserPlus } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';

import { sendInvite, getAllInvites, revokeInvite, resendInvite } from '../../services/inviteService';
import { getAllProperties } from '../../services/propertyService';
import { listUnits } from '../../services/unitService';

// Branding colors
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const InviteManagementPage = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [filters, setFilters] = useState({ page: 1, limit: 10 });
    const [totalPages, setTotalPages] = useState(1);

    // Modal & form state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'tenant', propertyId: '', unitId: '' });
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [formError, setFormError] = useState('');
    const [sending, setSending] = useState(false);

    // Fetch invites (paginated)
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

    // Fetch properties every time modal opens (handles new/changed properties)
    useEffect(() => {
        if (showInviteModal) {
            getAllProperties()
                .then(data => {
                    let props = [];
                    if (Array.isArray(data)) props = data;
                    else if (Array.isArray(data?.properties)) props = data.properties;
                    else if (Array.isArray(data?.data)) props = data.data;
                    setProperties(props);
                })
                .catch(err => setFormError("Could not load properties."));
        }
    }, [showInviteModal]);

    // Fetch units when property changes (if role is tenant)
    useEffect(() => {
        if (inviteForm.propertyId && inviteForm.role === 'tenant') {
            setLoadingUnits(true);
            listUnits(inviteForm.propertyId)
                .then(data => {
                    let unitsArr = [];
                    if (Array.isArray(data)) unitsArr = data;
                    else if (Array.isArray(data?.units)) unitsArr = data.units;
                    else if (Array.isArray(data?.data)) unitsArr = data.data;
                    setUnits(unitsArr);
                })
                .catch(err => setFormError("Could not load units for the selected property."))
                .finally(() => setLoadingUnits(false));
        } else {
            setUnits([]);
        }
    }, [inviteForm.propertyId, inviteForm.role]);

    // Handle form field changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setInviteForm(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'propertyId' ? { unitId: '' } : {}) // clear unit if property changes
        }));
    };

    // Handle sending invite
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
        setSending(true);
        try {
            await sendInvite({
                email: inviteForm.email,
                role: inviteForm.role,
                property: inviteForm.propertyId,
                unit: inviteForm.role === 'tenant' ? inviteForm.unitId : undefined
            });
            setShowInviteModal(false);
            setInviteForm({ email: '', role: 'tenant', propertyId: '', unitId: '' });
            setFormError('');
            fetchInvites();
            alert('Invite sent successfully!');
        } catch (err) {
            setFormError('Failed to send invite: ' + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    };

    // Handle revoke
    const handleRevoke = async (inviteId) => {
        if (!window.confirm("Are you sure you want to revoke this invite?")) return;
        try {
            await revokeInvite(inviteId);
            fetchInvites();
            alert('Invite revoked.');
        } catch (err) {
            alert('Failed to revoke invite: ' + (err.response?.data?.message || err.message));
        }
    };

    // Handle resend
    const handleResend = async (inviteId) => {
        if (!window.confirm("Are you sure you want to resend this invite?")) return;
        try {
            await resendInvite(inviteId);
            alert('Invite resent.');
        } catch (err) {
            alert('Failed to resend invite: ' + (err.response?.data?.message || err.message));
        }
    };

    // Status badge
    const getStatusBadge = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'pending': return { bg: "#fef3c7", color: "#a16207" };
            case 'accepted': return { bg: "#d1fae5", color: PRIMARY_COLOR };
            case 'expired':
            case 'revoked': return { bg: "#fee2e2", color: "#b91c1c" };
            default: return { bg: "#f3f4f6", color: "#334155" };
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <span className="text-lg font-semibold" style={{ color: PRIMARY_COLOR }}>Loading invites...</span>
        </div>
    );
    if (error) return <div className="text-red-700 bg-red-100 border border-red-300 rounded-lg p-5 text-center font-medium">{error}</div>;

    return (
        <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY_COLOR }}>
                    Invite Management
                </h1>
                <Button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center px-5 py-2 rounded-lg shadow-md"
                    style={{
                        backgroundColor: SECONDARY_COLOR,
                        color: "#222",
                        fontWeight: 600
                    }}
                >
                    <UserPlus className="mr-2" />
                    Send New Invite
                </Button>
            </div>

            <div className="bg-white shadow-lg rounded-xl border" style={{ borderColor: PRIMARY_COLOR + "14" }}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y" style={{ borderColor: PRIMARY_COLOR + "10" }}>
                        <thead style={{ background: "#f6fcfa" }}>
                            <tr>
                                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Email</th>
                                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Role</th>
                                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Property</th>
                                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Status</th>
                                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Expires</th>
                                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invites.map((invite) => {
                                const badge = getStatusBadge(invite.status);
                                return (
                                    <tr key={invite._id} className="hover:bg-[#f0fdfa] transition">
                                        <td className="p-4 whitespace-nowrap font-medium" style={{ color: PRIMARY_COLOR }}>{invite.email}</td>
                                        <td className="p-4 whitespace-nowrap capitalize">{invite.roleToInvite || invite.role}</td>
                                        <td className="p-4 whitespace-nowrap">{invite.property?.name || 'N/A'}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full" style={{ background: badge.bg, color: badge.color }}>
                                                {invite.status}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-xs" style={{ color: "#64748b" }}>
                                            {invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : ''}
                                        </td>
                                        <td className="p-4 whitespace-nowrap flex flex-col sm:flex-row gap-2">
                                            {invite.status && invite.status.toLowerCase() === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        style={{
                                                            borderColor: PRIMARY_COLOR,
                                                            color: PRIMARY_COLOR,
                                                            background: "#f0fdfa",
                                                            fontWeight: 500,
                                                            padding: "0.4rem 1rem",
                                                            minWidth: 105
                                                        }}
                                                        title="Resend Invite"
                                                        onClick={() => handleResend(invite._id)}
                                                        className="flex items-center gap-1 justify-center"
                                                    >
                                                        <RefreshCw className="w-4 h-4 mr-1" />
                                                        <span>Resend</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="danger"
                                                        style={{
                                                            borderColor: "#e64848",
                                                            color: "#e64848",
                                                            background: "#fde2e5",
                                                            fontWeight: 500,
                                                            padding: "0.4rem 1rem",
                                                            minWidth: 105
                                                        }}
                                                        title="Revoke Invite"
                                                        onClick={() => handleRevoke(invite._id)}
                                                        className="flex items-center gap-1 justify-center"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        <span>Revoke</span>
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                    onPageChange={page => setFilters(f => ({ ...f, page }))}
                />
            </div>

            <Modal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Send New Invite</span>}
            >
                <form onSubmit={handleSendInvite} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Recipient Email</label>
                        <input
                            type="email"
                            name="email"
                            value={inviteForm.email}
                            onChange={handleFormChange}
                            required
                            className="mt-1 w-full p-2 border rounded-md"
                            style={{ borderColor: PRIMARY_COLOR }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Role</label>
                        <select
                            name="role"
                            value={inviteForm.role}
                            onChange={handleFormChange}
                            required
                            className="mt-1 w-full p-2 border rounded-md"
                            style={{ borderColor: PRIMARY_COLOR }}
                        >
                            <option value="tenant">Tenant</option>
                            <option value="propertymanager">Property Manager</option>
                            <option value="landlord">Landlord</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Property</label>
                        <select
                            name="propertyId"
                            value={inviteForm.propertyId}
                            onChange={handleFormChange}
                            required
                            className="mt-1 w-full p-2 border rounded-md"
                            style={{ borderColor: PRIMARY_COLOR }}
                        >
                            <option value="">-- Select a property --</option>
                            {properties.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    {inviteForm.role === 'tenant' && (
                        <div>
                            <label className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Unit</label>
                            <select
                                name="unitId"
                                value={inviteForm.unitId}
                                onChange={handleFormChange}
                                required
                                disabled={loadingUnits}
                                className="mt-1 w-full p-2 border rounded-md"
                                style={{ borderColor: PRIMARY_COLOR }}
                            >
                                <option value="">{loadingUnits ? 'Loading units...' : '-- Select a unit --'}</option>
                                {units.map(u =>
                                    <option key={u._id} value={u._id}>{u.unitIdentifier || u.unitName}</option>
                                )}
                            </select>
                        </div>
                    )}
                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                    <div className="flex justify-end pt-4 space-x-3">
                        <Button
                            type="button"
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
                            type="submit"
                            icon={<Send className="mr-2" />}
                            disabled={sending}
                            className="py-2 px-4 rounded-lg"
                            style={{
                                backgroundColor: SECONDARY_COLOR,
                                color: "#1a3b34",
                                fontWeight: 600
                            }}
                        >
                            {sending ? 'Sending...' : 'Send Invite'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default InviteManagementPage;