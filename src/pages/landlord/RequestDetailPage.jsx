import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import {
  Wrench, PlusCircle, Building, Home, User, Package, Calendar, Clock, Image, MessageSquare, Link as LinkIcon, Edit, CheckSquare, RotateCcw, Archive
} from "lucide-react";
import {
  getRequestById, updateRequest, uploadRequestMedia, deleteRequestMedia,
  assignRequest, enableRequestPublicLink, disableRequestPublicLink,
  verifyRequest, reopenRequest, archiveRequest
} from "../../services/requestService";
import { addComment, getComments } from "../../services/commentService";
import { getAllVendors } from "../../services/vendorService";
import { getAllUsers } from "../../services/userService";

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Status badge
const StatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  const badgeMap = {
    new: "bg-blue-100 text-blue-800",
    assigned: "bg-purple-100 text-purple-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    verified: "bg-teal-100 text-teal-800",
    reopened: "bg-orange-100 text-orange-800",
    archived: "bg-gray-200 text-gray-800",
    canceled: "bg-red-100 text-red-800"
  };
  const badgeClass = badgeMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  return (
    <span className={`${base} ${badgeClass}`}>{status?.replace(/_/g, ' ')}</span>
  );
};

const PriorityBadge = ({ priority }) => {
  const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";
  const badgeMap = {
    low: "bg-gray-200 text-gray-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700"
  };
  const badgeClass = badgeMap[priority?.toLowerCase()] || "bg-gray-100 text-gray-600";
  return (
    <span className={`${base} ${badgeClass}`}>{priority}</span>
  );
};

const showMessage = (msg, type = "info") => {
  alert(msg);
};

function RequestDetailPage() {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedToType, setAssignedToType] = useState("User");
  const [assigneeId, setAssigneeId] = useState("");
  const [vendors, setVendors] = useState([]);
  const [internalUsers, setInternalUsers] = useState([]);
  const [assignModalError, setAssignModalError] = useState("");

  // Comments
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");

  // Media
  const [uploadMediaError, setUploadMediaError] = useState("");

  // Public link
  const [publicLinkUrl, setPublicLinkUrl] = useState("");
  const [publicLinkExpiry, setPublicLinkExpiry] = useState(null);
  const [linkExpiryDays, setLinkExpiryDays] = useState(7);
  const [publicLinkError, setPublicLinkError] = useState("");

  // Fetch request details and comments
  const fetchRequestDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requestData = await getRequestById(requestId);
      setRequest(requestData);

      if (requestData.publicLinkEnabled && requestData.publicToken) {
        setPublicLinkUrl(`${window.location.origin}/public/requests/${requestData.publicToken}`);
        setPublicLinkExpiry(requestData.publicLinkExpiresAt || null);
      } else {
        setPublicLinkUrl("");
        setPublicLinkExpiry(null);
      }

      const commentsData = await getComments({
        contextType: "request",
        contextId: requestId
      });
      setComments(commentsData);

      if (requestData.assignedTo) {
        setAssignedToType(requestData.assignedToModel || "User");
        setAssigneeId(requestData.assignedTo._id);
      } else {
        setAssignedToType("User");
        setAssigneeId("");
      }
    } catch (err) {
      setError("Failed to load request details. " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    async function fetchAssignOptions() {
      try {
        const [vendorsData, usersData] = await Promise.all([
          getAllVendors(),
          getAllUsers({ roles: ["propertymanager", "landlord", "admin"] })
        ]);
        setVendors(vendorsData);
        setInternalUsers(usersData);
      } catch (err) {
        setError("Failed to load assignment options.");
      }
    }
    fetchAssignOptions();
  }, []);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // --- Action Handlers ---
  const handleStatusChange = async (newStatus) => {
    if (window.confirm(`Are you sure you want to change this request's status to "${newStatus}"?`)) {
      try {
        await updateRequest(requestId, { status: newStatus.toLowerCase() });
        showMessage(`Request status updated to "${newStatus}"!`, "success");
        fetchRequestDetails();
      } catch (err) {
        showMessage(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      }
    }
  };

  const handleAssignSubmit = async () => {
    setAssignModalError("");
    if (!assigneeId) {
      setAssignModalError("Please select an assignee.");
      return;
    }
    try {
      await assignRequest(requestId, {
        assignedToId: assigneeId,
        assignedToModel: assignedToType,
      });
      showMessage(`Request assigned successfully to ${assignedToType}!`, "success");
      setShowAssignModal(false);
      fetchRequestDetails();
    } catch (err) {
      setAssignModalError(`Failed to assign: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAddComment = async () => {
    setCommentError("");
    if (!newComment.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    try {
      await addComment({
        contextType: "request",
        contextId: requestId,
        message: newComment,
      });
      showMessage("Comment added successfully!", "success");
      setNewComment("");
      fetchRequestDetails();
    } catch (err) {
      setCommentError(`Failed to add comment: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleMediaUpload = async (e) => {
    setUploadMediaError("");
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime"];
    const maxFileSize = 5 * 1024 * 1024;
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setUploadMediaError(`File type not allowed: ${file.name} (${file.type}). Allowed: JPG, PNG, GIF, MP4, MOV.`);
        return;
      }
      if (file.size > maxFileSize) {
        setUploadMediaError(`File "${file.name}" is too large. Max size is 5MB.`);
        return;
      }
    }
    try {
      await uploadRequestMedia(requestId, files);
      showMessage("Media uploaded successfully!", "success");
      e.target.value = "";
      fetchRequestDetails();
    } catch (err) {
      setUploadMediaError(`Failed to upload media: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteMedia = async (mediaUrl) => {
    if (window.confirm("Are you sure you want to delete this media file?")) {
      try {
        await deleteRequestMedia(requestId, mediaUrl);
        showMessage("Media deleted successfully!", "success");
        fetchRequestDetails();
      } catch (err) {
        showMessage(`Failed to delete media: ${err.response?.data?.message || err.message}`, "error");
      }
    }
  };

  // --- Public Link Logic ---
  const handleEnablePublicLink = async () => {
    setPublicLinkError("");
    try {
      const res = await enableRequestPublicLink(requestId, linkExpiryDays);
      setPublicLinkUrl(res.publicLink || `${window.location.origin}/public/requests/${res.publicToken || ""}`);
      setPublicLinkExpiry(res.publicLinkExpiresAt || null);
      showMessage("Public link enabled!", "success");
    } catch (err) {
      setPublicLinkError(`Failed to enable public link: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDisablePublicLink = async () => {
    if (window.confirm("Are you sure you want to disable the public link for this request?")) {
      try {
        await disableRequestPublicLink(requestId);
        setPublicLinkUrl("");
        setPublicLinkExpiry(null);
        showMessage("Public link disabled!", "success");
      } catch (err) {
        setPublicLinkError(`Failed to disable public link: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleCopyPublicLink = () => {
    if (publicLinkUrl) {
      navigator.clipboard.writeText(publicLinkUrl)
        .then(() => showMessage("Public link copied to clipboard!", "info"))
        .catch(() => showMessage("Failed to copy link (manual copy required).", "error"));
    }
  };

  const handleVerifyRequest = async () => {
    if (window.confirm("Are you sure you want to verify this completed request?")) {
      try {
        await verifyRequest(requestId);
        showMessage("Request verified successfully!", "success");
        fetchRequestDetails();
      } catch (err) {
        showMessage(`Failed to verify request: ${err.response?.data?.message || err.message}`, "error");
      }
    }
  };

  const handleReopenRequest = async () => {
    if (window.confirm("Are you sure you want to reopen this request?")) {
      try {
        await reopenRequest(requestId);
        showMessage("Request reopened successfully!", "success");
        fetchRequestDetails();
      } catch (err) {
        showMessage(`Failed to reopen request: ${err.response?.data?.message || err.message}`, "error");
      }
    }
  };

  const handleArchiveRequest = async () => {
    if (window.confirm("Are you sure you want to archive this request?")) {
      try {
        await archiveRequest(requestId);
        showMessage("Request archived successfully!", "success");
        fetchRequestDetails();
      } catch (err) {
        showMessage(`Failed to archive request: ${err.response?.data?.message || err.message}`, "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading request details...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }
  if (!request) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Request not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <div className="flex justify-between items-center mb-7 border-b pb-3" style={{ borderColor: PRIMARY_COLOR }}>
        <h1 className="text-3xl font-extrabold flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Wrench className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
          Request: {request.title}
        </h1>
        <Link to={`/landlord/requests/edit/${request._id}`}>
          <Button className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold" style={{ backgroundColor: "#2563eb", color: "#fff" }}>
            <Edit className="w-5 h-5 mr-2" /> Edit Request
          </Button>
        </Link>
      </div>

      {/* Request Overview */}
      <div className="bg-white p-8 rounded-xl shadow-lg border mb-8" style={{ borderColor: PRIMARY_COLOR + "14" }}>
        <h2 className="text-2xl font-semibold mb-5" style={{ color: PRIMARY_COLOR }}>Request Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-700 text-lg">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-500 mr-2" />
            <strong>Created:</strong> {new Date(request.createdAt).toLocaleString()}
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <strong>Last Updated:</strong> {new Date(request.updatedAt).toLocaleString()}
          </div>
          <div className="flex items-center">
            <Building className="w-5 h-5 text-gray-500 mr-2" />
            <strong>Property:</strong> <Link to={`/landlord/properties/${request.property?._id}`} className="text-blue-600 hover:underline ml-1">
              {request.property?.name || "N/A"}
            </Link>
          </div>
          <div className="flex items-center">
            <Home className="w-5 h-5 text-gray-500 mr-2" />
            <strong>Unit:</strong> {request.unit?.unitName || "N/A"}
          </div>
          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-500 mr-2" />
            <strong>Requested By:</strong> {request.createdBy?.name || request.createdBy?.email || "N/A"}
          </div>
          <div className="flex items-center">
            <Package className="w-5 h-5 text-gray-500 mr-2" />
            <strong>Assigned To:</strong> {request.assignedTo?.name || request.assignedTo?.email || "Unassigned"} ({request.assignedToModel || "N/A"})
          </div>
          <div>
            <strong>Status:</strong> <StatusBadge status={request.status} />
          </div>
          <div>
            <strong>Priority:</strong> <PriorityBadge priority={request.priority} />
          </div>
          <div className="md:col-span-2">
            <strong>Category:</strong> <span className="capitalize">{request.category}</span>
          </div>
          <div className="md:col-span-2">
            <strong>Description:</strong> <p className="mt-2 text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">{request.description || "No description provided."}</p>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border mb-8" style={{ borderColor: PRIMARY_COLOR + "14" }}>
        <h2 className="text-2xl font-semibold mb-5" style={{ color: PRIMARY_COLOR }}>Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setShowAssignModal(true)} className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold" style={{ backgroundColor: "#a78bfa", color: "#fff" }}>
            <Package className="w-5 h-5 mr-2" /> Assign / Reassign
          </Button>
          {request.status === "new" && (
            <Button onClick={() => handleStatusChange("in_progress")} className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold" style={{ backgroundColor: "#facc15", color: "#fff" }}>
              <Wrench className="w-5 h-5 mr-2" /> Mark In Progress
            </Button>
          )}
          {(request.status === "in_progress" || request.status === "assigned") && (
            <Button onClick={() => handleStatusChange("completed")} className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold" style={{ backgroundColor: "#22c55e", color: "#fff" }}>
              <CheckSquare className="w-5 h-5 mr-2" /> Mark Completed
            </Button>
          )}
          {request.status === "completed" && (
            <Button onClick={handleVerifyRequest} className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold" style={{ backgroundColor: "#14b8a6", color: "#fff" }}>
              <CheckSquare className="w-5 h-5 mr-2" /> Verify Completion
            </Button>
          )}
          {(request.status === "completed" || request.status === "verified") && (
            <Button onClick={handleReopenRequest} className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold" style={{ backgroundColor: "#fb923c", color: "#fff" }}>
              <RotateCcw className="w-5 h-5 mr-2" /> Reopen Request
            </Button>
          )}
          {request.status !== "archived" && (
            <Button onClick={handleArchiveRequest} className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold" style={{ backgroundColor: "#6b7280", color: "#fff" }}>
              <Archive className="w-5 h-5 mr-2" /> Archive Request
            </Button>
          )}
        </div>
      </div>

      {/* Media Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg border mb-8" style={{ borderColor: PRIMARY_COLOR + "14" }}>
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Image className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} /> Media Files
        </h2>
        {uploadMediaError && <p className="text-red-500 text-sm mb-3">{uploadMediaError}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
          {request.media && request.media.length > 0 ? (
            request.media.map((mediaUrl, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                {mediaUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                  <img src={mediaUrl} alt={`Media ${i + 1}`} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-200 text-gray-600">
                    <video src={mediaUrl} controls className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-300 text-xl mx-2">View</a>
                  <button onClick={() => handleDeleteMedia(mediaUrl)} className="text-red-400 hover:text-red-600 text-xl mx-2">Delete</button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 italic col-span-full">No media files uploaded yet.</p>
          )}
        </div>
        <label htmlFor="mediaUpload" className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md cursor-pointer transition">
          <PlusCircle className="w-5 h-5 mr-2" /> Upload New Media
          <input
            type="file"
            id="mediaUpload"
            multiple
            onChange={handleMediaUpload}
            className="hidden"
            accept="image/*,video/*"
          />
        </label>
      </div>

      {/* Public Link Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg border mb-8" style={{ borderColor: PRIMARY_COLOR + "14" }}>
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <LinkIcon className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} /> Public Link
        </h2>
        {publicLinkError && <p className="text-red-500 text-sm mb-3">{publicLinkError}</p>}
        {publicLinkUrl ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex-1 mr-4 break-all">
              <p className="font-mono text-blue-700 text-lg">{publicLinkUrl}</p>
              <p className="text-sm text-gray-600 mt-1">
                Link will expire on: {publicLinkExpiry ? new Date(publicLinkExpiry).toLocaleString() : "Never"}
              </p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <Button onClick={handleCopyPublicLink} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm flex items-center">Copy Link</Button>
              <Button onClick={handleDisablePublicLink} className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm flex items-center">Disable Link</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              No public link currently enabled for this request. Enabling a public link allows external parties (like vendors) to view and update the request without logging in.
            </p>
            <div>
              <label htmlFor="linkExpiryDays" className="block text-sm font-medium text-gray-700">Link Expiry (Days):</label>
              <input
                type="number"
                id="linkExpiryDays"
                min="1"
                value={linkExpiryDays}
                onChange={(e) => setLinkExpiryDays(e.target.value)}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-32"
              />
              <p className="text-xs text-gray-500 mt-1">Set to 0 for no expiry (use with caution).</p>
            </div>
            <Button onClick={handleEnablePublicLink} className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center">
              <LinkIcon className="w-5 h-5 mr-2" /> Enable Public Link
            </Button>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg border mb-8" style={{ borderColor: PRIMARY_COLOR + "14" }}>
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <MessageSquare className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} /> Comments
        </h2>
        <div className="space-y-6 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-600 italic">No comments yet. Be the first to add one!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-gray-900">{comment.user?.name || comment.user?.email || "System"}</p>
                  <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-gray-800">{comment.message}</p>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Add a Comment</h3>
          {commentError && <p className="text-red-500 text-sm mb-3">{commentError}</p>}
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-28 resize-y text-gray-800"
            placeholder="Type your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <div className="flex justify-end mt-4">
            <Button onClick={handleAddComment} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center">
              <PlusCircle className="w-5 h-5 mr-2" /> Post Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Assign Request Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Assign Request</span>}
      >
        <div className="p-4 space-y-4">
          {assignModalError && <p className="text-red-500 mb-3">{assignModalError}</p>}
          <div>
            <label htmlFor="assignToType" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Assign To:</label>
            <select
              id="assignToType"
              value={assignedToType}
              onChange={(e) => {
                setAssignedToType(e.target.value);
                setAssigneeId("");
              }}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
              style={{ borderColor: PRIMARY_COLOR }}
            >
              <option value="User">Internal User (landlord/Landlord)</option>
              <option value="Vendor">Vendor</option>
            </select>
          </div>
          <div>
            <label htmlFor="assigneeSelect" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Select Assignee:</label>
            <select
              id="assigneeSelect"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            >
              <option value="">-- Select --</option>
              {assignedToType === "User"
                ? internalUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.email}
                    </option>
                  ))
                : vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </option>
                  ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAssignModal(false)} className="py-2 px-4 rounded-lg" style={{ backgroundColor: "#e4e4e7", color: PRIMARY_COLOR, fontWeight: 600 }}>Cancel</Button>
            <Button onClick={handleAssignSubmit} className="py-2 px-4 rounded-lg" style={{ backgroundColor: SECONDARY_COLOR, color: "#1a3b34", fontWeight: 600 }} disabled={!assigneeId}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RequestDetailPage;