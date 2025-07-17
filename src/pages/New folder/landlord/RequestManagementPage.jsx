import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import {
  getAllRequests,
  createRequest,
  updateRequest,
  assignRequest,
} from "../../services/requestService";
import { getAllProperties } from "../../services/propertyService";
import { getAllVendors } from "../../services/vendorService";
import { getAllUsers } from "../../services/userService";
import {
  PlusCircle,
  Search,
  UserPlus,
  CheckCircle,
  RefreshCcw,
  Archive,
  Eye,
} from "lucide-react";

// Branding palette
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const requestCategories = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural" },
  { value: "landscaping", label: "Landscaping" },
  { value: "other", label: "Other" },
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "pest_control", label: "Pest Control" },
  { value: "scheduled", label: "Scheduled" },
];
const requestPriorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const requestStatuses = [
  "new",
  "assigned",
  "in_progress",
  "completed",
  "verified",
  "reopened",
  "archived",
];

const showMessage = (msg, type = "info") => alert(msg);

function RequestManagementPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [internalUsers, setInternalUsers] = useState([]);

  // Filter and pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
  const [filterProperty, setFilterProperty] = useState(searchParams.get("propertyId") || "");
  const [filterSearch, setFilterSearch] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [assignedToId, setAssignedToId] = useState("");
  const [assignedToModel, setAssignedToModel] = useState("Vendor");
  const [assignError, setAssignError] = useState("");

  // Add Request Modal State
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [addRequestError, setAddRequestError] = useState("");
  const [addRequestLoading, setAddRequestLoading] = useState(false);
  const [addRequestForm, setAddRequestForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    propertyId: "",
    unitId: "",
  });
  const [addRequestFormErrors, setAddRequestFormErrors] = useState({});
  const [unitsForProperty, setUnitsForProperty] = useState([]);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const propertiesData = await getAllProperties();
      setProperties(propertiesData);
      const vendorsData = await getAllVendors();
      setVendors(vendorsData);
      const allUsers = await getAllUsers();
      const assignableRoles = [
        "propertymanager",
        "landlord",
        "admin",
        "vendor",
      ];
      setInternalUsers(allUsers.filter((user) => assignableRoles.includes(user.role)));
    } catch (err) {
      setError(
        "Failed to load initial data: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Requests fetch (filters, pagination)
  useEffect(() => {
    fetchRequests();
    const newParams = {};
    if (filterStatus) newParams.status = filterStatus;
    if (filterProperty) newParams.propertyId = filterProperty;
    if (filterSearch) newParams.search = filterSearch;
    newParams.page = currentPage;
    newParams.limit = itemsPerPage;
    setSearchParams(newParams);
    // eslint-disable-next-line
  }, [filterStatus, filterProperty, filterSearch, currentPage, itemsPerPage]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: filterStatus || undefined,
        propertyId: filterProperty || undefined,
        search: filterSearch || undefined,
        page: currentPage,
        limit: itemsPerPage,
      };
      const res = await getAllRequests(params);
      setRequests(Array.isArray(res) ? res : res.requests || []);
      setTotalRequests(res.total || 0);
    } catch (err) {
      setError(
        "Failed to fetch requests: " +
          (err.response?.data?.message || err.message)
      );
      setRequests([]);
      setTotalRequests(0);
    } finally {
      setLoading(false);
    }
  };

  // --- Add Request Modal Handlers ---
  const handleAddRequestFormChange = (e) => {
    const { name, value } = e.target;
    setAddRequestFormErrors((prev) => ({ ...prev, [name]: "" }));
    setAddRequestForm((prev) => {
      const newForm = { ...prev, [name]: value };
      if (name === "propertyId") {
        newForm.unitId = "";
        const selectedProperty = properties.find((p) => p._id === value);
        setUnitsForProperty(selectedProperty?.units || []);
      }
      return newForm;
    });
  };

  const validateAddRequestForm = () => {
    const errors = {};
    if (!addRequestForm.title.trim()) errors.title = "Title is required.";
    if (!addRequestForm.description.trim())
      errors.description = "Description is required.";
    if (!addRequestForm.category.trim())
      errors.category = "Category is required.";
    if (!addRequestForm.propertyId.trim())
      errors.propertyId = "Property is required.";
    setAddRequestFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRequestSubmit = async (e) => {
    e.preventDefault();
    setAddRequestError("");
    if (!validateAddRequestForm()) {
      showMessage("Please correct the form errors.", "error");
      return;
    }
    setAddRequestLoading(true);
    try {
      const payload = {
        title: addRequestForm.title,
        description: addRequestForm.description,
        category: addRequestForm.category,
        priority: addRequestForm.priority,
        propertyId: addRequestForm.propertyId,
        unitId: addRequestForm.unitId || null,
      };
      await createRequest(payload);
      showMessage("Request created successfully!", "success");
      setShowAddRequestModal(false);
      setAddRequestForm({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        propertyId: "",
        unitId: "",
      });
      setUnitsForProperty([]);
      fetchRequests();
    } catch (err) {
      setAddRequestError(
        "Failed to create request: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setAddRequestLoading(false);
    }
  };

  // Assignment modal handlers
  const handleOpenAssignModal = (reqId) => {
    setSelectedRequestId(reqId);
    setAssignedToId("");
    setAssignedToModel("Vendor");
    setAssignError("");
    setShowAssignModal(true);
  };
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignError("");
    if (!assignedToId) {
      setAssignError("Please select a user or vendor to assign.");
      return;
    }
    try {
      await assignRequest(selectedRequestId, { assignedToId, assignedToModel });
      showMessage(`Request assigned to ${assignedToModel} successfully!`, "success");
      setShowAssignModal(false);
      fetchRequests();
    } catch (err) {
      setAssignError(
        "Failed to assign request: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-purple-100 text-purple-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "verified":
        return "bg-teal-100 text-teal-800";
      case "reopened":
        return "bg-orange-100 text-orange-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to mark this request as "${newStatus}"?`
      )
    )
      return;
    try {
      await updateRequest(requestId, { status: newStatus });
      showMessage(
        `Request marked as ${newStatus.replace(/_/g, " ")}!`,
        "success"
      );
      fetchRequests();
    } catch (err) {
      showMessage(
        "Failed to update request status: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        Maintenance Requests
      </h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Controls and Filters */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-lg shadow-sm border"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "14" }}
      >
        <Button
          onClick={() => setShowAddRequestModal(true)}
          className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold"
          style={{ backgroundColor: PRIMARY_COLOR, color: "#fff" }}
        >
          <PlusCircle className="w-5 h-5 mr-2" /> Add New Request
        </Button>
        <div className="flex items-center gap-3">
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
            style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
          >
            <option value="">All Statuses</option>
            {requestStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            id="filterProperty"
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-3 py-2 border rounded-md"
            style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
          >
            <option value="">All Properties</option>
            {properties.map((prop) => (
              <option key={prop._id} value={prop._id}>
                {prop.name}
              </option>
            ))}
          </select>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchRequests();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              id="filterSearch"
              placeholder="Search by title/description"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="px-3 py-2 border rounded-md"
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
            />
            <Button
              type="submit"
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600,
              }}
            >
              <Search className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Requests Table */}
      <div
        className="bg-white p-6 rounded-xl shadow-lg border"
        style={{ borderColor: PRIMARY_COLOR + "14" }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
              Loading requests...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">
            No maintenance requests found matching your criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y"
              style={{ borderColor: PRIMARY_COLOR + "10" }}
            >
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Title</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Category</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Property / Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-[#f0fdfa] transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/landlord/requests/${req._id}`} className="text-indigo-600 hover:underline">
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(req.status)}`}
                      >
                        {req.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      <span
                        className={`font-semibold ${
                          req.priority === "urgent"
                            ? "text-red-600"
                            : req.priority === "high"
                            ? "text-orange-500"
                            : "text-gray-700"
                        }`}
                      >
                        {req.priority || "Medium"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {req.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {req.property?.name || "N/A"}{" "}
                      {req.unit?.unitName ? `/ ${req.unit.unitName}` : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{req.requestedBy?.name || req.requestedBy?.email || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{req.assignedTo?.name || req.assignedTo?.email || "Unassigned"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/landlord/requests/${req._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        {req.status === "new" && (
                          <Button
                            onClick={() => handleOpenAssignModal(req._id)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-md"
                            style={{ backgroundColor: "#f3e8ff" }}
                            title="Assign"
                          >
                            <UserPlus className="w-5 h-5" />
                          </Button>
                        )}
                        {(req.status === "assigned" || req.status === "in_progress") && (
                          <Button
                            onClick={() => handleUpdateStatus(req._id, "completed")}
                            className="text-green-600 hover:text-green-900 p-1 rounded-md"
                            style={{ backgroundColor: "#dcfce7" }}
                            title="Mark Completed"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </Button>
                        )}
                        {req.status === "completed" && (
                          <Button
                            onClick={() => handleUpdateStatus(req._id, "verified")}
                            className="text-teal-600 hover:text-teal-900 p-1 rounded-md"
                            style={{ backgroundColor: "#ccfbf1" }}
                            title="Mark Verified"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </Button>
                        )}
                        {(req.status === "completed" || req.status === "verified") && (
                          <Button
                            onClick={() => handleUpdateStatus(req._id, "reopened")}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded-md"
                            style={{ backgroundColor: "#fef3c7" }}
                            title="Reopen Request"
                          >
                            <RefreshCcw className="w-5 h-5" />
                          </Button>
                        )}
                        {req.status !== "archived" && (
                          <Button
                            onClick={() => handleUpdateStatus(req._id, "archived")}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md"
                            style={{ backgroundColor: "#f3f4f6" }}
                            title="Archive Request"
                          >
                            <Archive className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          totalItems={totalRequests}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add New Request Modal */}
      <Modal
        isOpen={showAddRequestModal}
        onClose={() => setShowAddRequestModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Add New Maintenance Request</span>}
      >
        <form onSubmit={handleAddRequestSubmit} className="p-4 space-y-4">
          {addRequestError && <p className="text-red-500 text-sm mb-3">{addRequestError}</p>}
          <div>
            <label htmlFor="addRequestTitle" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Title</label>
            <input
              type="text"
              id="addRequestTitle"
              name="title"
              value={addRequestForm.title}
              onChange={handleAddRequestFormChange}
              className={`mt-1 block w-full border ${addRequestFormErrors.title ? "border-red-500" : ""} rounded-md shadow-sm p-2`}
              style={{ borderColor: PRIMARY_COLOR }}
              required
              disabled={addRequestLoading}
            />
            {addRequestFormErrors.title && <p className="text-red-500 text-xs mt-1">{addRequestFormErrors.title}</p>}
          </div>
          <div>
            <label htmlFor="addRequestDescription" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Description</label>
            <textarea
              id="addRequestDescription"
              name="description"
              value={addRequestForm.description}
              onChange={handleAddRequestFormChange}
              rows="4"
              className={`mt-1 block w-full border ${addRequestFormErrors.description ? "border-red-500" : ""} rounded-md shadow-sm p-2`}
              style={{ borderColor: PRIMARY_COLOR }}
              required
              disabled={addRequestLoading}
            />
            {addRequestFormErrors.description && <p className="text-red-500 text-xs mt-1">{addRequestFormErrors.description}</p>}
          </div>
          <div>
            <label htmlFor="addRequestCategory" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Category</label>
            <select
              id="addRequestCategory"
              name="category"
              value={addRequestForm.category}
              onChange={handleAddRequestFormChange}
              className={`mt-1 block w-full border ${addRequestFormErrors.category ? "border-red-500" : ""} rounded-md shadow-sm p-2`}
              style={{ borderColor: PRIMARY_COLOR }}
              required
              disabled={addRequestLoading}
            >
              <option value="">Select Category</option>
              {requestCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {addRequestFormErrors.category && <p className="text-red-500 text-xs mt-1">{addRequestFormErrors.category}</p>}
          </div>
          <div>
            <label htmlFor="addRequestPriority" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Priority</label>
            <select
              id="addRequestPriority"
              name="priority"
              value={addRequestForm.priority}
              onChange={handleAddRequestFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              disabled={addRequestLoading}
            >
              {requestPriorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="addRequestProperty" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Property</label>
            <select
              id="addRequestProperty"
              name="propertyId"
              value={addRequestForm.propertyId}
              onChange={handleAddRequestFormChange}
              className={`mt-1 block w-full border ${addRequestFormErrors.propertyId ? "border-red-500" : ""} rounded-md shadow-sm p-2`}
              style={{ borderColor: PRIMARY_COLOR }}
              required
              disabled={addRequestLoading}
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {addRequestFormErrors.propertyId && <p className="text-red-500 text-xs mt-1">{addRequestFormErrors.propertyId}</p>}
          </div>
          <div>
            <label htmlFor="addRequestUnit" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Unit (optional)</label>
            <select
              id="addRequestUnit"
              name="unitId"
              value={addRequestForm.unitId}
              onChange={handleAddRequestFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              disabled={addRequestLoading || unitsForProperty.length === 0}
            >
              <option value="">Select Unit</option>
              {unitsForProperty.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.unitName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddRequestModal(false)} className="py-2 px-4 rounded-lg" style={{ backgroundColor: "#e4e4e7", color: PRIMARY_COLOR, fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" className="py-2 px-4 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR, color: "#fff", fontWeight: 600 }} loading={addRequestLoading} disabled={addRequestLoading}>Add Request</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Request Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Assign Request</span>}
      >
        <form onSubmit={handleAssignSubmit} className="p-4 space-y-4">
          {assignError && (
            <p className="text-red-500 text-sm mb-3">{assignError}</p>
          )}
          <p className="text-gray-700">Assign this request to a vendor or an internal user.</p>
          <div>
            <label htmlFor="assignToModel" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Assign To Type</label>
            <select
              id="assignToModel"
              name="assignedToModel"
              value={assignedToModel}
              onChange={(e) => {
                setAssignedToModel(e.target.value);
                setAssignedToId("");
              }}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            >
              <option value="Vendor">Vendor</option>
              <option value="User">Internal User</option>
            </select>
          </div>
          <div>
            <label htmlFor="assignedToId" className="block text-sm font-medium" style={{ color: PRIMARY_COLOR }}>Select {assignedToModel}</label>
            <select
              id="assignedToId"
              name="assignedToId"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            >
              <option value="">Select...</option>
              {assignedToModel === "Vendor"
                ? vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} {v.services?.length ? `(${v.services.join(", ")})` : ""}
                    </option>
                  ))
                : internalUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name || u.email} ({u.role})
                    </option>
                  ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAssignModal(false)} className="py-2 px-4 rounded-lg" style={{ backgroundColor: "#e4e4e7", color: PRIMARY_COLOR, fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" className="py-2 px-4 rounded-lg" style={{ backgroundColor: SECONDARY_COLOR, color: "#1a3b34", fontWeight: 600 }} disabled={!assignedToId}>Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RequestManagementPage;