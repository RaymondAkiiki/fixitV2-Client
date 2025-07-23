import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Search, UserPlus, Filter, ChevronDown, Edit, Trash2, Mail, CheckCircle, XCircle, Check, X } from 'lucide-react';
import { getAllUsers, deleteUserById, approveUser } from '../../services/userService';
import { createInvite } from '../../services/inviteService';
import { getAllProperties } from '../../services/propertyService';
import { getUnitsForProperty } from '../../services/unitService';
import { ROUTES, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import useDebounce from '../../hooks/useDebounce';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const UserListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    propertyId: '',
    approved: '',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [properties, setProperties] = useState([]);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Invite form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'tenant',
    propertyId: '',
    unitId: ''
  });
  const [inviteFormError, setInviteFormError] = useState('');
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);

  // Get base URL for navigation based on user role
  const getBaseUrl = useCallback(() => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'propertymanager') return '/pm';
    if (user?.role === 'landlord') return '/landlord';
    return '';
  }, [user]);

  // Load properties for filtering and invites
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await getAllProperties();
        const propertyList = response.properties || [];
        setProperties(propertyList);
      } catch (err) {
        console.error('Failed to load properties:', err);
      }
    };
    
    fetchProperties();
  }, []);

  // Load units when property changes in invite form
  useEffect(() => {
    const fetchUnits = async () => {
      if (!inviteForm.propertyId || inviteForm.role !== 'tenant') {
        setAvailableUnits([]);
        return;
      }
      
      setLoadingUnits(true);
      try {
        const response = await getUnitsForProperty(inviteForm.propertyId);
        setAvailableUnits(response.units || []);
      } catch (err) {
        console.error('Failed to load units:', err);
        setInviteFormError('Could not load units for this property');
      } finally {
        setLoadingUnits(false);
      }
    };
    
    fetchUnits();
  }, [inviteForm.propertyId, inviteForm.role]);

  // Fetch users with filtering and pagination
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        ...filters,
        search: debouncedSearch,
      };
      
      const response = await getAllUsers(params);
      
      setUsers(response.data || []);
      setTotalPages(response.pages || 1);
      setTotalUsers(response.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  // Fetch users when filters or search change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, filters.page, filters.role, filters.propertyId, filters.approved, debouncedSearch]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: name !== 'page' ? 1 : prev.page // Reset to page 1 when filters change
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      role: '',
      search: '',
      propertyId: '',
      approved: '',
      page: 1,
      limit: 10
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle delete user
  const confirmDeleteUser = (userToDelete) => {
    setUserToDelete(userToDelete);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setProcessingAction(true);
    
    try {
      await deleteUserById(userToDelete._id);
      showSuccess(`User ${userToDelete.name || userToDelete.email} deleted successfully`);
      
      // Remove user from list and close modal
      setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      showError(`Failed to delete user: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle approve user
  const confirmApproveUser = (userToApprove) => {
    setUserToApprove(userToApprove);
    setShowApproveModal(true);
  };

  const handleApproveUser = async () => {
    if (!userToApprove) return;
    
    setProcessingAction(true);
    
    try {
      await approveUser(userToApprove._id);
      showSuccess(`User ${userToApprove.name || userToApprove.email} approved successfully`);
      
      // Update user in list and close modal
      setUsers(prev => prev.map(u => 
        u._id === userToApprove._id ? { ...u, approved: true } : u
      ));
      setShowApproveModal(false);
      setUserToApprove(null);
    } catch (err) {
      console.error('Failed to approve user:', err);
      showError(`Failed to approve user: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle invite form changes
  const handleInviteFormChange = (e) => {
    const { name, value } = e.target;
    
    // Reset unit selection when property or role changes
    if (name === 'propertyId' || name === 'role') {
      setInviteForm(prev => {
        const newForm = {
          ...prev,
          [name]: value
        };
        
        // Clear unitId if property changes or role is not tenant
        if (name === 'propertyId' || (name === 'role' && value !== 'tenant')) {
          newForm.unitId = '';
        }
        
        return newForm;
      });
    } else {
      setInviteForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when form changes
    setInviteFormError('');
  };

  // Handle sending invite
  const handleSendInvite = async () => {
    setInviteFormError('');
    
    // Validate required fields
    if (!inviteForm.email || !inviteForm.role) {
      setInviteFormError('Email and role are required');
      return;
    }
    
    if (!inviteForm.propertyId) {
      setInviteFormError('Please select a property');
      return;
    }
    
    if (inviteForm.role === 'tenant' && !inviteForm.unitId) {
      setInviteFormError('Unit is required for tenant invitations');
      return;
    }
    
    setProcessingAction(true);
    
    try {
      await createInvite({
        email: inviteForm.email,
        roles: [inviteForm.role],
        propertyId: inviteForm.propertyId,
        unitId: inviteForm.role === 'tenant' ? inviteForm.unitId : undefined
      });
      
      showSuccess(`Invitation sent to ${inviteForm.email} successfully`);
      
      // Reset form and close modal
      setInviteForm({
        email: '',
        role: 'tenant',
        propertyId: '',
        unitId: ''
      });
      setShowInviteModal(false);
    } catch (err) {
      console.error('Failed to send invite:', err);
      setInviteFormError(`Failed to send invite: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // User role display with icons
  const getRoleDisplay = (role) => {
    switch (role?.toLowerCase()) {
      case USER_ROLES.ADMIN:
        return { label: 'Admin', color: 'bg-purple-100 text-purple-800' };
      case USER_ROLES.PROPERTY_MANAGER:
        return { label: 'Property Manager', color: 'bg-blue-100 text-blue-800' };
      case USER_ROLES.LANDLORD:
        return { label: 'Landlord', color: 'bg-green-100 text-green-800' };
      case USER_ROLES.TENANT:
        return { label: 'Tenant', color: 'bg-orange-100 text-orange-800' };
      case USER_ROLES.VENDOR:
        return { label: 'Vendor', color: 'bg-pink-100 text-pink-800' };
      default:
        return { label: role || 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <User className="mr-2 h-8 w-8" style={{ color: PRIMARY_COLOR }} />
          User Management
        </h1>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Mail className="mr-2 h-5 w-5" /> Invite User
          </Button>
          <Button
            onClick={() => navigate(`${getBaseUrl()}/users/add`)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <UserPlus className="mr-2 h-5 w-5" /> Add User
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-700">Filters</h2>
          <button 
            onClick={resetFilters}
            className="ml-auto text-blue-600 flex items-center text-sm hover:underline"
          >
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="relative">
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="appearance-none w-full border border-gray-300 rounded-md py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value={USER_ROLES.ADMIN}>Admin</option>
                <option value={USER_ROLES.PROPERTY_MANAGER}>Property Manager</option>
                <option value={USER_ROLES.LANDLORD}>Landlord</option>
                <option value={USER_ROLES.TENANT}>Tenant</option>
                <option value={USER_ROLES.VENDOR}>Vendor</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <div className="relative">
              <select
                name="propertyId"
                value={filters.propertyId}
                onChange={handleFilterChange}
                className="appearance-none w-full border border-gray-300 rounded-md py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Properties</option>
                {properties.map(property => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="relative">
              <select
                name="approved"
                value={filters.approved}
                onChange={handleFilterChange}
                className="appearance-none w-full border border-gray-300 rounded-md py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name or email"
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={fetchUsers} className="bg-blue-600 hover:bg-blue-700 text-white">
              Try Again
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-gray-500">
              {(filters.role || filters.search || filters.propertyId || filters.approved) ? 
                "Try adjusting your filters or search terms." : 
                "No users have been added to the system yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Properties</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const roleInfo = getRoleDisplay(user.role);
                  
                  return (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.associations?.tenancies?.length > 0 ? (
                            <div>
                              {user.associations.tenancies.slice(0, 2).map((tenancy, i) => (
                                <div key={i}>
                                  {tenancy.property?.name || 'Unknown'} 
                                  {tenancy.unit && ` / ${tenancy.unit.unitName || 'Unit'}`}
                                </div>
                              ))}
                              {user.associations.tenancies.length > 2 && (
                                <div className="text-xs text-blue-600">
                                  +{user.associations.tenancies.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No properties</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`${getBaseUrl()}/users/${user._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <Link
                            to={`${getBaseUrl()}/users/edit/${user._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => confirmDeleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {!user.approved && (
                            <button
                              onClick={() => confirmApproveUser(user)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Approve User"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{users.length}</span> of{' '}
              <span className="font-medium">{totalUsers}</span> users
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className={`px-3 py-1 rounded-md ${
                  filters.page === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show pages around current page
                  let pageToShow;
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (filters.page <= 3) {
                    pageToShow = i + 1;
                  } else if (filters.page >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i;
                  } else {
                    pageToShow = filters.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageToShow}
                      onClick={() => handlePageChange(pageToShow)}
                      className={`px-3 py-1 rounded-md ${
                        pageToShow === filters.page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageToShow}
                    </Button>
                  );
                })}
              </div>
              <Button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className={`px-3 py-1 rounded-md ${
                  filters.page === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the user{' '}
            <span className="font-semibold">{userToDelete?.name || userToDelete?.email}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
              disabled={processingAction}
            >
              {processingAction ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Confirm Approval"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to approve the user{' '}
            <span className="font-semibold">{userToApprove?.name || userToApprove?.email}</span>?
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowApproveModal(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveUser}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
              disabled={processingAction}
            >
              {processingAction ? 'Approving...' : 'Approve User'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Invite User Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite New User"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Send an invitation email to add a new user to the system.
          </p>
          
          {inviteFormError && (
            <div className="mb-4 text-red-500 bg-red-50 border border-red-200 rounded-md p-3">
              {inviteFormError}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={inviteForm.email}
                onChange={handleInviteFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
                disabled={processingAction}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={inviteForm.role}
                onChange={handleInviteFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={processingAction}
                required
              >
                <option value="">Select a role</option>
                <option value={USER_ROLES.TENANT}>Tenant</option>
                <option value={USER_ROLES.PROPERTY_MANAGER}>Property Manager</option>
                <option value={USER_ROLES.LANDLORD}>Landlord</option>
                <option value={USER_ROLES.VENDOR}>Vendor</option>
                {user?.role === USER_ROLES.ADMIN && (
                  <option value={USER_ROLES.ADMIN}>Admin</option>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                name="propertyId"
                value={inviteForm.propertyId}
                onChange={handleInviteFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={processingAction}
                required
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            
            {inviteForm.role === USER_ROLES.TENANT && inviteForm.propertyId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unitId"
                  value={inviteForm.unitId}
                  onChange={handleInviteFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={processingAction || loadingUnits}
                  required
                >
                  <option value="">
                    {loadingUnits 
                      ? 'Loading units...' 
                      : availableUnits.length === 0 
                        ? 'No units available' 
                        : 'Select a unit'}
                  </option>
                  {availableUnits.map(unit => (
                    <option key={unit._id} value={unit._id}>
                      {unit.unitName || unit.unitIdentifier || `Unit ${unit.unitNumber || ''}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              onClick={() => setShowInviteModal(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              disabled={processingAction}
            >
              {processingAction ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserListPage;