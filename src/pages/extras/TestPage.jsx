import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";
import { getAllUsers, approveUser } from "../../services/userService";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [approveError, setApproveError] = useState("");
  const [approveSuccess, setApproveSuccess] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const statsData = await adminService.getDashboardStatistics()();
        setStats(statsData);
        const usersRes = await getAllUsers();
        setUsers(usersRes);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Approve user handler
  const handleApprove = async (userId) => {
    setApproveError("");
    setApproveSuccess("");
    setApprovingId(userId);
    try {
      await approveUser(userId);
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, approved: true } : user
        )
      );
      setApproveSuccess("User approved successfully.");
    } catch (err) {
      setApproveError("Failed to approve user.");
    }
    setApprovingId(null);
  };

  if (loading) return <div className="p-4">Loading admin dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!stats) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Control Panel</h1>
      <p className="mb-6 text-gray-600">
        Master overview of platform activity, users, and systems.
      </p>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={stats.totalUsers ?? 0} />
        <StatCard label="Property Managers" value={stats.totalPMs ?? 0} />
        <StatCard label="Landlords" value={stats.totalLandlords ?? 0} />
        <StatCard label="Tenants" value={stats.totalTenants ?? 0} />
        <StatCard label="Properties" value={stats.totalProperties ?? 0} />
        <StatCard label="Maintenance Requests" value={stats.totalRequests ?? 0} />
      </div>

      {/* Recent Users */}
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
          <Link to="/admin/users" className="text-blue-600 hover:underline">
            Manage All Users
          </Link>
          <Link to="/admin/audit-log" className="text-blue-600 hover:underline">
            View Audit Log
          </Link>
          <Link to="/demo" className="text-blue-600 hover:underline">
            View Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <h3 className="text-gray-600 font-medium">{label}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}