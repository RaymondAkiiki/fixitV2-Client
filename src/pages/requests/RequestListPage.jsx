import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { useAuth } from "../../contexts/AuthContext";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { ROUTES, REQUEST_STATUSES, PRIORITY_LEVELS } from "../../utils/constants";

// Import service functions
import { getAllRequests, updateRequest, assignRequest } from "../../services/requestService";
import { getAllProperties } from "../../services/propertyService";
import { getAllVendors } from "../../services/vendorService";
import { getAllUsers } from "../../services/userService";

// Icons
import {
  PlusCircle, Search, UserPlus, CheckCircle, RefreshCcw, Archive, Eye, 
  Edit, Wrench
} from "lucide-react";

// Constants for styling
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const RequestListPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isPropertyManager, isLandlord, isTenant } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  // Main data states
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [internalUsers, setInternalUsers] = useState([]);

  // Filter and pagination states
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

  // Get base path for navigation based on user role
  const getBasePath = useCallback(() => {
    if (isAdmin) return ROUTES.ADMIN_BASE;
    if (isPropertyManager) return ROUTES.PM_BASE;
    if (isLandlord) return ROUTES.LANDLORD_BASE;
    if (isTenant) return ROUTES.TENANT_BASE;
    return '';
  }, [isAdmin, isPropertyManager, isLandlord, isTenant]);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const propertiesData = await getAllProperties();
      setProperties(propertiesData.properties || propertiesData);
      
      // Only load vendor and internal user data if user can assign
      if (isAdmin || isPropertyManager || isLandlord) {
        const vendorsData = await getAllVendors();
        setVendors(vendorsData.data || vendorsData);
        
        const assignableRoles = ['propertymanager', 'landlord', 'admin', 'vendor'];
        const usersData = await getAllUsers({ roles: assignableRoles });
        setInternalUsers(usersData.data || usersData);
      }
    } catch (err) {
      setError('Failed to load initial data: ' + (err.response?.data?.message || err.message));
      console.error("Initial data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch requests with filters and pagination
  useEffect(() => {
    fetchRequests();
    const newParams = {};
    if (filterStatus) newParams.status = filterStatus;
    if (filterProperty) newParams.propertyId = filterProperty;
    if (filterSearch) newParams.search = filterSearch;
    newParams.page = currentPage;
    newParams.limit = itemsPerPage;
    setSearchParams(newParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // If tenant, we only want their requests
      if (isTenant) {
        params.createdBy = user._id;
      }
      
      const response = await getAllRequests(params);
      
      setRequests(response.requests || (Array.isArray(response) ? response : []));
      setTotalRequests(response.total || 0);
    } catch (err) {
      setError('Failed to fetch requests: ' + (err.response?.data?.message || err.message));
      console.error("Requests fetch error:", err);
      setRequests([]);
      setTotalRequests(0);
    } finally {
      setLoading(false);
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
      showSuccess(`Request assigned to ${assignedToModel} successfully!`);
      setShowAssignModal(false);
      fetchRequests();
    } catch (err) {
      setAssignError(`Failed to assign request: ${err.response?.data?.message || err.message}`);
      console.error("Assign request error:", err);
    }
  };

  // Status update handler
  const handleUpdateStatus = async (requestId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this request as "${newStatus.replace(/_/g, ' ')}"?`)) return;
    try {
      await updateRequest(requestId, { status: newStatus });
      showSuccess(`Request marked as ${newStatus.replace(/_/g, " ")}!`);
      fetchRequests();
    } catch (err) {
      showError(`Failed to update request status: ${err.response?.data?.message || err.message}`);
      console.error("Status update error:", err);
    }
  };

  // Determine if user can perform various actions based on role
  const canAssign = isAdmin || isPropertyManager || isLandlord;
  const canUpdateStatus = isAdmin || isPropertyManager || isLandlord;
  const canCreate = isAdmin || isPropertyManager || isLandlord || isTenant;

  // CSS helper for status badges
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-teal-100 text-teal-800';
      case 'reopened': return 'bg-orange-100 text-orange-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-7 border-b pb-3" style={{ borderColor: PRIMARY_COLOR }}>
        <h1 className="text-3xl font-extrabold flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Wrench className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
          Maintenance Requests
        </h1>
        {canCreate && (
          <Link to={`${getBasePath()}/requests/add`}>
            <Button className="flex items-center px-5 py-2 rounded-lg shadow-md" style={{
              backgroundColor: PRIMARY_COLOR,
              color: "#fff",
              fontWeight: 600
            }}>
              <PlusCircle className="w-5 h-5 mr-2" /> Create Request
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Controls and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(REQUEST_STATUSES).map(([key, value]) => (
              <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>
            ))}
          </select>
          
          <select
            id="filterProperty"
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Properties</option>
            {properties.map(prop => (
              <option key={prop._id} value={prop._id}>{prop.name}</option>
            ))}
          </select>
          
          <form onSubmit={(e) => { e.preventDefault(); fetchRequests(); }} className="flex items-center gap-2">
            <input
              type="text"
              id="filterSearch"
              placeholder="Search by title/description"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg">
              <Search className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">No maintenance requests found matching your criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`${getBasePath()}/requests/${req._id}`} className="text-indigo-600 hover:underline">
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(req.status)}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      <span className={`font-semibold ${
                        req.priority === 'urgent' ? 'text-red-600' :
                        req.priority === 'high' ? 'text-orange-500' :
                        'text-gray-700'
                      }`}>
                        {req.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{req.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.property?.name || 'N/A'} {req.unit?.unitName ? `/ ${req.unit.unitName}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.createdBy?.firstName ? `${req.createdBy.firstName} ${req.createdBy.lastName || ''}` : req.createdBy?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.assignedTo?.name || req.assignedTo?.firstName ? 
                        `${req.assignedTo.name || `${req.assignedTo.firstName} ${req.assignedTo.lastName || ''}`}` : 
                        'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* View Details */}
                        <Link to={`${getBasePath()}/requests/${req._id}`} className="text-indigo-600 hover:text-indigo-900" title="View Details">
                          <Eye className="w-5 h-5" />
                        </Link>
                        
                        {/* Edit */}
                        {(isAdmin || isPropertyManager || isLandlord || (isTenant && req.createdBy?._id === user._id)) && (
                          <Link to={`${getBasePath()}/requests/edit/${req._id}`} className="text-blue-600 hover:text-blue-900" title="Edit Request">
                            <Edit className="w-5 h-5" />
                          </Link>
                        )}
                        
                        {/* Assign - only for appropriate roles and status */}
                        {canAssign && req.status === 'new' && (
                          <Button 
                            onClick={() => handleOpenAssignModal(req._id)} 
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-md" 
                            style={{ backgroundColor: "#f3e8ff" }}
                            title="Assign"
                          >
                            <UserPlus className="w-5 h-5" />
                          </Button>
                        )}
                        
                        {/* Status Management Actions */}
                        {canUpdateStatus && (
                          <>
                            {/* Mark Completed */}
                            {(req.status === 'assigned' || req.status === 'in_progress') && (
                              <Button 
                                onClick={() => handleUpdateStatus(req._id, 'completed')} 
                                className="text-green-600 hover:text-green-900 p-1 rounded-md" 
                                style={{ backgroundColor: "#dcfce7" }}
                                title="Mark Completed"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </Button>
                            )}
                            
                            {/* Mark Verified */}
                            {req.status === 'completed' && (
                              <Button 
                                onClick={() => handleUpdateStatus(req._id, 'verified')} 
                                className="text-teal-600 hover:text-teal-900 p-1 rounded-md" 
                                style={{ backgroundColor: "#ccfbf1" }}
                                title="Mark Verified"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </Button>
                            )}
                            
                            {/* Reopen */}
                            {(req.status === 'completed' || req.status === 'verified') && (
                              <Button 
                                onClick={() => handleUpdateStatus(req._id, 'reopened')} 
                                className="text-orange-600 hover:text-orange-900 p-1 rounded-md" 
                                style={{ backgroundColor: "#fef3c7" }}
                                title="Reopen Request"
                              >
                                <RefreshCcw className="w-5 h-5" />
                              </Button>
                            )}
                            
                            {/* Archive */}
                            {req.status !== 'archived' && (
                              <Button 
                                onClick={() => handleUpdateStatus(req._id, 'archived')} 
                                className="text-gray-600 hover:text-gray-900 p-1 rounded-md" 
                                style={{ backgroundColor: "#f3f4f6" }}
                                title="Archive Request"
                              >
                                <Archive className="w-5 h-5" />
                              </Button>
                            )}
                          </>
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

      {/* Assign Request Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Request"
      >
        <form onSubmit={handleAssignSubmit} className="p-4 space-y-4">
          {assignError && <p className="text-red-500 text-sm mb-3">{assignError}</p>}
          <p className="text-gray-700">Assign this request to a vendor or an internal user.</p>
          <div>
            <label htmlFor="assignToModel" className="block text-sm font-medium text-gray-700">Assign To Type</label>
            <select
              id="assignToModel"
              name="assignedToModel"
              value={assignedToModel}
              onChange={(e) => {
                setAssignedToModel(e.target.value);
                setAssignedToId('');
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="Vendor">Vendor</option>
              <option value="User">Internal User</option>
            </select>
          </div>
          <div>
            <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">Select {assignedToModel}</label>
            <select
              id="assignedToId"
              name="assignedToId"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Select...</option>
              {assignedToModel === 'Vendor' ? (
                vendors.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.name} {v.services?.length ? `(${v.services.join(", ")})` : ""}
                  </option>
                ))
              ) : (
                internalUsers.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email} ({u.role})
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAssignModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg" disabled={!assignedToId}>Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RequestListPage;