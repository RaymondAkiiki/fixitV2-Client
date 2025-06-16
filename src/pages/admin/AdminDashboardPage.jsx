import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { getAllUsers, approveUser } from '../../services/userService';
import { Link } from "react-router-dom";
import StatCard from '../../components/admin/StatCard';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [approveError, setApproveError] = useState('');
  const [approveSuccess, setApproveSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await adminService.getDashboardStatistics();
        setStats(response.data);
        setError('');
        // Fetch users for approvals/all user table
        const usersRes = await getAllUsers();
        setUsers(usersRes);
      } catch (err) {
        setError('Failed to load dashboard data. ' + (err.response?.data?.message || err.message));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Approve user handler
  const handleApprove = async (userId) => {
    setApproveError('');
    setApproveSuccess('');
    setApprovingId(userId);
    try {
      await approveUser(userId);
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, approved: true } : user
        )
      );
      setApproveSuccess('User approved successfully.');
    } catch (err) {
      setApproveError('Failed to approve user.');
    }
    setApprovingId(null);
  };

  if (loading) return <div className="p-4">Loading admin dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!stats) return null;

  // Chart data & options
  const requestStatusData = {
    labels: stats.requestsByStatus ? Object.keys(stats.requestsByStatus) : [],
    datasets: [
      {
        label: 'Requests by Status',
        data: stats.requestsByStatus ? Object.values(stats.requestsByStatus) : [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Requests by Status' },
    },
  };

  // Stat labels for summary (combine from new + old dashboard)
  const statSummary = [
    { label: "Total Users", value: stats.totalUsers ?? 0 },
    { label: "Property Managers", value: stats.totalPMs ?? 0 },
    { label: "Landlords", value: stats.totalLandlords ?? 0 },
    { label: "Tenants", value: stats.totalTenants ?? 0 },
    { label: "Properties", value: stats.totalProperties ?? 0 },
    { label: "Units", value: stats.totalUnits ?? 0 },
    { label: "Maintenance Requests", value: stats.totalRequests ?? 0 },
    { label: "Total Vendors", value: stats.totalVendors ?? 0 },
    { label: "Active Invites", value: stats.activeInvites ?? 0 }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Control Panel</h1>
      <p className="mb-6 text-gray-600">
        Master overview of platform activity, users, and systems.
      </p>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statSummary.map(s => (
          <StatCard key={s.label} title={s.label} value={s.value} colorClass={s.colorClass} />
        ))}
      </div>

      {/* Users by Role & Requests by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 shadow rounded">
          <h3 className="text-lg font-semibold mb-3">Users by Role</h3>
          {stats.usersByRole && Object.keys(stats.usersByRole).length > 0 ? (
            <ul>
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <li key={role} className="flex justify-between py-1 border-b">
                  <span>{role}:</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          ) : <p>No user role data.</p>}
        </div>
        <div className="bg-white p-4 shadow rounded">
          <h3 className="text-lg font-semibold mb-3">Requests by Status</h3>
          {stats.requestsByStatus && <Bar data={requestStatusData} options={barOptions} />}
          {stats.requestsByStatus && Object.keys(stats.requestsByStatus).length > 0 ? (
            <ul>
              {Object.entries(stats.requestsByStatus).map(([status, count]) => (
                <li key={status} className="flex justify-between py-1 border-b">
                  <span>{status}:</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          ) : <p>No request status data.</p>}
        </div>
      </div>

      {/* Recently Registered Users */}
      <div className="bg-white p-4 shadow rounded mb-8">
        <h2 className="text-lg font-semibold mb-4">Recently Registered Users</h2>
        {(!stats.recentUsers || stats.recentUsers.length === 0) ? (
          <p className="text-gray-500">No recent users.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Approval Table */}
      <div className="bg-white p-4 shadow rounded mb-8">
        <h2 className="text-lg font-semibold mb-4">User Approvals</h2>
        {approveError && <div className="mb-2 text-red-600">{approveError}</div>}
        {approveSuccess && <div className="mb-2 text-green-600">{approveSuccess}</div>}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-50">
                <td className="py-2">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.approved ? (
                    <span className="text-green-600 font-medium">Approved</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Pending</span>
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  {!user.approved && (
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                      disabled={approvingId === user._id}
                      onClick={() => handleApprove(user._id)}
                    >
                      {approvingId === user._id ? "Approving..." : "Approve"}
                    </button>
                  )}
                  {user.approved && (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All Users Table and Links */}
      <div className="bg-white p-4 shadow rounded mb-8">
        <h2 className="text-lg font-semibold mb-4">All Users</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b hover:bg-gray-50">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  {u.approved ? (
                    <span className="text-green-600 font-medium">Approved</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-x-4">
         
          <Link to="/demo" className="text-blue-600 hover:underline">
            View Demo Pages
          </Link>
          <Link to="/test" className="text-blue-600 hover:underline">
            Test Page
          </Link>
           <Link to="/test2" className="text-blue-600 hover:underline">
            Test Page 2
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;