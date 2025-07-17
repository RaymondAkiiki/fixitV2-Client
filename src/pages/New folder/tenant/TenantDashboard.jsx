import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAllRequests, submitFeedback } from "../../services/requestService";
import { getMyProfile } from "../../services/userService";
import { getAllNotifications } from "../../services/notificationService";
import { getAllProperties } from "../../services/propertyService";
import { getAllScheduledMaintenance } from "../../services/scheduledMaintenanceService";

import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";

// Brand colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Helper for displaying messages to user (prefer toast/snackbar in production)
const showMessage = (msg, type = "info") => {
  // Replace with a toast/snackbar/modal system in production
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg);
};

export default function TenantDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");

  useEffect(() => {
    async function fetchAllTenantData() {
      setLoading(true);
      setError("");
      try {
        const userProfile = await getMyProfile();
        setProfile(userProfile);

        const userRequests = await getAllRequests({ createdBy: userProfile._id });
        setRequests(userRequests);

        const userNotifications = await getAllNotifications();
        setNotifications(userNotifications);

        const associatedProperties = await getAllProperties();
        setMyProperties(associatedProperties);

        const scheduledTasksRes = await getAllScheduledMaintenance();
        const upcoming =
          scheduledTasksRes.tasks
            ?.filter(
              (task) =>
                new Date(task.scheduledDate) > new Date() &&
                task.status !== "completed" &&
                task.status !== "canceled"
            )
            .sort(
              (a, b) =>
                new Date(a.scheduledDate) - new Date(b.scheduledDate)
            ) || [];
        setUpcomingMaintenance(upcoming);
      } catch (err) {
        setError("Failed to load tenant data. Please try again.");
        setRequests([]);
        setNotifications([]);
        setMyProperties([]);
        setUpcomingMaintenance([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAllTenantData();
  }, []);

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
      showMessage("Please provide a rating.", "error");
      return;
    }
    try {
      await submitFeedback(selectedRequestId, {
        rating: feedbackRating,
        comment: feedbackComment,
      });
      showMessage("Feedback submitted successfully!", "success");
      handleCloseFeedbackModal();
      // Refresh requests to update feedback status
      const userRequests = await getAllRequests({ createdBy: profile._id });
      setRequests(userRequests);
    } catch (err) {
      showMessage(
        "Failed to submit feedback. " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
        Welcome, {profile?.name || profile?.email}!
      </h1>
      <p className="text-lg text-gray-700 mb-8">
        Here's a snapshot of your maintenance activity and important updates.
      </p>

      {error && (
        <div
          className="px-4 py-3 rounded relative mb-4 flex items-center"
          style={{
            backgroundColor: "#fed7d7",
            border: "1.5px solid #f56565",
            color: "#9b2c2c"
          }}
          role="alert"
        >
          <strong className="font-bold mr-2">Error!</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Quick Actions & Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border" style={{ borderColor: PRIMARY_COLOR + "20" }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>Your Profile</h2>
          {profile && (
            <div className="text-gray-700 space-y-2">
              <div>
                <b>Name:</b> {profile.name}
              </div>
              <div>
                <b>Email:</b> {profile.email}
              </div>
              <div>
                <b>Phone:</b> {profile.phone || "N/A"}
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Link
              to="/tenant/profile"
              className="text-blue-600 hover:underline font-medium text-lg flex items-center"
            >
              Manage Profile <span className="ml-1 text-xl">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border" style={{ borderColor: PRIMARY_COLOR + "20" }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>Quick Actions</h2>
          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => navigate("/tenant/requests/add")}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg shadow-md text-lg"
            >
              + Submit New Request
            </Button>
            <p className="text-sm text-gray-500 italic mt-2">
              You will typically be invited to join a property by your landlord or property manager.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border" style={{ borderColor: PRIMARY_COLOR + "20" }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: PRIMARY_COLOR }}>My Current Unit</h2>
          {profile?.associations?.tenancies?.length > 0 ? (
            <div className="space-y-2">
              {profile.associations.tenancies.map((tenancy) => (
                <div key={tenancy.unit._id} className="text-gray-700">
                  <p>
                    <strong>Property:</strong> {tenancy.property.name}
                  </p>
                  <p>
                    <strong>Unit:</strong> {tenancy.unit.unitName}
                  </p>
                  <Link
                    to={`/tenant/my-unit/${tenancy.unit._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Unit Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">
              No unit assigned yet. Please contact your property manager.
            </p>
          )}
        </div>
      </div>

      {/* Maintenance Requests Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border mb-8" style={{ borderColor: PRIMARY_COLOR + "20" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>
            My Maintenance Requests
          </h3>
          <Link
            to="/tenant/requests"
            className="text-blue-600 hover:underline font-medium"
          >
            View All Requests &rarr;
          </Link>
        </div>
        {requests.length === 0 ? (
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
                {requests.slice(0, 5).map((req) => (
                  <tr key={req._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/tenant/requests/${req._id}`} className="text-green-600 hover:underline">
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          req.status === "new"
                            ? "bg-blue-100 text-blue-800"
                            : req.status === "assigned"
                            ? "bg-purple-100 text-purple-800"
                            : req.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : req.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : req.status === "verified"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {req.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      {req.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/tenant/requests/${req._id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                      {req.status === "completed" && !req.feedback?.submittedAt && (
                        <button
                          onClick={() => handleOpenFeedbackModal(req._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Give Feedback
                        </button>
                      )}
                      {req.status === "completed" && req.feedback?.submittedAt && (
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
      <div className="bg-white p-6 rounded-xl shadow-lg border mb-8" style={{ borderColor: PRIMARY_COLOR + "20" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>
            Upcoming Scheduled Maintenance
          </h3>
          <Link
            to="/tenant/scheduled-maintenance"
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
                      {task.property?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {task.unit?.unitName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(task.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      {task.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border mb-8" style={{ borderColor: PRIMARY_COLOR + "20" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>
            Recent Notifications
          </h3>
          <Link
            to="/tenant/notifications"
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
                  to={`/tenant/notifications/${notif._id}`}
                  className="hover:underline"
                >
                  {notif.message}{" "}
                  <span className="text-gray-500 text-sm ml-2">
                    ({new Date(notif.createdAt).toLocaleString()})
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