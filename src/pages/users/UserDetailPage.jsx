import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, Building2, Home, Calendar, Edit, Trash2, Check, X,
  UserPlus, CheckCircle, XCircle, ArrowLeft
} from 'lucide-react';
import { getUserById, updateUserById, deleteUserById, approveUser } from '../../services/userService';
import { assignUserToProperty, removeUserFromProperty } from '../../services/propertyService';
import { assignTenantToUnit, removeTenantFromUnit } from '../../services/unitService';
import { getAllProperties } from '../../services/propertyService';
import { getUnitsForProperty } from '../../services/unitService';
import { ROUTES, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Action states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Property and unit assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [properties, setProperties] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    propertyId: '',
    unitId: '',
    role: USER_ROLES.TENANT,
  });
  const [assignmentError, setAssignmentError] = useState('');
  
  // Unit removal
  const [showRemoveUnitModal, setShowRemoveUnitModal] = useState(false);
  const [unitToRemove, setUnitToRemove] = useState(null);
  
  // Get base URL for navigation based on user role
  const getBaseUrl = useCallback(() => {
    if (currentUser?.role === 'admin') return '/admin';
    if (currentUser?.role === 'propertymanager') return '/pm';
    if (currentUser?.role === 'landlord') return '/landlord';
    return '';
  }, [currentUser]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await getUserById(userId);
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });
    } catch (err) {
      console.error('Failed to load user details:', err);
      setError(`Failed to load user details: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Load properties for assignments
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

  // Load units when property changes in assignment form
  useEffect(() => {
    const fetchUnits = async () => {
      if (!assignmentForm.propertyId || assignmentForm.role !== USER_ROLES.TENANT) {
        setAvailableUnits([]);
        return;
      }
      
      setLoadingUnits(true);
      try {
        const response = await getUnitsForProperty(assignmentForm.propertyId);
        setAvailableUnits(response.units || []);
      } catch (err) {
        console.error('Failed to load units:', err);
        setAssignmentError('Could not load units for this property');
      } finally {
        setLoadingUnits(false);
      }
    };
    
    fetchUnits();
  }, [assignmentForm.propertyId, assignmentForm.role]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle save user details
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setProcessingAction(true);
    
    try {
      // For simplicity, we're not allowing email changes
      const updates = {
        name: formData.name,
        phone: formData.phone,
      };
      
      const updatedUser = await updateUserById(userId, updates);
      setUser(updatedUser);
      setIsEditing(false);
      showSuccess('User details updated successfully');
    } catch (err) {
      console.error('Failed to update user:', err);
      showError(`Failed to update user: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    setProcessingAction(true);
    
    try {
      await deleteUserById(userId);
      showSuccess('User deleted successfully');
      navigate(`${getBaseUrl()}/users`);
    } catch (err) {
      console.error('Failed to delete user:', err);
      showError(`Failed to delete user: ${err.message || 'An unknown error occurred'}`);
      setShowDeleteModal(false);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle approve user
  const handleApproveUser = async () => {
    setProcessingAction(true);
    
    try {
      const updatedUser = await approveUser(userId);
      setUser(updatedUser);
      showSuccess('User approved successfully');
      setShowApproveModal(false);
    } catch (err) {
      console.error('Failed to approve user:', err);
      showError(`Failed to approve user: ${err.message || 'An unknown error occurred'}`);
      setShowApproveModal(false);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle assignment form changes
  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    
    // Reset unit selection when property or role changes
    if (name === 'propertyId' || name === 'role') {
      setAssignmentForm(prev => ({
        ...prev,
        [name]: value,
        // Fix: Use a single unitId property with conditional logic
        unitId: (name === 'propertyId' || (name === 'role' && value !== USER_ROLES.TENANT)) ? '' : prev.unitId
      }));
    } else {
      setAssignmentForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when form changes
    setAssignmentError('');
  };

  // Handle assigning user to property/unit
  const handleAssignUser = async () => {
    setAssignmentError('');
    
    // Validate required fields
    if (!assignmentForm.propertyId) {
      setAssignmentError('Please select a property');
      return;
    }
    
    if (assignmentForm.role === USER_ROLES.TENANT && !assignmentForm.unitId) {
      setAssignmentError('Unit is required for tenant assignments');
      return;
    }
    
    setProcessingAction(true);
    
    try {
      if (assignmentForm.role === USER_ROLES.TENANT) {
        // Assign tenant to specific unit
        await assignTenantToUnit(
          assignmentForm.propertyId,
          assignmentForm.unitId,
          userId
        );
      } else {
        // Assign user to property with role
        await assignUserToProperty(
          assignmentForm.propertyId,
          userId,
          [assignmentForm.role]
        );
      }
      
      // Refresh user data to show new assignments
      await fetchUserData();
      
      showSuccess(`User assigned to ${assignmentForm.role === USER_ROLES.TENANT ? 'unit' : 'property'} successfully`);
      setShowAssignModal(false);
      
      // Reset form
      setAssignmentForm({
        propertyId: '',
        unitId: '',
        role: USER_ROLES.TENANT,
      });
    } catch (err) {
      console.error('Failed to assign user:', err);
      setAssignmentError(`Failed to assign user: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle removing tenant from unit
  const confirmRemoveFromUnit = (tenancy) => {
    setUnitToRemove({
      propertyId: tenancy.property._id,
      unitId: tenancy.unit._id,
      propertyName: tenancy.property.name,
      unitName: tenancy.unit.unitName || tenancy.unit.unitIdentifier || 'this unit',
    });
    setShowRemoveUnitModal(true);
  };

  const handleRemoveFromUnit = async () => {
    if (!unitToRemove) return;
    
    setProcessingAction(true);
    
    try {
      await removeTenantFromUnit(
        unitToRemove.propertyId,
        unitToRemove.unitId,
        userId
      );
      
      // Refresh user data to show updated assignments
      await fetchUserData();
      
      showSuccess(`User removed from unit successfully`);
      setShowRemoveUnitModal(false);
      setUnitToRemove(null);
    } catch (err) {
      console.error('Failed to remove user from unit:', err);
      showError(`Failed to remove user from unit: ${err.message || 'An unknown error occurred'}`);
      setShowRemoveUnitModal(false);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle removing user from property role
  const handleRemoveFromProperty = async (propertyId, role) => {
    if (!window.confirm(`Are you sure you want to remove this user's ${role} role from this property?`)) {
      return;
    }
    
    try {
      await removeUserFromProperty(
        propertyId,
        userId,
        [role]
      );
      
      // Refresh user data to show updated assignments
      await fetchUserData();
      
      showSuccess(`User's ${role} role removed from property successfully`);
    } catch (err) {
      console.error('Failed to remove user role:', err);
      showError(`Failed to remove user role: ${err.message || 'An unknown error occurred'}`);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex space-x-4">
            <Button
              onClick={() => navigate(`${getBaseUrl()}/users`)}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Go Back to Users
            </Button>
            <Button
              onClick={fetchUserData}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">User Not Found</h1>
          <p className="text-gray-700 mb-6">The requested user could not be found.</p>
          <Button
            onClick={() => navigate(`${getBaseUrl()}/users`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleDisplay(user.role);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            to={`${getBaseUrl()}/users`} 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
          </Link>
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <User className="h-10 w-10 mr-3" style={{ color: PRIMARY_COLOR }} />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{user.name || 'Unnamed User'}</h1>
              <div className="flex items-center mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
                {user.approved ? (
                  <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Pending
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            {!user.approved && (
              <Button
                onClick={() => setShowApproveModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center"
              >
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
            )}
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center"
              disabled={isEditing}
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
        
        {/* User Information */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">User Information</h2>
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter name"
                  disabled={processingAction}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm cursor-not-allowed"
                  placeholder="Enter email"
                  disabled={true}
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                  disabled={processingAction}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                  disabled={processingAction}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  disabled={processingAction}
                >
                  {processingAction ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <User className="h-5 w-5 mr-2 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{user.name || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-2 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-2 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-gray-900">{user.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-2 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <p className="text-gray-900">{formatDate(user.createdAt) || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Property Associations */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Property Associations</h2>
            <Button
              onClick={() => setShowAssignModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center text-sm"
            >
              <UserPlus className="h-4 w-4 mr-1" /> Assign to Property
            </Button>
          </div>
          
          {user.associations?.tenancies?.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Tenant Assignments</h3>
              <div className="overflow-hidden rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.associations.tenancies.map((tenancy, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tenancy.property?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {tenancy.unit?.unitName || tenancy.unit?.unitIdentifier || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tenancy.assignedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            onClick={() => confirmRemoveFromUnit(tenancy)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {user.role === USER_ROLES.TENANT ? 
                'This tenant is not assigned to any properties or units.' : 
                'This user has no tenant assignments.'}
            </p>
          )}
          
          {/* Other Roles */}
          {(user.associations?.landlord?.length > 0 || user.associations?.propertyManager?.length > 0) && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Management Roles</h3>
              <div className="overflow-hidden rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.associations?.landlord?.map((association, index) => (
                      <tr key={`landlord-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {association.property?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Landlord
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(association.assignedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            onClick={() => handleRemoveFromProperty(association.property._id, USER_ROLES.LANDLORD)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                    
                    {user.associations?.propertyManager?.map((association, index) => (
                      <tr key={`pm-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {association.property?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Property Manager
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(association.assignedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            onClick={() => handleRemoveFromProperty(association.property._id, USER_ROLES.PROPERTY_MANAGER)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* No Management Roles */}
          {user.associations?.landlord?.length === 0 && user.associations?.propertyManager?.length === 0 && 
            user.role !== USER_ROLES.TENANT && (
            <div className="mt-6">
              <p className="text-gray-500 italic">
                This user is not assigned as a manager to any properties.
              </p>
            </div>
          )}
        </div>
        
        {/* Modals */}
        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirm Deletion"
        >
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the user{' '}
              <span className="font-semibold">{user.name || user.email}</span>?
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
              <span className="font-semibold">{user.name || user.email}</span>?
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
        
        {/* Assignment Modal */}
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title="Assign to Property"
        >
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Assign <span className="font-semibold">{user.name || user.email}</span> to a property with a specific role.
            </p>
            
            {assignmentError && (
              <div className="mb-4 text-red-500 bg-red-50 border border-red-200 rounded-md p-3">
                {assignmentError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={assignmentForm.role}
                  onChange={handleAssignmentChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={processingAction}
                  required
                >
                  <option value={USER_ROLES.TENANT}>Tenant</option>
                  <option value={USER_ROLES.PROPERTY_MANAGER}>Property Manager</option>
                  <option value={USER_ROLES.LANDLORD}>Landlord</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  name="propertyId"
                  value={assignmentForm.propertyId}
                  onChange={handleAssignmentChange}
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
              
              {assignmentForm.role === USER_ROLES.TENANT && assignmentForm.propertyId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unitId"
                    value={assignmentForm.unitId}
                    onChange={handleAssignmentChange}
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
                onClick={() => setShowAssignModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignUser}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                disabled={processingAction}
              >
                {processingAction ? 'Assigning...' : 'Assign User'}
              </Button>
            </div>
          </div>
        </Modal>
        
        {/* Remove Unit Modal */}
        <Modal
          isOpen={showRemoveUnitModal}
          onClose={() => setShowRemoveUnitModal(false)}
          title="Confirm Removal from Unit"
        >
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to remove <span className="font-semibold">{user.name || user.email}</span> from{' '}
              <span className="font-semibold">{unitToRemove?.unitName}</span> in{' '}
              <span className="font-semibold">{unitToRemove?.propertyName}</span>?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowRemoveUnitModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveFromUnit}
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
                disabled={processingAction}
              >
                {processingAction ? 'Removing...' : 'Remove from Unit'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UserDetailPage;