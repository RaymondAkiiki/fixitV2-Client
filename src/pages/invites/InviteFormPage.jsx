import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, UserPlus, Save, XCircle, Check, Building, Home, User } from 'lucide-react';
import { createInvite } from '../../services/inviteService';
import { getAllProperties } from '../../services/propertyService';
import { getUnitsForProperty } from '../../services/unitService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

// Available roles for invitation
const AVAILABLE_ROLES = [
  { value: 'tenant', label: 'Tenant', icon: <User className="w-5 h-5" /> },
  { value: 'propertymanager', label: 'Property Manager', icon: <Building className="w-5 h-5" /> },
  { value: 'landlord', label: 'Landlord', icon: <Home className="w-5 h-5" /> }
];

const InviteFormPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    role: 'tenant',
    propertyId: '',
    unitId: '',
    message: '',
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Data state
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Get base URL for navigation based on user role
  const getBaseUrl = useCallback(() => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'propertymanager') return '/pm';
    if (user?.role === 'landlord') return '/landlord';
    return '';
  }, [user]);
  
  // Load properties
  useEffect(() => {
    const fetchProperties = async () => {
      setPropertiesLoading(true);
      setError(null);
      
      try {
        const response = await getAllProperties();
        
        // Handle different response formats
        let propertyData = [];
        if (Array.isArray(response)) {
          propertyData = response;
        } else if (response?.properties) {
          propertyData = response.properties;
        } else if (response?.data) {
          propertyData = response.data;
        }
        
        setProperties(propertyData);
      } catch (err) {
        console.error('Failed to load properties:', err);
        setError('Failed to load properties. Please try again.');
      } finally {
        setPropertiesLoading(false);
      }
    };
    
    fetchProperties();
  }, []);
  
  // Load units when property is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.propertyId || formData.role !== 'tenant') {
        setUnits([]);
        return;
      }
      
      setUnitsLoading(true);
      
      try {
        const response = await getUnitsForProperty(formData.propertyId);
        
        // Handle different response formats
        let unitData = [];
        if (Array.isArray(response)) {
          unitData = response;
        } else if (response?.units) {
          unitData = response.units;
        } else if (response?.data) {
          unitData = response.data;
        }
        
        setUnits(unitData);
      } catch (err) {
        console.error('Failed to load units:', err);
        showError('Failed to load units for the selected property.');
      } finally {
        setUnitsLoading(false);
      }
    };
    
    fetchUnits();
  }, [formData.propertyId, formData.role, showError]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    // Special handling for role change
    if (name === 'role' && value !== 'tenant') {
      // If switching from tenant to another role, clear unitId
      setFormData(prev => ({
        ...prev,
        [name]: value,
        unitId: ''
      }));
    } else if (name === 'propertyId') {
      // If changing property, reset unit
      setFormData(prev => ({
        ...prev,
        [name]: value,
        unitId: ''
      }));
    } else {
      // Normal field update
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    if (!formData.propertyId) {
      errors.propertyId = 'Property is required';
    }
    
    if (formData.role === 'tenant' && !formData.unitId) {
      errors.unitId = 'Unit is required for tenant invitations';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please correct the form errors before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare payload
      const payload = {
        email: formData.email.trim(),
        roles: [formData.role], // API expects an array of roles
        propertyId: formData.propertyId,
        unitId: formData.role === 'tenant' ? formData.unitId : undefined,
        message: formData.message.trim() || undefined
      };
      
      await createInvite(payload);
      showSuccess('Invitation sent successfully');
      
      // Navigate back to invites list
      navigate(`${getBaseUrl()}/invites`);
    } catch (err) {
      console.error('Failed to send invitation:', err);
      setError('Failed to send invitation. ' + (err.response?.data?.message || err.message));
      showError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate(`${getBaseUrl()}/invites`);
  };
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <Mail className="mr-2 h-8 w-8" style={{ color: PRIMARY_COLOR }} />
          Send Invitation
        </h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          {propertiesLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter recipient's email address"
                  disabled={loading}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
              
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {AVAILABLE_ROLES.map(role => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleChange({ target: { name: 'role', value: role.value } })}
                      className={`flex items-center justify-center px-4 py-3 border ${
                        formData.role === role.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      } rounded-lg`}
                      disabled={loading}
                    >
                      <div className="flex flex-col items-center">
                        {role.icon}
                        <span className="mt-1 text-sm font-medium">{role.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {formErrors.role && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
                )}
              </div>
              
              {/* Property */}
              <div className="mb-6">
                <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  id="propertyId"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.propertyId ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  disabled={loading}
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                {formErrors.propertyId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.propertyId}</p>
                )}
              </div>
              
              {/* Unit (only for tenant role) */}
              {formData.role === 'tenant' && (
                <div className="mb-6">
                  <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="unitId"
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      formErrors.unitId ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    disabled={loading || unitsLoading || !formData.propertyId}
                  >
                    <option value="">
                      {unitsLoading 
                        ? 'Loading units...' 
                        : !formData.propertyId 
                          ? 'Select a property first'
                          : 'Select a unit'}
                    </option>
                    {units.map(unit => (
                      <option key={unit._id} value={unit._id}>
                        {unit.unitName || unit.unitIdentifier || `Unit ${unit.unitNumber || ''}`}
                      </option>
                    ))}
                  </select>
                  {formErrors.unitId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.unitId}</p>
                  )}
                </div>
              )}
              
              {/* Custom Message */}
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a personalized message to the invitation email..."
                  disabled={loading}
                ></textarea>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-lg flex items-center"
                  disabled={loading}
                >
                  <XCircle className="mr-2 h-5 w-5" /> Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" className="mr-2" /> Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" /> Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteFormPage;