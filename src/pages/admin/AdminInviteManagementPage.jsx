// frontend/src/pages/admin/AdminInviteManagementPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import * as inviteService from "../../services/inviteService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { ROUTES, INVITATION_STATUSES, USER_ROLES } from '../../utils/constants.js';
import { formatDate, generateInviteLink } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';
import { Mail, Clock, UserPlus, RefreshCcw, XCircle, Copy, Send, Building } from 'lucide-react';

const AdminInviteManagementPage = () => {
  const { showError, showSuccess } = useGlobalAlert();
  
  // State for invites data
  const [invites, setInvites] = useState([]);
  const [properties, setProperties] = useState([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
    propertyId: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // New invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    roles: [],
    propertyId: '',
    message: '',
  });
  const [inviteFormErrors, setInviteFormErrors] = useState({});
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controllers for API requests
  const invitesAbortController = useRef(null);
  const propertiesAbortController = useRef(null);

  // Fetch invites with filtering and pagination
  const fetchInvites = useCallback(async () => {
    // Cancel any ongoing request
    if (invitesAbortController.current) {
      invitesAbortController.current.abort();
    }
    
    // Create new abort controller
    invitesAbortController.current = new AbortController();
    const signal = invitesAbortController.current.signal;
    
    setLoading(true);
    
    try {
      // Prepare API parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        search: debouncedSearch
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0) {
          delete params[key];
        }
      });
      
      // Call the API using adminService.getAllInvites
      const response = await adminService.getAllInvites(params, signal);
      
      // Update state with response data
      setInvites(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load invites: ' + error.message);
        console.error('Error fetching invites:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, pagination.page, pagination.limit, showError]);

  // Fetch properties for filter dropdown
  const fetchProperties = useCallback(async () => {
    // Cancel any ongoing request
    if (propertiesAbortController.current) {
      propertiesAbortController.current.abort();
    }
    
    // Create new abort controller
    propertiesAbortController.current = new AbortController();
    const signal = propertiesAbortController.current.signal;
    
    setPropertiesLoading(true);
    
    try {
      const response = await adminService.getAllProperties({ limit: 100 }, signal);
      setProperties(response.data || []);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        console.error('Error fetching properties for filter:', error);
      }
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  // Handle resending an invite
  const handleResendInvite = useCallback(async (inviteId) => {
    if (!window.confirm('Are you sure you want to resend this invite?')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await adminService.resendInvite(inviteId);
      showSuccess('Invite resent successfully');
      // Refresh the list
      fetchInvites();
    } catch (error) {
      showError(`Failed to resend invite: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [fetchInvites, showError, showSuccess]);

  // Handle revoking an invite
  const handleRevokeInvite = useCallback(async (inviteId) => {
    if (!window.confirm('Are you sure you want to revoke this invite? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await adminService.revokeInvite(inviteId);
      showSuccess('Invite revoked successfully');
      // Refresh the list
      fetchInvites();
    } catch (error) {
      showError(`Failed to revoke invite: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [fetchInvites, showError, showSuccess]);

  // Handle copying invite link to clipboard
  const handleCopyInviteLink = useCallback((token) => {
    const inviteLink = generateInviteLink(token);
    navigator.clipboard.writeText(inviteLink).then(
      () => showSuccess('Invite link copied to clipboard'),
      () => showError('Failed to copy invite link')
    );
  }, [showError, showSuccess]);

  // Handle new invite form submission
  const handleCreateInvite = useCallback(async (e) => {
    e.preventDefault();
    
    // Basic validation
    const errors = {};
    if (!newInvite.email) errors.email = 'Email is required';
    if (!newInvite.roles.length) errors.roles = 'At least one role must be selected';
    
    // If selected roles include 'tenant' and property is specified, additional validation
    if (newInvite.roles.includes('tenant') && newInvite.propertyId && !newInvite.unitId) {
      errors.unitId = 'Unit is required for tenant invites';
    }
    
    setInviteFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    setActionLoading(true);
    try {
      await adminService.createInvite(newInvite);
      showSuccess('Invite created and sent successfully');
      // Reset form
      setNewInvite({
        email: '',
        roles: [],
        propertyId: '',
        message: '',
      });
      setShowInviteForm(false);
      // Refresh the list
      fetchInvites();
    } catch (error) {
      showError(`Failed to create invite: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [newInvite, fetchInvites, showError, showSuccess]);

  // Handle new invite form input changes
  const handleInviteInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvite(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (inviteFormErrors[name]) {
      setInviteFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle role selection for new invite
  const handleRoleToggle = (role) => {
    setNewInvite(prev => {
      const newRoles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles: newRoles };
    });
    // Clear roles error if any roles selected
    if (inviteFormErrors.roles) {
      setInviteFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.roles;
        return newErrors;
      });
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchProperties();
    
    return () => {
      // Clean up request on unmount
      if (propertiesAbortController.current) {
        propertiesAbortController.current.abort();
      }
    };
  }, [fetchProperties]);

  // Fetch invites when filters or pagination changes
  useEffect(() => {
    fetchInvites();
    
    return () => {
      if (invitesAbortController.current) {
        invitesAbortController.current.abort();
      }
    };
  }, [fetchInvites]);

  // Filter change handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      role: '',
      propertyId: '',
      dateFrom: '',
      dateTo: '',
    });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: INVITATION_STATUSES.PENDING, label: 'Pending' },
    { value: INVITATION_STATUSES.ACCEPTED, label: 'Accepted' },
    { value: INVITATION_STATUSES.EXPIRED, label: 'Expired' },
    { value: INVITATION_STATUSES.REVOKED, label: 'Revoked' },
    { value: INVITATION_STATUSES.DECLINED, label: 'Declined' },
  ];

  // Role options
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: USER_ROLES.TENANT, label: 'Tenant' },
    { value: USER_ROLES.LANDLORD, label: 'Landlord' },
    { value: USER_ROLES.PROPERTY_MANAGER, label: 'Property Manager' },
    { value: USER_ROLES.VENDOR, label: 'Vendor' },
  ];

  // Check if invite is expired
  const isInviteExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  // Render status badge
  const renderStatusBadge = (status, expiresAt) => {
    // If invite is expired but status is still pending, show expired
    if (status === INVITATION_STATUSES.PENDING && isInviteExpired(expiresAt)) {
      status = INVITATION_STATUSES.EXPIRED;
    }

    let badgeClass = '';
    switch (status?.toLowerCase()) {
      case INVITATION_STATUSES.ACCEPTED:
        badgeClass = 'bg-green-100 text-green-800';
        break;
      case INVITATION_STATUSES.PENDING:
        badgeClass = 'bg-yellow-100 text-yellow-800';
        break;
      case INVITATION_STATUSES.EXPIRED:
        badgeClass = 'bg-gray-100 text-gray-800';
        break;
      case INVITATION_STATUSES.REVOKED:
        badgeClass = 'bg-red-100 text-red-800';
        break;
      case INVITATION_STATUSES.DECLINED:
        badgeClass = 'bg-orange-100 text-orange-800';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
    }

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377]">
          Invitation Management
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Manage user invitations and track their status.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-end">
        <button 
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors flex items-center"
        >
          {showInviteForm ? (
            <>
              <XCircle className="w-5 h-5 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              Create New Invite
            </>
          )}
        </button>
      </div>

      {/* New Invite Form */}
      {showInviteForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#219377]">Create New Invitation</h2>
          <form onSubmit={handleCreateInvite} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={newInvite.email}
                onChange={handleInviteInputChange}
                placeholder="Enter email address"
                className={`w-full p-2 border ${inviteFormErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#219377] focus:border-[#219377]`}
              />
              {inviteFormErrors.email && <p className="mt-1 text-sm text-red-500">{inviteFormErrors.email}</p>}
            </div>
            
            {/* Roles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roles <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {Object.values(USER_ROLES).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`px-3 py-1 rounded-md border ${
                      newInvite.roles.includes(role) 
                        ? 'bg-[#219377] text-white border-[#219377]' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
              {inviteFormErrors.roles && <p className="mt-1 text-sm text-red-500">{inviteFormErrors.roles}</p>}
            </div>
            
            {/* Property (only show if certain roles are selected) */}
            {(newInvite.roles.includes(USER_ROLES.TENANT) || 
              newInvite.roles.includes(USER_ROLES.PROPERTY_MANAGER)) && (
              <div>
                <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Property {newInvite.roles.includes(USER_ROLES.TENANT) && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  value={newInvite.propertyId}
                  onChange={handleInviteInputChange}
                  className={`w-full p-2 border ${inviteFormErrors.propertyId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#219377] focus:border-[#219377]`}
                  disabled={propertiesLoading}
                >
                  <option value="">Select Property</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>{property.name}</option>
                  ))}
                </select>
                {inviteFormErrors.propertyId && <p className="mt-1 text-sm text-red-500">{inviteFormErrors.propertyId}</p>}
              </div>
            )}
            
            {/* Custom Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Custom Message (Optional)</label>
              <textarea
                id="message"
                name="message"
                value={newInvite.message}
                onChange={handleInviteInputChange}
                rows={3}
                placeholder="Enter optional message to include in the invitation email"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              />
            </div>
            
            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#219377]">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by email"
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              />
            </div>
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              id="role"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Property */}
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select
              id="propertyId"
              name="propertyId"
              value={filters.propertyId}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              disabled={propertiesLoading}
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property._id} value={property._id}>{property.name}</option>
              ))}
            </select>
          </div>
          
          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
        </div>
        
        {/* Filter Action Buttons */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleResetFilters}
            className="mr-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchInvites}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Invites Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading invitations...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invites.length > 0 ? (
                invites.map(invite => (
                  <tr key={invite._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Array.isArray(invite.roles) 
                        ? invite.roles.map(role => role.charAt(0).toUpperCase() + role.slice(1)).join(', ')
                        : invite.role || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(invite.status, invite.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.property?.name || 'N/A'}
                      {invite.property && invite.unit && (
                        <span className="block text-xs text-gray-400">Unit: {invite.unit.unitName || invite.unitId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.expiresAt)}
                      {isInviteExpired(invite.expiresAt) && invite.status === INVITATION_STATUSES.PENDING && (
                        <span className="block text-xs text-red-500">Expired</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        {/* Copy Invite Link */}
                        <button 
                          onClick={() => handleCopyInviteLink(invite.token)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Copy Invite Link"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </button>
                        
                        {/* Resend Invite (only for pending invites) */}
                        {invite.status === INVITATION_STATUSES.PENDING && !isInviteExpired(invite.expiresAt) && (
                          <button 
                            onClick={() => handleResendInvite(invite._id)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 flex items-center"
                            title="Resend Invite"
                          >
                            <RefreshCcw className="w-4 h-4 mr-1" />
                            Resend
                          </button>
                        )}
                        
                        {/* Revoke Invite (only for pending invites) */}
                        {invite.status === INVITATION_STATUSES.PENDING && !isInviteExpired(invite.expiresAt) && (
                          <button 
                            onClick={() => handleRevokeInvite(invite._id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center"
                            title="Revoke Invite"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading invitations...' : 
                      'No invitations found matching your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{invites.length}</span> of <span className="font-medium">{pagination.total}</span> invitations
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center">
                <span className="text-gray-700 mx-2">Page {pagination.page} of {pagination.pages}</span>
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInviteManagementPage;