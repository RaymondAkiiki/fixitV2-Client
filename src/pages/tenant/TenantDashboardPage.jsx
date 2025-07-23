// frontend/src/pages/tenant/TenantDashboardPage.jsx

import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, Wrench, Bell, FileText, DollarSign, PlusCircle, CalendarDays,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Import hooks and services
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx";
import { useRents } from "../../hooks/useRents.js";
import { useLeases } from "../../hooks/useLeases.js";
import { useProperties } from "../../hooks/useProperties.js";
import * as userService from "../../services/userService.js";
import * as requestService from "../../services/requestService.js";
import * as notificationService from "../../services/notificationService.js";
import * as scheduledMaintenanceService from "../../services/scheduledMaintenanceService.js";

import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/common/Button.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import {
  ROUTES,
  REQUEST_STATUSES,
  SCHEDULED_MAINTENANCE_STATUS_ENUM,
  LEASE_STATUS_ENUM,
} from "../../utils/constants.js";
import { formatDate, formatDateTime } from "../../utils/helpers.js";

// Re-using StatusBadge from PublicRequestViewPage for consistency
const StatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case REQUEST_STATUSES.NEW: return <span className={`${base} bg-blue-100 text-blue-800`}>{status.replace(/_/g, ' ')}</span>;
    case REQUEST_STATUSES.ASSIGNED: return <span className={`${base} bg-purple-100 text-purple-800`}>{status.replace(/_/g, ' ')}</span>;
    case REQUEST_STATUSES.IN_PROGRESS: return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status.replace(/_/g, ' ')}</span>;
    case REQUEST_STATUSES.COMPLETED: return <span className={`${base} bg-green-100 text-green-800`}>{status.replace(/_/g, ' ')}</span>;
    case REQUEST_STATUSES.VERIFIED: return <span className={`${base} bg-teal-100 text-teal-800`}>{status.replace(/_/g, ' ')}</span>;
    case REQUEST_STATUSES.REOPENED: return <span className={`${base} bg-orange-100 text-orange-800`}>{status.replace(/_/g, ' ')}</span>;
    case REQUEST_STATUSES.ARCHIVED: return <span className={`${base} bg-gray-200 text-gray-800`}>{status.replace(/_/g, ' ')}</span>;
    case REQUEST_STATUSES.CANCELED: return <span className={`${base} bg-red-100 text-red-800`}>{status.replace(/_/g, ' ')}</span>;
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.ACTIVE: return <span className={`${base} bg-blue-100 text-blue-800`}>{status.replace(/_/g, ' ')}</span>;
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.COMPLETED: return <span className={`${base} bg-green-100 text-green-800`}>{status.replace(/_/g, ' ')}</span>;
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.IN_PROGRESS: return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status.replace(/_/g, ' ')}</span>;
    case SCHEDULED_MAINTENANCE_STATUS_ENUM.CANCELED: return <span className={`${base} bg-red-100 text-red-800`}>{status.replace(/_/g, ' ')}</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-800`}>{status?.replace(/_/g, ' ') || 'N/A'}</span>;
  }
};

const LeaseStatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case LEASE_STATUS_ENUM.ACTIVE: return <span className={`${base} bg-green-100 text-green-800`}>{status}</span>;
    case LEASE_STATUS_ENUM.EXPIRED: return <span className={`${base} bg-red-100 text-red-800`}>{status}</span>;
    case LEASE_STATUS_ENUM.PENDING_RENEWAL: return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status.replace(/_/g, ' ')}</span>;
    case LEASE_STATUS_ENUM.TERMINATED: return <span className={`${base} bg-gray-100 text-gray-800`}>{status}</span>;
    case LEASE_STATUS_ENUM.DRAFT: return <span className={`${base} bg-blue-100 text-blue-800`}>{status}</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-800`}>{status || 'N/A'}</span>;
  }
};

export default function TenantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");

  // Fetch user profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['tenantProfile'],
    queryFn: () => userService.getMyProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent maintenance requests
  const { data: requestsData, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['tenantRequests'],
    queryFn: async () => {
      const response = await requestService.getAllRequests({ 
        limit: 5, 
        sort: 'createdAt', 
        order: 'desc' 
      });
      return response.requests || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['tenantNotifications'],
    queryFn: async () => {
      const response = await notificationService.getAllNotifications({ 
        limit: 5,
        sort: 'createdAt',
        order: 'desc'
      });
      return response.data || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch properties
  const { data: propertiesData, isLoading: isLoadingProperties } = useProperties();

  // Fetch upcoming maintenance
  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['upcomingMaintenance'],
    queryFn: async () => {
      const response = await scheduledMaintenanceService.getAllScheduledMaintenance({
        status: 'active,in_progress',
        sort: 'scheduledDate',
        order: 'asc',
        limit: 5
      });
      return response.tasks || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch leases
  const { data: leasesData, isLoading: isLoadingLeases } = useLeases();

  // Fetch rent records
  const { data: rentsData, isLoading: isLoadingRents } = useRents();

  // Feedback Modal Handlers
  const handleOpenFeedbackModal = (requestId) => {
    setSelectedRequestId(requestId);
    setShowFeedbackModal(true);
    setFeedbackRating(0);
    setFeedbackComment("");
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedRequestId(null);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedRequestId || feedbackRating === 0) {
      showError("Please provide a rating (1-5 stars) to submit feedback.");
      return;
    }
    try {
      await requestService.submitFeedback(selectedRequestId, {
        rating: feedbackRating,
        comment: feedbackComment,
      });
      showSuccess("Feedback submitted successfully!");
      handleCloseFeedbackModal();
      
      // Refresh requests data
      refetchRequests();
    } catch (err) {
      showError(
        "Failed to submit feedback. " +
        (err.response?.data?.message || err.message)
      );
    }
  };

  // Check if any data is still loading
  const isLoading = isLoadingProfile || isLoadingRequests || isLoadingNotifications || 
                   isLoadingProperties || isLoadingMaintenance || isLoadingLeases || 
                   isLoadingRents;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" color="#219377" className="mr-4" />
        <p className="text-xl text-gray-700 font-semibold">Loading your dashboard...</p>
      </div>
    );
  }

  // Prepare data for display
  const recentRequests = requestsData || [];
  const notifications = notificationsData || [];
  const myProperties = propertiesData?.properties || [];
  const upcomingMaintenance = maintenanceData || [];
  const leases = leasesData?.leases || [];
  const rents = rentsData?.rents || [];

  // Determine the primary unit/property for display, if any
  const primaryTenancy = profile?.associations?.tenancies?.[0];
  const currentUnit = primaryTenancy?.unit;
  const currentProperty = primaryTenancy?.property;

  return (
    <div className="p-4 md:p-8 min-h-full bg-gray-50">
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3 text-green-700 border-green-700">
        Welcome, {profile?.firstName || profile?.email || user?.firstName || user?.email}!
      </h1>
      <p className="text-lg text-gray-700 mb-8">
        Here's a snapshot of your property, maintenance, and financial activity.
      </p>

      {/* Quick Actions & Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Your Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-700 flex items-center">
            <Home className="w-5 h-5 mr-2" /> Your Profile
          </h2>
          {profile && (
            <div className="text-gray-700 space-y-2">
              <div>
                <b className="font-medium">Name:</b> {profile.firstName} {profile.lastName}
              </div>
              <div>
                <b className="font-medium">Email:</b> {profile.email}
              </div>
              <div>
                <b className="font-medium">Phone:</b> {profile.phone || "N/A"}
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Link
              to={ROUTES.TENANT_PROFILE}
              className="text-blue-600 hover:underline font-medium text-lg flex items-center"
            >
              Manage Profile <span className="ml-1 text-xl">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-700 flex items-center">
            <PlusCircle className="w-5 h-5 mr-2" /> Quick Actions
          </h2>
          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => navigate(ROUTES.REQUEST_ADD)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg shadow-md text-lg"
            >
              + Submit New Request
            </Button>
            <p className="text-sm text-gray-500 italic mt-2">
              You will typically be invited to join a property by your landlord or property manager.
            </p>
          </div>
        </div>

        {/* My Current Unit Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-700 flex items-center">
            <Home className="w-5 h-5 mr-2" /> My Current Unit
          </h2>
          {currentUnit ? (
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Property:</strong> {currentProperty?.name || "N/A"}
              </p>
              <p>
                <strong>Unit:</strong> {currentUnit.unitName || "N/A"}
              </p>
              <Link
                to={ROUTES.TENANT_MY_UNIT.replace(':unitId', currentUnit._id)}
                className="text-blue-600 hover:underline"
              >
                View Unit Details
              </Link>
            </div>
          ) : (
            <p className="text-gray-600 italic">
              No unit assigned yet. Please contact your property manager.
            </p>
          )}
        </div>
      </div>

      {/* Lease Information Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-orange-600 flex items-center">
            <FileText className="w-6 h-6 mr-2" /> My Leases
          </h3>
          <Link
            to={ROUTES.LEASES}
            className="text-blue-600 hover:underline font-medium"
          >
            View All Leases &rarr;
          </Link>
        </div>
        {leases.length === 0 ? (
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
                {leases.slice(0, 3).map((lease) => (
                  <tr key={lease._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lease.propertyName || "N/A"} / {lease.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(lease.leaseStartDate)} - {formatDate(lease.leaseEndDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ${lease.monthlyRent?.toFixed(2) || "0.00"} / {lease.rentFrequency || "month"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <LeaseStatusBadge status={lease.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={ROUTES.LEASE_DETAILS.replace(':leaseId', lease._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Ledger Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-orange-600 flex items-center">
            <DollarSign className="w-6 h-6 mr-2" /> Recent Payments
          </h3>
          <Link
            to={ROUTES.PAYMENTS}
            className="text-blue-600 hover:underline font-medium"
          >
            View All Payments &rarr;
          </Link>
        </div>
        {rents.length === 0 ? (
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rents.slice(0, 3).map((rent) => (
                  <tr key={rent._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rent.propertyName || "N/A"} / {rent.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {rent.formattedAmount || `$${rent.amountDue?.toFixed(2) || "0.00"}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {rent.formattedDueDate || formatDate(rent.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      {rent.statusDisplay || rent.status?.replace(/_/g, ' ') || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {rent.formattedPaymentDate || (rent.paymentDate ? formatDate(rent.paymentDate) : "N/A")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance Requests Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-green-700 flex items-center">
            <Wrench className="w-6 h-6 mr-2" /> My Maintenance Requests
          </h3>
          <Link
            to={ROUTES.REQUESTS}
            className="text-blue-600 hover:underline font-medium"
          >
            View All Requests &rarr;
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <p className="text-gray-600 italic">
            You have no maintenance requests submitted yet.
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRequests.slice(0, 5).map((req) => (
                  <tr key={req._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={ROUTES.REQUEST_DETAILS.replace(':requestId', req._id)} className="text-green-600 hover:underline">
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      {req.categoryDisplay || req.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.createdAtFormatted || formatDate(req.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={ROUTES.REQUEST_DETAILS.replace(':requestId', req._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                      {req.status === REQUEST_STATUSES.COMPLETED && !req.feedback?.submittedAt && (
                        <button
                          onClick={() => handleOpenFeedbackModal(req._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Give Feedback
                        </button>
                      )}
                      {req.status === REQUEST_STATUSES.COMPLETED && req.feedback?.submittedAt && (
                        <span className="text-gray-500 italic ml-2">Feedback Given</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Scheduled Maintenance Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-green-700 flex items-center">
            <CalendarDays className="w-6 h-6 mr-2" /> Upcoming Scheduled Maintenance
          </h3>
          <Link
            to={ROUTES.SCHEDULED_MAINTENANCE}
            className="text-blue-600 hover:underline font-medium"
          >
            View All &rarr;
          </Link>
        </div>
        {upcomingMaintenance.length === 0 ? (
          <p className="text-gray-600 italic">
            No upcoming scheduled maintenance for your unit/property.
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
                {upcomingMaintenance.slice(0, 5).map((task) => (
                  <tr key={task._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {task.propertyName || task.property?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {task.unitName || task.unit?.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {task.scheduledDateFormatted || formatDate(task.scheduledDate)}
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

      {/* Notifications Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-green-700 flex items-center">
            <Bell className="w-6 h-6 mr-2" /> Recent Notifications
          </h3>
          <Link
            to={ROUTES.NOTIFICATIONS}
            className="text-blue-600 hover:underline font-medium"
          >
            View All Notifications &rarr;
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="text-gray-600 italic">No recent notifications.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.slice(0, 5).map((notif) => (
              <li
                key={notif._id}
                className={`py-3 ${
                  notif.isRead
                    ? "text-gray-600"
                    : "font-semibold text-gray-800"
                }`}
              >
                <Link
                  to={ROUTES.NOTIFICATIONS}
                  className="hover:underline"
                >
                  {notif.message}{" "}
                  <span className="text-gray-500 text-sm ml-2">
                    ({formatDateTime(notif.createdAt)})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={handleCloseFeedbackModal}
        title="Submit Feedback"
      >
        <div className="p-4">
          <p className="mb-4 text-gray-700">
            How would you rate the resolution of this request?
          </p>
          <div className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setFeedbackRating(star)}
                className={`text-3xl ${feedbackRating >= star ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-500 transition-colors duration-200`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-28 resize-y text-gray-800"
            placeholder="Optional comments..."
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
          ></textarea>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              onClick={handleCloseFeedbackModal}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}