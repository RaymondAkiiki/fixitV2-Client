import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import {
  Wrench, Building, Home, User, Package, Calendar, Clock, Image, MessageSquare, PlusCircle, CheckCircle
} from "lucide-react";

import {
  getPublicRequestView,
  publicRequestUpdate,
  // If you have similar public upload endpoints, import here.
  // publicRequestMediaUpload,
} from "../../services/publicService";

// -- Status & Priority Badge Components (no change) --
const StatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case "new": return <span className={`${base} bg-blue-100 text-blue-800`}>{status.replace(/_/g, ' ')}</span>;
    case "assigned": return <span className={`${base} bg-purple-100 text-purple-800`}>{status.replace(/_/g, ' ')}</span>;
    case "in_progress": return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status.replace(/_/g, ' ')}</span>;
    case "completed": return <span className={`${base} bg-green-100 text-green-800`}>{status.replace(/_/g, ' ')}</span>;
    case "verified": return <span className={`${base} bg-teal-100 text-teal-800`}>{status.replace(/_/g, ' ')}</span>;
    case "reopened": return <span className={`${base} bg-orange-100 text-orange-800`}>{status.replace(/_/g, ' ')}</span>;
    case "archived": return <span className={`${base} bg-gray-200 text-gray-800`}>{status.replace(/_/g, ' ')}</span>;
    case "canceled": return <span className={`${base} bg-red-100 text-red-800`}>{status.replace(/_/g, ' ')}</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-800`}>{status.replace(/_/g, ' ')}</span>;
  }
};

const PriorityBadge = ({ priority }) => {
  const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";
  switch (priority?.toLowerCase()) {
    case "low": return <span className={`${base} bg-gray-200 text-gray-700`}>{priority}</span>;
    case "medium": return <span className={`${base} bg-blue-100 text-blue-700`}>{priority}</span>;
    case "high": return <span className={`${base} bg-orange-100 text-orange-700`}>{priority}</span>;
    case "urgent": return <span className={`${base} bg-red-100 text-red-700`}>{priority}</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-600`}>{priority}</span>;
  }
};

const showMessage = (msg, type = "info") => {
  // You can swap with your toast/snackbar
  alert(msg);
};

function PublicRequestViewPage() {
  const { publicToken } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // If comments/media are included in the main request, show them; otherwise, you need public endpoints for them.

  // Fetch request details using the public token
  const fetchRequestDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requestData = await getPublicRequestView(publicToken);
      setRequest(requestData);
    } catch (err) {
      setError("Failed to load request details. This link may be invalid, expired, or the request might not exist.");
      console.error("Public request details fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [publicToken]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // --- Public Action Handlers ---

  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to "${newStatus}"?`)) return;
    setLoading(true);
    setError(null);
    try {
      await publicRequestUpdate(publicToken, { status: newStatus.toLowerCase() });
      showMessage(`Request status updated to "${newStatus}"!`, "success");
      fetchRequestDetails(); // Refresh
    } catch (err) {
      setError(`Failed to update status: ${err.response?.data?.message || err.message}`);
      showMessage(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      console.error("Public status update error:", err);
    } finally {
      setLoading(false);
    }
  };

  // You can implement public comment/media upload later, if endpoints exist.

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spinner size="lg" color="#219377" className="mr-4" />
        <p className="text-xl text-gray-700 font-semibold">Loading request details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <Alert type="error" message={error} />
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
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-600">Request not found.</p>
      </div>
    );
  }

  // Allowed status updates for vendor (customize as needed)
  const allowedPublicStatuses = ["in_progress", "completed"];

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
            <p className="flex items-center"><Calendar className="w-5 h-5 mr-2 text-gray-500" /> <strong>Created:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
            <p className="flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-500" /> <strong>Last Update:</strong> {new Date(request.updatedAt).toLocaleDateString()}</p>
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
        {request.assignedTo?.model === "Vendor" && (
          <div className="mb-10 p-6 rounded-xl bg-gray-50 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Vendor Actions</h2>
            <div className="flex flex-wrap gap-4">
              {(request.status === "assigned" || request.status === "new") && (
                <Button
                  onClick={() => handleUpdateStatus("in_progress")}
                  className="bg-[#219377] hover:bg-green-800 text-white px-6 py-3 rounded-lg shadow-md flex items-center"
                  disabled={loading}
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Mark In Progress
                </Button>
              )}
              {request.status === "in_progress" && (
                <Button
                  onClick={() => handleUpdateStatus("completed")}
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

        {/* Media Section (View only for now, unless you later add public upload endpoint) */}
        <div className="mb-10 p-6 rounded-xl bg-gray-50 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Image className="w-6 h-6 mr-2 text-green-700" /> Media Files
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
            {request.media && request.media.length > 0 ? (
              request.media.map((mediaUrl, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {mediaUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                    <img src={mediaUrl} alt={`Media ${index + 1}`} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-200 text-gray-600">
                      <video src={mediaUrl} controls className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-300 text-xl mx-2">
                      View
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 italic col-span-full">No media files uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Comments Section (View only unless you add public comment endpoint) */}
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
                    <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
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
        </p>
      </div>
    </div>
  );
}

export default PublicRequestViewPage;