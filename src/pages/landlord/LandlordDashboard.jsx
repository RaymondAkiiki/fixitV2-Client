import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Wrench, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { getAllProperties } from '../../services/propertyService';
import { getAllRequests } from '../../services/requestService';
import { getAllUsers } from '../../services/userService';
import { getCommonIssuesReport } from '../../services/reportService';
import StatCard from '../../components/admin/StatCard';

// Branding colors
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const LandlordDashboard = () => {
    const [stats, setStats] = useState({ properties: 0, units: 0, tenants: 0, openRequests: 0 });
    const [recentRequests, setRecentRequests] = useState([]);
    const [commonIssues, setCommonIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                setLoading(true);

                // Fetch all resources in parallel
                const [propertiesRes, requestsRes, commonIssuesRes, tenantsRes] = await Promise.all([
                    getAllProperties(),
                    getAllRequests({ limit: 5, sort: '-createdAt' }),
                    getCommonIssuesReport({ limit: 3 }),
                    getAllUsers({ role: 'tenant' })
                ]);

                // Defensive: Normalize all API responses
                const properties = Array.isArray(propertiesRes)
                    ? propertiesRes
                    : (propertiesRes?.properties || propertiesRes?.data || []);
                const totalUnits = properties.reduce((acc, prop) => acc + (prop.units?.length || 0), 0);

                const requestsArray = Array.isArray(requestsRes)
                    ? requestsRes
                    : (requestsRes?.requests || requestsRes?.data || []);
                const openRequests = requestsArray.filter(
                    r => !['completed', 'verified & closed', 'cancelled', 'canceled', 'archived'].includes((r.status || '').toLowerCase())
                ).length;

                const commonIssuesArray = Array.isArray(commonIssuesRes)
                    ? commonIssuesRes
                    : (commonIssuesRes?.issues || commonIssuesRes?.data || []);

                let tenantsCount = 0;
                if (typeof tenantsRes === 'object' && tenantsRes !== null) {
                    if (Array.isArray(tenantsRes)) {
                        tenantsCount = tenantsRes.length;
                    } else if (typeof tenantsRes.totalUsers === 'number') {
                        tenantsCount = tenantsRes.totalUsers;
                    } else if (Array.isArray(tenantsRes.users)) {
                        tenantsCount = tenantsRes.users.length;
                    }
                }

                setStats({
                    properties: properties.length,
                    units: totalUnits,
                    tenants: tenantsCount,
                    openRequests
                });

                setRecentRequests(requestsArray);
                setCommonIssues(commonIssuesArray);

            } catch (err) {
                setError('Failed to load dashboard data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <span className="text-lg font-semibold" style={{ color: PRIMARY_COLOR }}>Loading Landlord Dashboard...</span>
        </div>
    );
    if (error) return <div className="text-red-700 bg-red-100 border border-red-300 rounded-lg p-5 text-center font-medium">{error}</div>;

    const statusBadge = (status) => {
        const base = "px-2.5 py-0.5 rounded-full text-xs font-semibold";
        if (!status) return <span className={base}>Unknown</span>;
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'in progress':
            case 'in_progress':
            case 'assigned':
                return <span className={`${base}`} style={{ background: "#fef3c7", color: "#ca8a04" }}>{status.replace(/_/g, ' ')}</span>;
            case 'completed':
            case 'verified & closed':
            case 'verified':
                return <span className={`${base}`} style={{ background: "#d1fae5", color: PRIMARY_COLOR }}>{status.replace(/_/g, ' ')}</span>;
            case 'new':
                return <span className={`${base}`} style={{ background: "#e0f2fe", color: "#0284c7" }}>{status.replace(/_/g, ' ')}</span>;
            default:
                return <span className={`${base}`} style={{ background: "#f4f4f5", color: "#334155" }}>{status.replace(/_/g, ' ')}</span>;
        }
    };

    return (
        <div className="space-y-10 px-2 md:px-0 py-2">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY_COLOR }}>
                    Landlord Dashboard
                </h1>
                <p className="mt-1 text-[1.01rem]" style={{ color: "#64748b" }}>
                    Your property portfolio at a glance.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
                <StatCard
                    title="Total Properties"
                    value={stats.properties}
                    icon={<Home />}
                    colorClass=""
                    style={{ background: PRIMARY_COLOR, color: "#fff" }}
                />
                <StatCard
                    title="Total Units"
                    value={stats.units}
                    icon={<Building2 />}
                    colorClass=""
                    style={{ background: SECONDARY_COLOR, color: "#1a3b34" }}
                />
                <StatCard
                    title="Total Tenants"
                    value={stats.tenants}
                    icon={<Users />}
                    colorClass=""
                    style={{ background: "#a78bfa", color: "#fff" }}
                />
                <StatCard
                    title="Open Requests"
                    value={stats.openRequests}
                    icon={<Wrench />}
                    colorClass=""
                    style={{ background: "#fbbf24", color: "#1a3b34" }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Maintenance Requests */}
                <div
                    className="lg:col-span-2 p-6 rounded-xl shadow-lg border"
                    style={{ background: "#fff", borderColor: PRIMARY_COLOR + "22" }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>Recent Maintenance Requests</h2>
                        <Link to="/landlord/requests" className="text-sm font-semibold"
                            style={{
                                color: SECONDARY_COLOR,
                                borderBottom: `2px solid ${SECONDARY_COLOR}`,
                                paddingBottom: 2
                            }}>
                            View All
                        </Link>
                    </div>
                    {recentRequests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left" style={{ color: PRIMARY_COLOR }}>
                                        <th className="p-3 font-semibold">Request</th>
                                        <th className="p-3 font-semibold">Property</th>
                                        <th className="p-3 font-semibold">Status</th>
                                        <th className="p-3 font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRequests.map(req => (
                                        <tr key={req._id} className="border-t" style={{ borderColor: PRIMARY_COLOR + "15" }}>
                                            <td className="p-3 font-medium">
                                                <Link to={`/landlord/requests/${req._id}`}
                                                    className="transition hover:underline"
                                                    style={{ color: PRIMARY_COLOR }}>
                                                    {req.title}
                                                </Link>
                                            </td>
                                            <td className="p-3" style={{ color: "#475569" }}>{req.property?.name || 'N/A'}</td>
                                            <td className="p-3">{statusBadge(req.status)}</td>
                                            <td className="p-3 text-xs" style={{ color: "#64748b" }}>
                                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-10">No recent requests.</p>
                    )}
                </div>

                {/* Common Issues Report Snippet */}
                <div
                    className="p-6 rounded-xl shadow-lg border"
                    style={{ background: "#fff", borderColor: SECONDARY_COLOR + "14" }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>Common Issues</h2>
                        <Link to="/landlord/reports" className="text-sm font-semibold"
                            style={{
                                color: SECONDARY_COLOR,
                                borderBottom: `2px solid ${SECONDARY_COLOR}`,
                                paddingBottom: 2
                            }}>
                            Full Report
                        </Link>
                    </div>
                    {commonIssues.length > 0 ? (
                        <ul className="space-y-3">
                            {commonIssues.map((issue, idx) => (
                                <li
                                    key={issue._id || issue.id || issue.name || idx}
                                    className="flex justify-between items-center"
                                >
                                    <span className="capitalize font-medium" style={{ color: PRIMARY_COLOR }}>
                                        {issue._id || issue.id || issue.name}
                                    </span>
                                    <span className="font-bold bg-gray-100 px-3 py-1 rounded-lg text-sm" style={{ color: SECONDARY_COLOR }}>
                                        {issue.count}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-10">Not enough data for a report yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandlordDashboard;