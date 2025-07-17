// frontend/src/pages/public/PublicRequestViewPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "../../components/common/Button.jsx"; // Ensure .jsx extension
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx"; // Using LoadingSpinner
import ConfirmationModal from "../../components/common/modals/ConfirmationModal.jsx"; // Assuming this modal exists
import {
  Wrench, Building, Home, User, Package, Calendar, Clock, Image, MessageSquare, CheckCircle
} from "lucide-react";

import {
  getPublicRequestView,
  publicRequestUpdate,
} from "../../services/publicService.js"; // Ensure .js extension
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx"; // Import useGlobalAlert
import { REQUEST_STATUSES, ROUTES } from "../../utils/constants.js"; // Import constants
import { formatDate, formatDateTime, isImage, isVideo } from "../../utils/helpers.js"; // Import helper functions for dates and media types

// -- Status & Priority Badge Components (adapted to use constants) --
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
    default: return <span className={`${base} bg-gray-100 text-gray-800`}>{status?.replace(/_/g, ' ') || 'N/A'}</span>;
  }
};

const PriorityBadge = ({ priority }) => {
  const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";
  switch (priority?.toLowerCase()) {
    case "low": return <span className={`${base} bg-gray-200 text-gray-700`}>{priority}</span>;
    case "medium": return <span className={`${base} bg-blue-100 text-blue-700`}>{priority}</span>;
    case "high": return <span className={`${base} bg-orange-100 text-orange-700`}>{priority}</span>;
    case "urgent": return <span className={`${base} bg-red-100 text-red-700`}>{priority}</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-600`}>{priority || 'N/A'}</span>;
  }
};

function PublicRequestViewPage() {
  const { publicToken } = useParams();
  const { showSuccess, showError } = useGlobalAlert(); // Destructure from useGlobalAlert

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState(null); // State to hold the status for confirmation

  // Fetch request details using the public token
  const fetchRequestDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requestData = await getPublicRequestView(publicToken);
      setRequest(requestData);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load request details. This link may be invalid, expired, or the request might not exist.";
      setError(message);
      showError(message); // Display error using global alert
      console.error("Public request details fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [publicToken, showError]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // --- Public Action Handlers ---

  // Function to initiate status update confirmation
  const initiateStatusUpdate = (newStatus) => {
    setStatusToUpdate(newStatus);
    setShowConfirmModal(true);
  };

  // Function to handle the actual status update after confirmation
  const confirmUpdateStatus = async () => {
    setShowConfirmModal(false); // Close the modal
    if (!statusToUpdate) return; // Should not happen if initiated correctly

    setLoading(true); // Set loading for the action
    setError(null); // Clear any previous errors

    try {
      await publicRequestUpdate(publicToken, { status: statusToUpdate.toLowerCase() });
      showSuccess(`Request status updated to "${statusToUpdate.replace(/_/g, ' ')}" successfully!`);
      fetchRequestDetails(); // Refresh the request details
    } catch (err) {
      const message = err.response?.data?.message || `Failed to update status to "${statusToUpdate.replace(/_/g, ' ')}". Please try again.`;
      setError(message);
      showError(message); // Display error using global alert
      console.error("Public status update error:", err);
    } finally {
      setLoading(false);
      setStatusToUpdate(null); // Clear the status to update
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" color="#219377" className="mr-4" />
        <p className="text-xl text-gray-700 font-semibold">Loading request details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        {/* Error message is already displayed via GlobalAlertContext */}
        <h3 className="text-lg font-semibold text-red-600 mb-4">Error Loading Request</h3>
        <p className="mt-2 text-center text-gray-700">{error}</p>
        <p className="mt-6 text-center text-gray-700">Please check the link or contact the property manager for assistance.</p>
        <div className="mt-8">
          <a href="mailto:support@fixit.com" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition">
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  if (!request) {
    // This case should ideally be covered by the error state if fetchRequestDetails fails to get data
    // but kept as a fallback for clarity.
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-600">Request not found.</p>
      </div>
    );
  }

  // Determine if the current user (via public token) is an assigned vendor
  const isAssignedVendor = request.assignedTo?.model === "Vendor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-10 px-4 sm:px-6 lg:px-8 font-inter antialiased text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
        <div className="text-center mb-8">
          <Wrench className="w-20 h-20 mx-auto text-green-700 mb-4" />
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{request.title}</h1>
          <p className="text-xl text-gray-700">Public Request View</p>
        </div>

        {/* Request Details Overview */}
        <div className="mb-10 p-6 rounded-xl bg-gray-50 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-lg text-gray-700">
            <p className="flex items-center"><Calendar className="w-5 h-5 mr-2 text-gray-500" /> <strong>Created:</strong> {formatDate(request.createdAt)}</p>
            <p className="flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-500" /> <strong>Last Update:</strong> {formatDateTime(request.updatedAt)}</p>
            <p className="flex items-center"><Building className="w-5 h-5 mr-2 text-gray-500" /> <strong>Property:</strong> {request.property?.name || "N/A"}</p>
            <p className="flex items-center"><Home className="w-5 h-5 mr-2 text-gray-500" /> <strong>Unit:</strong> {request.unit?.unitName || "N/A"}</p>
            <p className="flex items-center"><User className="w-5 h-5 mr-2 text-gray-500" /> <strong>Requested By:</strong> {request.createdBy?.name || request.createdBy?.email || "Tenant"}</p>
            <p className="flex items-center"><Package className="w-5 h-5 mr-2 text-gray-500" /> <strong>Assigned To:</strong> {request.assignedTo?.name || request.assignedTo?.email || "Unassigned"}</p>
            <div>
              <strong>Status:</strong> <StatusBadge status={request.status} />
            </div>
            <div>
              <strong>Priority:</strong> <PriorityBadge priority={request.priority} />
            </div>
            <div className="md:col-span-2">
              <strong>Category:</strong> <span className="capitalize">{request.category || "N/A"}</span>
            </div>
            <div className="md:col-span-2">
              <strong>Description:</strong> <p className="mt-2 p-3 bg-white rounded-lg border border-gray-300 text-gray-800">{request.description || "No description provided."}</p>
            </div>
          </div>
        </div>

        {/* Public Actions (e.g., for assigned vendor) */}
        {isAssignedVendor && (
          <div className="mb-10 p-6 rounded-xl bg-gray-50 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Vendor Actions</h2>
            <div className="flex flex-wrap gap-4">
              {/* Mark In Progress */}
              {(request.status === REQUEST_STATUSES.ASSIGNED || request.status === REQUEST_STATUSES.NEW) && (
                <Button
                  onClick={() => initiateStatusUpdate(REQUEST_STATUSES.IN_PROGRESS)}
                  className="bg-[#219377] hover:bg-green-800 text-white px-6 py-3 rounded-lg shadow-md flex items-center"
                  disabled={loading}
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Mark In Progress
                </Button>
              )}
              {/* Mark Completed */}
              {request.status === REQUEST_STATUSES.IN_PROGRESS && (
                <Button
                  onClick={() => initiateStatusUpdate(REQUEST_STATUSES.COMPLETED)}
                  className="bg-[#ffbd59] hover:bg-orange-600 text-gray-900 px-6 py-3 rounded-lg shadow-md flex items-center"
                  disabled={loading}
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Mark Completed
                </Button>
              )}
              {/* Add more vendor-specific status updates if needed */}
            </div>
          </div>
        )}

        {/* Media Section (View only for now) */}
        <div className="mb-10 p-6 rounded-xl bg-gray-50 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Image className="w-6 h-6 mr-2 text-green-700" /> Media Files
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
            {request.media && request.media.length > 0 ? (
              request.media.map((mediaItem, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {/* Assuming mediaItem has a 'url' and 'mimeType' property */}
                  {isImage(mediaItem.mimeType) ? (
                    <img src={mediaItem.url} alt={`Media ${index + 1}`} className="w-full h-32 object-cover" />
                  ) : isVideo(mediaItem.mimeType) ? (
                    <video src={mediaItem.url} controls className="w-full h-32 object-contain" />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-200 text-gray-600">
                      <span className="text-center">File Preview Not Available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a href={mediaItem.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-300 text-xl mx-2">
                      View Full
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 italic col-span-full">No media files uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Comments Section (View only) */}
        <div className="mb-10 p-6 rounded-xl bg-gray-50 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-green-700" /> Comments
          </h2>
          <div className="space-y-6 mb-6 max-h-80 overflow-y-auto pr-2">
            {request.comments && request.comments.length > 0 ? (
              request.comments.map(comment => (
                <div key={comment._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-900">{comment.user?.name || comment.user?.email || "External User"}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</p>
                  </div>
                  <p className="text-gray-800">{comment.message}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 italic">No comments yet.</p>
            )}
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          This is a public view of the service request. For full management, please log in to the Fix It platform.
          <Link to={ROUTES.LOGIN} className="text-blue-600 hover:underline ml-1">Login here</Link>.
        </p>
      </div>

      {/* Confirmation Modal for Status Update */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmUpdateStatus}
        title="Confirm Status Change"
        message={`Are you sure you want to change the request status to "${statusToUpdate?.replace(/_/g, ' ')}"?`}
        confirmText="Yes, Update Status"
        cancelText="Cancel"
        confirmButtonClass="bg-[#219377] hover:bg-green-800"
      />
    </div>
  );
}

export default PublicRequestViewPage;
