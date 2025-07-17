// frontend/src/pages/admin/AdminDashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js";
import { getAllUsers, approveUser } from '../../services/userService.js';
import { Link } from "react-router-dom";
import StatCard from '../../components/admin/StatCard.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmationModal from '../../components/common/modals/ConfirmationModal.jsx';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import { ROUTES, USER_ROLES, REQUEST_STATUSES } from '../../utils/constants.js';
import { formatDate } from '../../utils/helpers.js';

import {
  Users, Building2, FileText, Wrench, Truck, Home, CheckCircle2, KeyRound
} from 'lucide-react';

// Chart.js imports and registration
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboardPage = () => {
  const { showSuccess, showError } = useGlobalAlert();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); // All users, including pending ones
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);

  // Chart data for user roles distribution
  const roleDistributionData = {
    labels: Object.values(USER_ROLES),
    datasets: [{
      label: 'Number of Users by Role',
      // Ensure 'users' is an array before calling filter.
      // The 'users' state should now correctly be an array due to fetchData fix.
      // Adding Array.isArray() check here as a defensive measure.
      data: Object.values(USER_ROLES).map(role => 
        Array.isArray(users) ? users.filter(user => user.role === role).length : 0
      ),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)', // Admin
        'rgba(54, 162, 235, 0.6)', // Tenant
        'rgba(255, 206, 86, 0.6)', // Landlord
        'rgba(75, 192, 192, 0.6)', // PropertyManager
        'rgba(153, 102, 255, 0.6)',// Vendor
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    }],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Role Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        precision: 0, // Ensure whole numbers for user count
      }
    }
  };

  // Fetch dashboard statistics and all users
  const fetchData = useCallback(async (signal) => {
    setLoading(true);
    try {
      // Fetch dashboard statistics
      const statsResponse = await adminService.getDashboardStatistics(signal);
      setStats(statsResponse);

      // Fetch all users
      const usersResponse = await getAllUsers({}, signal);
      
      // --- CRITICAL CHANGE CONFIRMED HERE ---
      // Access the 'users' array from the response object.
      // This assumes getAllUsers returns { success: true, users: [...] }
      const fetchedUsers = usersResponse?.users || []; 

      setUsers(fetchedUsers); // Set the array of users
      // Ensure fetchedUsers is an array before filtering for pending approvals
      setPendingApprovals(Array.isArray(fetchedUsers) ? fetchedUsers.filter(user => !user.approved) : []); 
    } catch (err) {
      if (err.message !== "Request Aborted") {
        const message = err.response?.data?.message || 'Failed to load dashboard data. Please try again.';
        showError(message);
        console.error("Admin dashboard fetch error:", err);
      } else {
        console.log("Admin dashboard data fetch aborted.");
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetchData(signal);

    return () => {
      controller.abort();
    };
  }, [fetchData]);

  const handleApproveUser = (user) => {
    setUserToApprove(user);
    setShowConfirmModal(true);
  };

  const confirmApprove = useCallback(async () => {
    if (!userToApprove) return;

    setIsApproving(true);
    try {
      await approveUser(userToApprove._id);
      showSuccess(`User ${userToApprove.email} approved successfully!`);
      setShowConfirmModal(false);
      setUserToApprove(null);
      fetchData(); // Re-fetch data to update lists and stats
    } catch (err) {
      const message = err.response?.data?.message || `Failed to approve user ${userToApprove.email}. Please try again.`;
      showError(message);
      console.error("User approval error:", err);
    } finally {
      setIsApproving(false);
    }
  }, [userToApprove, fetchData, showSuccess, showError]);


  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

       {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* ✅ FIX: Replace emoji strings with imported icon components */}
          <StatCard title="Total Users" value={stats.totalUsers || 0} icon={Users} />
          <StatCard title="Total Properties" value={stats.totalProperties || 0} icon={Building2} />
          <StatCard title="Total Leases" value={stats.totalLeases || 0} icon={FileText} />
          <StatCard title="Pending Requests" value={stats.pendingRequests || 0} icon={Wrench} color="#f97316" />
          <StatCard title="Total Vendors" value={stats.totalVendors || 0} icon={Truck} />
          <StatCard title="Total Units" value={stats.totalUnits || 0} icon={Home} />
          <StatCard title="Occupied Units" value={stats.occupiedUnits || 0} icon={CheckCircle2} />
          <StatCard title="Vacant Units" value={stats.vacantUnits || 0} icon={KeyRound} color="#22c55e" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Role Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">User Role Distribution</h2>
          <Bar data={roleDistributionData} options={chartOptions} />
        </div>

        {/* Recent Activity/Updates */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Activity & Quick Actions</h2>
          <div className="space-y-4">
            {stats && stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 text-gray-600">
                  <span className="text-lg">{activity.icon}</span>
                  <div>
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent activity to display.</p>
            )}

            {/* Quick Actions for Pending Approvals */}
            {pendingApprovals.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Pending User Approvals ({pendingApprovals.length})</h3>
                <ul className="space-y-2">
                  {pendingApprovals.map(user => (
                    <li key={user._id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-md">
                      <span className="font-medium text-gray-800">{user.email} ({user.role})</span>
                      <button
                        onClick={() => handleApproveUser(user)}
                        disabled={isApproving}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isApproving && userToApprove?._id === user._id ? 'Approving...' : 'Approve'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-4">
          <Link to={ROUTES.ADMIN_USERS} className="text-blue-600 hover:underline font-medium">
            Manage Users
          </Link>
          <Link to={ROUTES.ADMIN_PROPERTIES} className="text-blue-600 hover:underline font-medium">
            Manage Properties
          </Link>
          <Link to={ROUTES.ADMIN_LEASES} className="text-blue-600 hover:underline font-medium">
            Manage Leases
          </Link>
          <Link to={ROUTES.ADMIN_REQUESTS} className="text-blue-600 hover:underline font-medium">
            Manage Maintenance
          </Link>
          <Link to={ROUTES.ADMIN_VENDORS} className="text-blue-600 hover:underline font-medium">
            Manage Vendors
          </Link>
          <Link to={ROUTES.ADMIN_RENT_PAYMENTS} className="text-blue-600 hover:underline font-medium">
            View Rent Payments
          </Link>
          <Link to={ROUTES.ADMIN_SCHEDULED_MAINTENANCE} className="text-blue-600 hover:underline font-medium">
            Scheduled Maintenance
          </Link>
          <Link to={ROUTES.ADMIN_INVITES} className="text-blue-600 hover:underline font-medium">
            Manage Invites
          </Link>
          <Link to={ROUTES.TEST} className="text-blue-600 hover:underline font-medium">
            Test Page 1
          </Link>
          <Link to={ROUTES.TEST2} className="text-blue-600 hover:underline font-medium">
            Test Page 2
          </Link>
          {/* Add more relevant admin quick links here, e.g., to audit logs, system settings */}
          <Link to={ROUTES.ADMIN_BASE + ROUTES.ADMIN_AUDIT_LOGS} className="text-blue-600 hover:underline font-medium">
            View Audit Logs
          </Link>
          <Link to={ROUTES.ADMIN_BASE + ROUTES.ADMIN_SYSTEM} className="text-blue-600 hover:underline font-medium">
            System Settings
          </Link>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setUserToApprove(null); // Clear user on close
        }}
        onConfirm={confirmApprove}
        title="Confirm User Approval"
        message={userToApprove ? `Are you sure you want to approve user "${userToApprove.name}" (${userToApprove.email})?` : "Are you sure you want to approve this user?"}
        confirmText={isApproving ? "Approving..." : "Yes, Approve"}
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        cancelButtonClass="bg-gray-300 hover:bg-gray-400 text-gray-800"
      />
    </div>
  );
};

export default AdminDashboardPage;
