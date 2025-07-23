import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, ArrowLeft, Save, X } from 'lucide-react';
import { getUserById, createUser, updateUserById } from '../../services/userService';
import { getAllProperties } from '../../services/propertyService';
import { getUnitsForProperty } from '../../services/unitService';
import { ROUTES, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const UserFormPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  // Determine if this is an edit or add form
  const isEditMode = !!userId;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: USER_ROLES.TENANT,
    password: '',
    confirmPassword: '',
    propertyId: '',
    unitId: '',
    approved: true,
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Data for selects
  const [properties, setProperties] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  // Get base URL for navigation based on user role
  const getBaseUrl = useCallback(() => {
    if (currentUser?.role === 'admin') return '/admin';
    if (currentUser?.role === 'propertymanager') return '/pm';
    if (currentUser?.role === 'landlord') return '/landlord';
    return '';
  }, [currentUser]);

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await getAllProperties();
        const propertyList = response.properties || [];
        setProperties(propertyList);
      } catch (err) {
        console.error('Failed to load properties:', err);
        showError('Failed to load properties. Please try again.');
      }
    };
    
    fetchProperties();
  }, [showError]);

  // Load units when property changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.propertyId || formData.role !== USER_ROLES.TENANT) {
        setAvailableUnits([]);
        return;
      }
      
      setLoadingUnits(true);
      try {
        const response = await getUnitsForProperty(formData.propertyId);
        setAvailableUnits(response.units || []);
      } catch (err) {
        console.error('Failed to load units:', err);
        showError('Failed to load units for this property');
      } finally {
        setLoadingUnits(false);
      }
    };
    
    fetchUnits();
  }, [formData.propertyId, formData.role, showError]);

  // Load user data for edit mode
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isEditMode) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const userData = await getUserById(userId);
        
        // Fill form with user data, but don't include password fields for security
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role || USER_ROLES.TENANT,
          password: '',
          confirmPassword: '',
          propertyId: userData.associations?.tenancies?.[0]?.property?._id || '',
          unitId: userData.associations?.tenancies?.[0]?.unit?._id || '',
          approved: userData.approved || false,
        });
      } catch (err) {
        console.error('Failed to load user details:', err);
        setError(`Failed to load user details: ${err.message || 'An unknown error occurred'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [isEditMode, userId]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Special handling for role and propertyId to reset unitId when appropriate
    if (name === 'role' && value !== USER_ROLES.TENANT) {
      setFormData(prev => ({
        ...prev,
        [name]: newValue,
        unitId: '',
      }));
    } else if (name === 'propertyId') {
      setFormData(prev => ({
        ...prev,
        [name]: newValue,
        unitId: '', // Reset unit when property changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue,
      }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.role) errors.role = 'Role is required';
    
    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Password checks (only for new user)
    if (!isEditMode) {
      if (!formData.password) errors.password = 'Password is required';
      if (formData.password && formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password) {
      // Optional password change for existing users
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    // Property and unit checks for tenants
    if (formData.role === USER_ROLES.TENANT) {
      if (!formData.propertyId) errors.propertyId = 'Property is required for tenants';
      if (!formData.unitId) errors.unitId = 'Unit is required for tenants';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode) {
        // Update existing user
        const updates = {
          name: formData.name,
          phone: formData.phone,
          approved: formData.approved,
        };
        
        // Only include password if it's provided
        if (formData.password) {
          updates.password = formData.password;
        }
        
        // Update the user
        await updateUserById(userId, updates);
        
        showSuccess('User updated successfully');
        navigate(`${getBaseUrl()}/users/${userId}`);
      } else {
        // Create new user
        const userData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password,
          approved: formData.approved,
        };
        
        // Add property and unit for tenant
        if (formData.role === USER_ROLES.TENANT) {
          userData.propertyId = formData.propertyId;
          userData.unitId = formData.unitId;
        }
        
        // Create the user
        const response = await createUser(userData);
        
        showSuccess('User created successfully');
        navigate(`${getBaseUrl()}/users/${response._id || response.id}`);
      }
    } catch (err) {
      console.error('Failed to save user:', err);
      showError(`Failed to ${isEditMode ? 'update' : 'create'} user: ${err.message || 'An unknown error occurred'}`);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} user: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
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
        <div className="flex items-center mb-6">
          <User className="h-8 w-8 mr-3" style={{ color: PRIMARY_COLOR }} />
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditMode ? 'Edit User' : 'Add New User'}
          </h1>
        </div>
        
        {/* Form Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                    disabled={submitting}
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                    disabled={isEditMode || submitting} // Can't change email in edit mode
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                  {isEditMode && (
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  )}
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
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isEditMode || submitting} // Can't change role in edit mode
                  >
                    <option value={USER_ROLES.TENANT}>Tenant</option>
                    <option value={USER_ROLES.PROPERTY_MANAGER}>Property Manager</option>
                    <option value={USER_ROLES.LANDLORD}>Landlord</option>
                    <option value={USER_ROLES.VENDOR}>Vendor</option>
                    {currentUser?.role === USER_ROLES.ADMIN && (
                      <option value={USER_ROLES.ADMIN}>Admin</option>
                    )}
                  </select>
                  {validationErrors.role && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.role}</p>
                  )}
                  {isEditMode && (
                    <p className="mt-1 text-xs text-gray-500">Role cannot be changed</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Password Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                {isEditMode ? 'Change Password (Optional)' : 'Password'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {isEditMode ? 'New Password' : 'Password'} {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
                    disabled={submitting}
                  />
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                    disabled={submitting}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Property Assignment (for Tenants) */}
            {(formData.role === USER_ROLES.TENANT) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                  Property Assignment
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
                      Property <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="propertyId"
                      name="propertyId"
                      value={formData.propertyId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.propertyId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={submitting}
                    >
                      <option value="">Select a property</option>
                      {properties.map(property => (
                        <option key={property._id} value={property._id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.propertyId && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.propertyId}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="unitId"
                      name="unitId"
                      value={formData.unitId}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        validationErrors.unitId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={!formData.propertyId || submitting || loadingUnits}
                    >
                      <option value="">
                        {loadingUnits 
                          ? 'Loading units...' 
                          : !formData.propertyId 
                            ? 'Select a property first' 
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
                    {validationErrors.unitId && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.unitId}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="approved"
                name="approved"
                checked={formData.approved}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                disabled={submitting}
              />
              <label htmlFor="approved" className="ml-2 block text-sm text-gray-700">
                Account Approved (can login immediately)
              </label>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                onClick={() => navigate(`${getBaseUrl()}/users`)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center"
                disabled={submitting}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                disabled={submitting}
              >
                <Save className="h-4 w-4 mr-1" />
                {submitting ? 'Saving...' : 'Save User'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserFormPage;