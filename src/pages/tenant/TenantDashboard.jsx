// frontend/src/pages/tenant/TenantDashboard.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Import updated service functions
import { getAllRequests, updateRequest, submitFeedback } from "../../services/requestService"; // getAllRequests can filter
import { getMyProfile } from "../../services/userService"; // Renamed from getProfile
import { getAllNotifications } from "../../services/notificationService";
import { getAllProperties } from "../../services/propertyService"; // For tenants, this will filter to their properties
import { getAllScheduledMaintenance } from "../../services/scheduledMaintenanceService"; // Renamed from getUserTasks

// Common UI components (assuming they exist or will be created)
import Modal from "../../components/common/Modal"; // For feedback or messages
import Button from "../../components/common/Button"; // Generic button

// Helper for displaying messages to user (instead of alert)
const showMessage = (msg, type = 'info') => {
  // Implement a toast/snackbar/modal system here
  // For now, a simple console log
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Keeping alert for now as per previous usage, but recommend a better UI
};


export default function TenantDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myProperties, setMyProperties] = useState([]); // Properties the tenant is associated with
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]); // Scheduled maintenance for their unit/property
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // State for feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");

  useEffect(() => {
    async function fetchAllTenantData() {
      setLoading(true);
      setError("");
      try {
        const userProfile = await getMyProfile(); // Use new getMyProfile
        setProfile(userProfile);

        // Fetch requests created by the current user (role is 'tenant' handled by backend filter)
        const userRequests = await getAllRequests({ createdBy: userProfile._id });
        setRequests(userRequests);

        // Fetch notifications for the current user
        const userNotifications = await getAllNotifications();
        setNotifications(userNotifications);

        // Fetch properties associated with the current user
        // backend getAllProperties already filters by user association
        const associatedProperties = await getAllProperties();
        setMyProperties(associatedProperties);

        // Fetch scheduled maintenance relevant to tenant's properties/units
        // backend getAllScheduledMaintenance already filters by user association
        const scheduledTasksRes = await getAllScheduledMaintenance();
        // Filter for upcoming tasks (e.g., in next 30 days and not completed)
        const upcoming = scheduledTasksRes.tasks?.filter(task =>
          new Date(task.scheduledDate) > new Date() &&
          task.status !== 'completed' &&
          task.status !== 'canceled'
        ).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)) || [];
        setUpcomingMaintenance(upcoming);

      } catch (err) {
        setError("Failed to load tenant data. Please try again.");
        console.error("Tenant Dashboard fetch error:", err);
        // Clear data on error
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

  // --- Feedback Modal Handlers ---
  const handleOpenFeedbackModal = (requestId) => {
    setSelectedRequestId(requestId);
    setShowFeedbackModal(true);
    setFeedbackRating(0); // Reset form
    setFeedbackComment("");
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedRequestId(null);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedRequestId || feedbackRating === 0) {
      showMessage("Please provide a rating.", 'error');
      return;
    }
    try {
      await submitFeedback(selectedRequestId, { rating: feedbackRating, comment: feedbackComment });
      showMessage("Feedback submitted successfully!", 'success');
      handleCloseFeedbackModal();
      // Refresh requests to update feedback status
      const userRequests = await getAllRequests({ createdBy: profile._id });
      setRequests(userRequests);
    } catch (err) {
      showMessage("Failed to submit feedback. " + (err.response?.data?.message || err.message), 'error');
      console.error("Submit feedback error:", err);
    }
  };


  if (loading) {
    return (
     
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Loading your dashboard...</p>
        </div>
   
    );
  }

  return (
   
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">
          Welcome, {profile?.name || profile?.email}!
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Here's a snapshot of your maintenance activity and important updates.
        </p>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        {/* Quick Actions & Profile Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Profile</h2>
            {profile && (
              <div className="text-gray-700 space-y-2">
                <div><b>Name:</b> {profile.name}</div>
                <div><b>Email:</b> {profile.email}</div>
                <div><b>Phone:</b> {profile.phone || "N/A"}</div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Link to="/tenant/profile" className="text-blue-600 hover:underline font-medium text-lg flex items-center">
                Manage Profile <span className="ml-1 text-xl">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex flex-col space-y-3">
              <Button
                onClick={() => navigate('/tenant/requests/add')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg shadow-md transition duration-200 text-lg"
              >
                + Submit New Request
              </Button>
              {/* Note: "Request to Join Property" functionality.
                  This feature is currently implemented on the backend via the Invite system.
                  A tenant would typically receive an invite from a Landlord/PM.
                  If direct self-request to join is desired, it needs an Invite model integration
                  or a different backend approach. For now, this form is commented out.
              */}
              {/*
              <form onSubmit={handleJoinProperty} className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Property ID to join"
                  value={joinPropertyId}
                  onChange={e => setJoinPropertyId(e.target.value)}
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg shadow-md transition duration-200 text-lg">
                  Request to Join
                </Button>
                {joinError && <span className="text-red-600 text-sm">{joinError}</span>}
              </form>
              */}
              <p className="text-sm text-gray-500 italic mt-2">
                You will typically be invited to join a property by your landlord or property manager.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Current Unit</h2>
            {profile?.associations?.tenancies?.length > 0 ? (
              <div className="space-y-2">
                {profile.associations.tenancies.map(tenancy => (
                  <div key={tenancy.unit._id} className="text-gray-700">
                    <p><strong>Property:</strong> {tenancy.property.name}</p>
                    <p><strong>Unit:</strong> {tenancy.unit.unitName}</p>
                    <Link to={`/tenant/my-unit/${tenancy.unit._id}`} className="text-blue-600 hover:underline">View Unit Details</Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic">No unit assigned yet. Please contact your property manager.</p>
            )}
          </div>
        </div>

        {/* Maintenance Requests Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-800">My Maintenance Requests</h3>
            <Link to="/tenant/requests" className="text-blue-600 hover:underline font-medium">View All Requests &rarr;</Link>
          </div>
          {requests.length === 0 ? (
            <p className="text-gray-600 italic">You have no maintenance requests submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.slice(0, 5).map((req) => ( // Show first 5 requests
                    <tr key={req._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={`/tenant/requests/${req._id}`} className="text-green-600 hover:underline">
                          {req.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          req.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          req.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                          req.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'completed' ? 'bg-green-100 text-green-800' :
                          req.status === 'verified' ? 'bg-teal-100 text-teal-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{req.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/tenant/requests/${req._id}`} className="text-blue-600 hover:text-blue-900 mr-3">View</Link>
                        {req.status === 'completed' && !req.feedback?.submittedAt && (
                          <button
                            onClick={() => handleOpenFeedbackModal(req._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Give Feedback
                          </button>
                        )}
                        {req.status === 'completed' && req.feedback?.submittedAt && (
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
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-800">Upcoming Scheduled Maintenance</h3>
            <Link to="/tenant/scheduled-maintenance" className="text-blue-600 hover:underline font-medium">View All &rarr;</Link>
          </div>
          {upcomingMaintenance.length === 0 ? (
            <p className="text-gray-600 italic">No upcoming scheduled maintenance for your unit/property.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingMaintenance.slice(0, 5).map(task => ( // Show first 5
                    <tr key={task._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.property?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.unit?.unitName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(task.scheduledDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{task.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-800">Recent Notifications</h3>
            <Link to="/tenant/notifications" className="text-blue-600 hover:underline font-medium">View All Notifications &rarr;</Link>
          </div>
          {notifications.length === 0 ? (
            <p className="text-gray-600 italic">No recent notifications.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.slice(0, 5).map(notif => (
                <li key={notif._id} className={`py-3 ${notif.isRead ? 'text-gray-600' : 'font-semibold text-gray-800'}`}>
                  <Link to={`/tenant/notifications/${notif._id}`} className="hover:underline">
                    {notif.message} <span className="text-gray-500 text-sm ml-2">({new Date(notif.createdAt).toLocaleString()})</span>
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
            <p className="mb-4 text-gray-700">How would you rate the resolution of this request?</p>
            <div className="flex space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  className={`text-3xl ${feedbackRating >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-500 transition-colors duration-200`}
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
