// frontend/src/pages/admin/AdminDashboardPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from "react-router-dom";
import StatCard from '../../components/admin/StatCard.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmationModal from '../../components/common/modals/ConfirmationModal.jsx';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import { ROUTES, USER_ROLES } from '../../utils/constants.js';
import { formatDate } from '../../utils/helpers.js';

// Services
import * as DashboardService from '../../services/dashboardService.js';
import * as adminService from '../../services/adminService.js';
import { approveUser } from '../../services/userService.js';

// Icons
import {
  Users, Building2, FileText, Wrench, Truck, Home, CheckCircle2, KeyRound, DollarSign,
  ShieldCheck, UserPlus, FileUp, Settings, BarChart3, LogOut, TestTube2, MailCheck, Clock, UserCheck
} from 'lucide-react';

// Chart.js imports
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Reusable UI Components
const QuickLinkCard = ({ to, icon: Icon, title, description }) => (
  <Link to={to} className="group flex items-start gap-4 rounded-xl bg-gray-50 p-4 transition-all duration-300 hover:bg-white hover:shadow-lg border border-gray-200/80">
    <div className="flex-shrink-0 rounded-lg bg-[#e6f7f2] p-3">
      <Icon className="h-6 w-6 text-[#219377]" />
    </div>
    <div>
      <h3 className="font-bold text-gray-800 group-hover:text-[#219377]">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </Link>
);

const ActivityItem = ({ icon: Icon, color, message, timestamp }) => (
  <div className="flex items-start gap-4">
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-800 font-medium">{message}</p>
      <p className="text-xs text-gray-400">{formatDate(timestamp)}</p>
    </div>
  </div>
);

const AdminDashboardPage = ({ currentUser }) => {
  const { showSuccess, showError } = useGlobalAlert();
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    stats: { 
      totalUsers: 0, 
      totalProperties: 0, 
      totalLeases: 0, 
      pendingRequests: 0, 
      totalVendors: 0, 
      totalUnits: 0, 
      occupiedUnits: 0, 
      vacantUnits: 0 
    },
    userRoleDistribution: [],
    pendingApprovals: [],
    recentActivity: []
  });
  
  // System stats state (from admin service)
  const [systemStats, setSystemStats] = useState({
    activeUsers: 0,
    storage: { total: 0, used: 0 },
    pendingInvites: 0,
    systemHealth: null
  });
  
  // Loading and UI states
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [systemStatsLoading, setSystemStatsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);
  
  // Abort controllers
  const dashboardAbortController = useRef(null);
  const systemStatsAbortController = useRef(null);

  // Main dashboard data fetch
  const fetchDashboardData = useCallback(async () => {
    // Cancel previous request if exists
    if (dashboardAbortController.current) {
      dashboardAbortController.current.abort();
    }
    
    // Create new abort controller
    dashboardAbortController.current = new AbortController();
    const signal = dashboardAbortController.current.signal;
    
    setDashboardLoading(true);
    try {
      // Use DashboardService for the optimized dashboard data
      const data = await DashboardService.fetchAdminDashboardData(signal);
      setDashboardData(data);
    } catch (err) {
      if (err.message !== "Request canceled") {
        showError(err.response?.data?.message || 'Failed to load dashboard data.');
        console.error("Dashboard data fetch error:", err);
      }
    } finally {
      setDashboardLoading(false);
    }
  }, [showError]);

  // Fetch additional system stats using adminService
  const fetchSystemStats = useCallback(async () => {
    // Cancel previous request if exists
    if (systemStatsAbortController.current) {
      systemStatsAbortController.current.abort();
    }
    
    // Create new abort controller
    systemStatsAbortController.current = new AbortController();
    const signal = systemStatsAbortController.current.signal;
    
    setSystemStatsLoading(true);
    try {
      // Fetch data in parallel for efficiency
      const [
        activeUsersResponse,
        storageResponse,
        invitesResponse,
        healthResponse
      ] = await Promise.allSettled([
        adminService.getCurrentlyActiveUsers({ minutes: 15 }, signal),
        adminService.getMediaStorageStats(signal),
        adminService.getAllInvites({ status: 'pending', limit: 1 }, signal),
        adminService.getSystemHealthSummary(signal)
      ]);
      
      // Extract data safely (even if some requests fail)
      const activeUsers = activeUsersResponse.status === 'fulfilled' ? 
        activeUsersResponse.value.data?.length || 0 : 0;
      
      const storage = storageResponse.status === 'fulfilled' ? 
        storageResponse.value.data || { total: 0, used: 0 } : { total: 0, used: 0 };
      
      const pendingInvites = invitesResponse.status === 'fulfilled' ? 
        invitesResponse.value.pagination?.total || 0 : 0;
      
      const systemHealth = healthResponse.status === 'fulfilled' ? 
        healthResponse.value.data : null;
      
      setSystemStats({
        activeUsers,
        storage,
        pendingInvites,
        systemHealth
      });
    } catch (err) {
      if (err.message !== "Request canceled") {
        console.error("System stats fetch error:", err);
        // We don't show this error to the user since it's supplementary data
      }
    } finally {
      setSystemStatsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
    fetchSystemStats();
    
    // Cleanup function
    return () => {
      if (dashboardAbortController.current) {
        dashboardAbortController.current.abort();
      }
      if (systemStatsAbortController.current) {
        systemStatsAbortController.current.abort();
      }
    };
  }, [fetchDashboardData, fetchSystemStats]);

  // User approval handler
  const handleApproveUser = (user) => {
    setUserToApprove(user);
    setShowConfirmModal(true);
  };

  // User approval confirmation
  const confirmApprove = useCallback(async () => {
    if (!userToApprove) return;
    
    setIsApproving(true);
    try {
      await approveUser(userToApprove._id);
      showSuccess(`User ${userToApprove.email} approved successfully!`);
      setShowConfirmModal(false);
      setUserToApprove(null);
      
      // Invalidate cache and refresh data
      DashboardService.clearCache('admin-dashboard');
      fetchDashboardData();
    } catch (err) {
      showError(err.response?.data?.message || `Failed to approve user.`);
    } finally {
      setIsApproving(false);
    }
  }, [userToApprove, fetchDashboardData, showSuccess, showError]);

  // Chart data preparation
  const roleDistributionData = {
    labels: dashboardData.userRoleDistribution.map(item => item.role),
    datasets: [{
      label: 'Users',
      data: dashboardData.userRoleDistribution.map(item => item.count || 0),
      backgroundColor: 'rgba(33, 147, 119, 0.6)',
      borderColor: 'rgba(33, 147, 119, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0, color: '#6b7280' }, grid: { color: '#e5e7eb' } },
      x: { ticks: { color: '#6b7280' }, grid: { display: false } }
    }
  };

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-xl text-gray-700">Loading dashboard...</span>
      </div>
    );
  }

  const { stats, pendingApprovals, recentActivity } = dashboardData;
  
  // Data mapping for UI
  const activityMap = {
    'USER_CREATED': { icon: UserPlus, color: 'bg-blue-500' },
    'REQUEST_CREATED': { icon: Wrench, color: 'bg-orange-500' },
    'LEASE_UPLOADED': { icon: FileUp, color: 'bg-green-500' },
    'DEFAULT': { icon: FileText, color: 'bg-gray-500' }
  };

  // Essential quick links
  const quickLinks = [
    { to: ROUTES.ADMIN_USERS, icon: Users, title: "Manage Users", description: "View, edit, and approve users." },
    { to: ROUTES.ADMIN_PROPERTIES, icon: Building2, title: "Manage Properties", description: "Add or update property details." },
    { to: ROUTES.ADMIN_LEASES, icon: FileText, title: "Manage Leases", description: "Oversee all lease agreements." },
    { to: ROUTES.ADMIN_REQUESTS, icon: Wrench, title: "Manage Maintenance", description: "Track all maintenance tickets." },
    { to: ROUTES.ADMIN_VENDORS, icon: Truck, title: "Manage Vendors", description: "Maintain your list of vendors." },
    { to: ROUTES.ADMIN_RENT_PAYMENTS, icon: DollarSign, title: "View Rent Payments", description: "Monitor tenant rent payments." },
    { to: ROUTES.ADMIN_SCHEDULED_MAINTENANCE, icon: Clock, title: "Scheduled Maintenance", description: "Set up recurring tasks." },
    { to: ROUTES.ADMIN_INVITES, icon: MailCheck, title: "Manage Invites", description: "Track sent user invitations." },
    { to: ROUTES.ADMIN_BASE + ROUTES.ADMIN_AUDIT_LOGS, icon: ShieldCheck, title: "View Audit Logs", description: "Review system and user actions." },
    { to: ROUTES.ADMIN_BASE + ROUTES.ADMIN_SYSTEM, icon: Settings, title: "System Settings", description: "Configure application settings." },
  ];

  // Calculate system health status
  const systemStatus = systemStats.systemHealth?.status || "unknown";
  const systemStatusColor = systemStatus === "healthy" ? "bg-green-100 text-green-800" : 
                            systemStatus === "degraded" ? "bg-yellow-100 text-yellow-800" : 
                            "bg-red-100 text-red-800";

  // Calculate storage usage percentage
  const storagePercentage = systemStats.storage.total > 0 ? 
    Math.round((systemStats.storage.used / systemStats.storage.total) * 100) : 0;

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-[#219377]">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, <span className="font-bold text-gray-700">{currentUser?.firstName || 'Admin'}</span>. Here's an overview of your platform.
            </p>
          </div>
          
          {/* System Health Indicator */}
          {!systemStatsLoading && systemStats.systemHealth && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">System Status</div>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${systemStatusColor}`}>
                  {systemStatus}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Active Users</div>
                <div className="text-lg font-semibold text-blue-600">{systemStats.activeUsers}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers || 0} icon={Users} color="#3b82f6" />
        <StatCard title="Total Properties" value={stats.totalProperties || 0} icon={Building2} color="#14b8a6" />
        <StatCard title="Total Leases" value={stats.totalLeases || 0} icon={FileText} color="#8b5cf6" />
        <StatCard title="Pending Requests" value={stats.pendingRequests || 0} icon={Wrench} color="#ffbd59" />
        <StatCard title="Total Vendors" value={stats.totalVendors || 0} icon={Truck} color="#64748b" />
        <StatCard title="Total Units" value={stats.totalUnits || 0} icon={Home} color="#a855f7" />
        <StatCard title="Occupied Units" value={stats.occupiedUnits || 0} icon={CheckCircle2} color="#22c55e" />
        <StatCard title="Vacant Units" value={stats.vacantUnits || 0} icon={KeyRound} color="#ef4444" />
      </div>

      {/* Main Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-[#e6f7f2]">
          <h2 className="text-2xl font-semibold mb-5 text-[#219377] flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" /> User Role Distribution
          </h2>
          <div className="h-80 relative">
            <Bar data={roleDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
          {/* System Info */}
          {!systemStatsLoading && (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-[#e6f7f2]">
              <h3 className="text-xl font-semibold mb-5 text-[#219377] flex items-center">
                <Settings className="w-5 h-5 mr-2" /> System Overview
              </h3>
              
              <div className="space-y-4">
                {/* Storage Usage */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Storage Usage</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(systemStats.storage.used / (1024 * 1024))}MB / {Math.round(systemStats.storage.total / (1024 * 1024))}MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${storagePercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Pending Invites */}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Pending Invites</span>
                  <span className="text-sm font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                    {systemStats.pendingInvites}
                  </span>
                </div>
                
                {/* Database Status */}
                {systemStats.systemHealth?.database && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Database Status</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                      systemStats.systemHealth.database === 'connected' ? 
                        'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {systemStats.systemHealth.database}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Pending Approvals */}
          {pendingApprovals && pendingApprovals.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-[#e6f7f2]">
              <h3 className="text-xl font-semibold mb-5 text-[#219377] flex items-center">
                <UserCheck className="w-5 h-5 mr-2" /> Pending Approvals
              </h3>
              <ul className="space-y-3">
                {pendingApprovals.map(user => (
                  <li key={user._id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">{user.email}</p>
                      <p className="text-xs text-yellow-800 bg-yellow-200 inline-block px-2 py-0.5 rounded-full font-medium mt-1">{user.role}</p>
                    </div>
                    <button
                      onClick={() => handleApproveUser(user)}
                      disabled={isApproving}
                      className="px-3 py-1.5 bg-[#219377] text-white rounded-md hover:bg-[#1a7c67] disabled:opacity-50 text-sm font-semibold transition"
                    >
                      {isApproving && userToApprove?._id === user._id ? '...' : 'Approve'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recent Activity */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-[#e6f7f2]">
            <h2 className="text-xl font-semibold mb-5 text-[#219377] flex items-center">
              <Clock className="w-5 h-5 mr-2" /> Recent Activity
            </h2>
            <div className="space-y-5">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity, index) => {
                  const { icon, color } = activityMap[activity.type] || activityMap['DEFAULT'];
                  return <ActivityItem key={index} icon={icon} color={color} message={activity.message} timestamp={activity.timestamp} />;
                })
              ) : (
                <p className="text-gray-500 text-sm py-4 text-center">No recent activity to display.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-[#e6f7f2]">
        <h2 className="text-2xl font-semibold mb-6 text-[#219377]">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickLinks.map(link => (
            <QuickLinkCard key={link.to} {...link} />
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => { setShowConfirmModal(false); setUserToApprove(null); }}
        onConfirm={confirmApprove}
        title="Confirm User Approval"
        message={userToApprove ? `Are you sure you want to approve user "${userToApprove.firstName || ''} ${userToApprove.lastName || ''}" (${userToApprove.email})?` : "Are you sure?"}
        confirmText={isApproving ? "Approving..." : "Yes, Approve"}
        confirmButtonClass="bg-[#219377] hover:bg-[#1a7c67]"
        cancelButtonClass="bg-gray-300 hover:bg-gray-400 text-gray-800"
      />
    </div>
  );
};

export default AdminDashboardPage;