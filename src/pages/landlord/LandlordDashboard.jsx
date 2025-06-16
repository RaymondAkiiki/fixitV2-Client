import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Wrench, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { getAllProperties } from '../../services/propertyService';
import { getAllRequests } from '../../services/requestService';
import { getAllUsers } from '../../services/userService';
import { getCommonIssuesReport } from '../../services/reportService';
import StatCard from '../../components/admin/StatCard';

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

    if (loading) return <div className="text-center p-10 font-medium">Loading Landlord Dashboard...</div>;
    if (error) return <div className="text-red-500 p-4 bg-red-100 rounded-lg">{error}</div>;

    const statusBadge = (status) => {
        const base = "px-2.5 py-0.5 rounded-full text-xs font-semibold";
        if (!status) return <span className={base}>Unknown</span>;
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'in progress':
            case 'in_progress':
            case 'assigned':
                return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status.replace(/_/g, ' ')}</span>;
            case 'completed':
            case 'verified & closed':
            case 'verified':
                return <span className={`${base} bg-green-100 text-green-800`}>{status.replace(/_/g, ' ')}</span>;
            case 'new':
                return <span className={`${base} bg-blue-100 text-blue-800`}>{status.replace(/_/g, ' ')}</span>;
            default:
                return <span className={`${base} bg-gray-100 text-gray-800`}>{status.replace(/_/g, ' ')}</span>;
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Landlord Dashboard</h1>
                <p className="text-gray-600 mt-1">Your property portfolio at a glance.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Properties" value={stats.properties} icon={<Home />} colorClass="bg-emerald-500" />
                <StatCard title="Total Units" value={stats.units} icon={<Building2 />} colorClass="bg-sky-500" />
                <StatCard title="Total Tenants" value={stats.tenants} icon={<Users />} colorClass="bg-violet-500" />
                <StatCard title="Open Requests" value={stats.openRequests} icon={<Wrench />} colorClass="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Maintenance Requests */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Recent Maintenance Requests</h2>
                        <Link to="/landlord/requests" className="text-sm font-medium text-emerald-600 hover:underline">View All</Link>
                    </div>
                    {recentRequests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="p-3 font-medium">Request</th>
                                        <th className="p-3 font-medium">Property</th>
                                        <th className="p-3 font-medium">Status</th>
                                        <th className="p-3 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRequests.map(req => (
                                        <tr key={req._id} className="border-t border-gray-200">
                                            <td className="p-3 text-gray-800 font-medium">
                                                <Link to={`/landlord/requests/${req._id}`} className="hover:text-emerald-600">{req.title}</Link>
                                            </td>
                                            <td className="p-3 text-gray-600">{req.property?.name || 'N/A'}</td>
                                            <td className="p-3">{statusBadge(req.status)}</td>
                                            <td className="p-3 text-gray-500">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ''}</td>
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
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Common Issues</h2>
                        <Link to="/landlord/reports" className="text-sm font-medium text-emerald-600 hover:underline">Full Report</Link>
                    </div>
                    {commonIssues.length > 0 ? (
                        <ul className="space-y-3">
                            {commonIssues.map((issue, idx) => (
                                <li
                                    key={issue._id || issue.id || issue.name || idx}
                                    className="flex justify-between items-center"
                                >
                                    <span className="capitalize text-gray-700">{issue._id || issue.id || issue.name}</span>
                                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md text-sm">{issue.count}</span>
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