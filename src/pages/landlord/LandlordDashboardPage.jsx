// frontend/src/pages/landlord/LandlordDashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Wrench, Building2, FileText, DollarSign, CalendarDays } from 'lucide-react'; // Added icons
import { useAuth } from '../../contexts/AuthContext.jsx'; // Ensure .jsx extension
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx'; // Global Alert

// Service Imports
import { getAllProperties } from '../../services/propertyService.js';
import { getAllRequests } from '../../services/requestService.js';
import { getAllUsers } from '../../services/userService.js';
import { getCommonIssuesReport } from '../../services/reportService.js';
import { getLeases } from '../../services/leaseService.js'; // New: Lease Service
import { getRentEntries } from '../../services/rentService.js'; // New: Rent Service
import { getAllScheduledMaintenance } from '../../services/scheduledMaintenanceService.js'; // New: Scheduled Maintenance Service

// Component Imports
import StatCard from '../../components/admin/StatCard.jsx'; // Reusing StatCard
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'; // Standardized Spinner

// Constants & Helpers
import {
  REQUEST_STATUSES,
  LEASE_STATUS_ENUM,
  RENT_STATUS_ENUM, // Assuming this exists in constants.js
  SCHEDULED_MAINTENANCE_STATUS_ENUM,
  ROUTES
} from '../../utils/constants.js';
import { formatDate, formatDateTime } from '../../utils/helpers.js'; // Import helper functions

// Branding colors
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

// Re-usable status badge components (copied from PMDashboard for consistency)
const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (s) {
    case REQUEST_STATUSES.NEW:
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.ACTIVE: return `${base} bg-blue-100 text-blue-800`;
    case REQUEST_STATUSES.ASSIGNED: return `${base} bg-purple-100 text-purple-800`;
    case REQUEST_STATUSES.IN_PROGRESS:
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.IN_PROGRESS: return `${base} bg-yellow-100 text-yellow-800`;
    case REQUEST_STATUSES.COMPLETED:
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.COMPLETED: return `${base} bg-green-100 text-green-800`;
    case REQUEST_STATUSES.VERIFIED: return `${base} bg-teal-100 text-teal-800`;
    case REQUEST_STATUSES.REOPENED: return `${base} bg-orange-100 text-orange-800`;
    case REQUEST_STATUSES.ARCHIVED: return `${base} bg-gray-200 text-gray-800`;
    case REQUEST_STATUSES.CANCELED:
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.CANCELED: return `${base} bg-red-100 text-red-800`;
    default: return `${base} bg-gray-100 text-gray-700`;
  }
};

const LeaseStatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case LEASE_STATUS_ENUM.ACTIVE: return `${base} bg-green-100 text-green-800`;
    case LEASE_STATUS_ENUM.EXPIRED: return `${base} bg-red-100 text-red-800`;
    case LEASE_STATUS_ENUM.PENDING_RENEWAL: return `${base} bg-yellow-100 text-yellow-800`;
    case LEASE_STATUS_ENUM.TERMINATED: return `${base} bg-gray-100 text-gray-800`;
    case LEASE_STATUS_ENUM.DRAFT: return `${base} bg-blue-100 text-blue-800`;
    default: return `${base} bg-gray-100 text-gray-800`;
  }
};

const PaymentStatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case RENT_STATUS_ENUM.PAID: return `${base} bg-green-100 text-green-800`;
    case RENT_STATUS_ENUM.DUE: return `${base} bg-yellow-100 text-yellow-800`;
    case RENT_STATUS_ENUM.OVERDUE: return `${base} bg-red-100 text-red-800`;
    case RENT_STATUS_ENUM.PARTIALLY_PAID: return `${base} bg-orange-100 text-orange-800`;
    default: return `${base} bg-gray-100 text-gray-800`;
  }
};


const LandlordDashboardPage = () => {
  const [stats, setStats] = useState({
    properties: 0,
    units: 0,
    tenants: 0,
    openRequests: 0,
    activeLeases: 0, // New stat
    upcomingRentDue: 0, // New stat
    upcomingMaintenance: 0 // New stat
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [commonIssues, setCommonIssues] = useState([]);
  const [recentLeases, setRecentLeases] = useState([]); // New state
  const [recentRents, setRecentRents] = useState([]); // New state
  const [upcomingMaintenanceTasks, setUpcomingMaintenanceTasks] = useState([]); // New state

  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showError } = useGlobalAlert();

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [
        propertiesRes,
        requestsRes,
        commonIssuesRes,
        allUsersRes, // Fetch all users to filter tenants
        leasesRes, // Fetch leases
        rentsRes, // Fetch rents
        scheduledMaintenanceRes // Fetch scheduled maintenance
      ] = await Promise.all([
        getAllProperties(),
        getAllRequests({ limit: 5, sort: '-createdAt' }), // Fetch recent requests
        getCommonIssuesReport({ limit: 3 }),
        getAllUsers({ role: 'tenant' }), // Fetch all tenants
        getLeases(), // Fetch all leases
        getRentEntries(), // Fetch all rents
        getAllScheduledMaintenance(), // Fetch all scheduled maintenance
      ]);

      // Normalize API responses
      const properties = Array.isArray(propertiesRes) ? propertiesRes : (propertiesRes?.properties || propertiesRes?.data || []);
      const requestsArray = Array.isArray(requestsRes) ? requestsRes : (requestsRes?.requests || requestsRes?.data || []);
      const commonIssuesArray = Array.isArray(commonIssuesRes) ? commonIssuesRes : (commonIssuesRes?.issues || commonIssuesRes?.data || []);
      const allTenants = Array.isArray(allUsersRes) ? allUsersRes : (allUsersRes?.users || allUsersRes?.data || []);
      const leasesArray = Array.isArray(leasesRes) ? leasesRes : (leasesRes?.leases || leasesRes?.data || []);
      const rentsArray = Array.isArray(rentsRes) ? rentsRes : (rentsRes?.rents || rentsRes?.data || []);
      const scheduledMaintenanceArray = Array.isArray(scheduledMaintenanceRes) ? scheduledMaintenanceRes : (scheduledMaintenanceRes?.tasks || scheduledMaintenanceRes?.data || []);


      // Calculate total units from properties
      const totalUnits = properties.reduce((acc, prop) => acc + (prop.units?.length || 0), 0);

      // Filter requests that are considered "open"
      const openRequestsCount = requestsArray.filter(
        r => ![REQUEST_STATUSES.COMPLETED, REQUEST_STATUSES.VERIFIED, REQUEST_STATUSES.CANCELED, REQUEST_STATUSES.ARCHIVED].includes((r.status || '').toLowerCase())
      ).length;

      // Count tenants associated with the landlord's properties
      const landlordPropertyIds = new Set(properties.map(p => p._id));
      const associatedTenantsCount = allTenants.filter(tenant =>
        tenant.associations?.tenancies?.some(tenancy => landlordPropertyIds.has(tenancy.property?._id))
      ).length;

      // Calculate active leases
      const activeLeasesCount = leasesArray.filter(
        lease => lease.status === LEASE_STATUS_ENUM.ACTIVE
      ).length;

      // Calculate upcoming rent due (due or overdue)
      const upcomingRentDueCount = rentsArray.filter(
        rent => [RENT_STATUS_ENUM.DUE, RENT_STATUS_ENUM.OVERDUE].includes(rent.paymentStatus)
      ).length;

      // Filter upcoming scheduled maintenance tasks
      const upcomingMaintenance = scheduledMaintenanceArray
        .filter(task => new Date(task.scheduledDate) > new Date() && task.status !== SCHEDULED_MAINTENANCE_STATUS_ENUM.COMPLETED && task.status !== SCHEDULED_MAINTENANCE_STATUS_ENUM.CANCELED)
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));


      setStats({
        properties: properties.length,
        units: totalUnits,
        tenants: associatedTenantsCount,
        openRequests: openRequestsCount,
        activeLeases: activeLeasesCount,
        upcomingRentDue: upcomingRentDueCount,
        upcomingMaintenance: upcomingMaintenance.length
      });

      setRecentRequests(requestsArray);
      setCommonIssues(commonIssuesArray);
      setRecentLeases(leasesArray.slice(0, 5)); // Show top 5 recent leases
      setRecentRents(rentsArray.slice(0, 5)); // Show top 5 recent rents
      setUpcomingMaintenanceTasks(upcomingMaintenance.slice(0, 5)); // Show top 5 upcoming maintenance tasks

    } catch (err) {
      showError('Failed to load dashboard data. Please try again.');
      console.error("Landlord Dashboard Data Fetch Error:", err);
      // Clear all data on error
      setStats({ properties: 0, units: 0, tenants: 0, openRequests: 0, activeLeases: 0, upcomingRentDue: 0, upcomingMaintenance: 0 });
      setRecentRequests([]);
      setCommonIssues([]);
      setRecentLeases([]);
      setRecentRents([]);
      setUpcomingMaintenanceTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <LoadingSpinner size="lg" color={PRIMARY_COLOR} className="mr-4" />
      <p className="text-xl text-gray-700 font-semibold">Loading Landlord Dashboard...</p>
    </div>
  );

  return (
    <div className="bg-[#f8fafc] min-h-full p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Landlord Dashboard
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Your property portfolio at a glance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Properties"
          value={stats.properties}
          icon={Building2}
          color={PRIMARY_COLOR}
        />
        <StatCard
          title="Total Units"
          value={stats.units}
          icon={Home}
          color={SECONDARY_COLOR}
        />
        <StatCard
          title="Associated Tenants"
          value={stats.tenants}
          icon={Users}
          color="#a78bfa" // Purple
        />
        <StatCard
          title="Open Requests"
          value={stats.openRequests}
          icon={Wrench}
          color="#fbbf24" // Amber
        />
        <StatCard
          title="Active Leases"
          value={stats.activeLeases}
          icon={FileText}
          color="#6366f1" // Indigo
        />
        <StatCard
          title="Upcoming Rent Due"
          value={stats.upcomingRentDue}
          icon={DollarSign}
          color="#ef4444" // Red
        />
        <StatCard
          title="Upcoming Maintenance"
          value={stats.upcomingMaintenance}
          icon={CalendarDays}
          color="#10b981" // Emerald
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Maintenance Requests */}
        <div
          className="lg:col-span-2 p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Recent Maintenance Requests</h2>
            <Link to={ROUTES.REQUESTS} className="text-blue-600 hover:underline font-medium">
              View All &rarr;
            </Link>
          </div>
          {recentRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRequests.map(req => (
                    <tr key={req._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={ROUTES.REQUEST_DETAILS.replace(':requestId', req._id)} className="text-green-600 hover:underline">
                          {req.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.property?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {req.createdAt ? formatDate(req.createdAt) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 italic text-center py-8">No recent maintenance requests.</p>
          )}
        </div>

        {/* Common Issues Report Snippet */}
        <div
          className="p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Common Issues</h2>
            <Link to={ROUTES.LANDLORD_REPORTS} className="text-blue-600 hover:underline font-medium">
              Full Report &rarr;
            </Link>
          </div>
          {commonIssues.length > 0 ? (
            <ul className="space-y-3">
              {commonIssues.map((issue, idx) => (
                <li
                  key={issue._id || issue.id || issue.name || idx}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-md"
                >
                  <span className="capitalize font-medium text-gray-700">
                    {issue._id || issue.id || issue.name}
                  </span>
                  <span className="font-bold bg-gray-200 px-3 py-1 rounded-lg text-sm text-gray-800">
                    {issue.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 italic text-center py-8">Not enough data for a common issues report yet.</p>
          )}
        </div>
      </div>

      {/* Lease Agreements Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800 flex items-center">
            <FileText className="w-6 h-6 mr-2" /> Lease Agreements
          </h3>
          <Link
            to={ROUTES.LEASES}
            className="text-blue-600 hover:underline font-medium"
          >
            View All Leases &rarr;
          </Link>
        </div>
        {recentLeases.length === 0 ? (
          <p className="text-gray-600 italic">No lease agreements found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property / Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lease Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rent Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentLeases.map((lease) => (
                  <tr key={lease._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lease.property?.name || "N/A"} / {lease.unit?.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lease.tenant?.name || lease.tenant?.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <LeaseStatusBadge status={lease.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ${lease.rentAmount?.toFixed(2) || "0.00"} / {lease.rentFrequency || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={ROUTES.LEASE_DETAILS.replace(':leaseId', lease._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payments Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800 flex items-center">
            <DollarSign className="w-6 h-6 mr-2" /> Recent Rent Payments
          </h3>
          <Link
            to={ROUTES.PAYMENTS}
            className="text-blue-600 hover:underline font-medium"
          >
            View All Payments &rarr;
          </Link>
        </div>
        {recentRents.length === 0 ? (
          <p className="text-gray-600 italic">No recent payment records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property / Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRents.map((rent) => (
                  <tr key={rent._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rent.property?.name || "N/A"} / {rent.unit?.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {rent.tenant?.name || rent.tenant?.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ${rent.amountDue?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(rent.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      <PaymentStatusBadge status={rent.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {rent.paidAt ? formatDateTime(rent.paidAt) : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={ROUTES.PAYMENT_DETAILS.replace(':paymentId', rent._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Scheduled Maintenance Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800 flex items-center">
            <CalendarDays className="w-6 h-6 mr-2" /> Upcoming Scheduled Maintenance
          </h3>
          <Link
            to={ROUTES.SCHEDULED_MAINTENANCE}
            className="text-blue-600 hover:underline font-medium"
          >
            View All &rarr;
          </Link>
        </div>
        {upcomingMaintenanceTasks.length === 0 ? (
          <p className="text-gray-600 italic">
            No upcoming scheduled maintenance tasks for your properties.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingMaintenanceTasks.map((task) => (
                  <tr key={task._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {task.property?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {task.unit?.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(task.scheduledDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      <StatusBadge status={task.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default LandlordDashboardPage;
