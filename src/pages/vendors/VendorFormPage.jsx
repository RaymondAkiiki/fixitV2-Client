import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Package, Save, XCircle, Plus, Trash2 } from 'lucide-react';
import { createVendor, getVendorById, updateVendor } from '../../services/vendorService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { MAINTENANCE_CATEGORIES } from '../../utils/constants';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const VendorFormPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  
  const isEditMode = !!vendorId;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    services: [],
    address: '',
    description: '',
    active: true
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [newService, setNewService] = useState('');
  
  // Get base URL for navigation based on user role
  const getBaseUrl = useCallback(() => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'propertymanager') return '/pm';
    if (user?.role === 'landlord') return '/landlord';
    return '';
  }, [user]);
  
  // Fetch vendor data if in edit mode
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!isEditMode) {
        setInitialLoading(false);
        return;
      }
      
      setInitialLoading(true);
      setError(null);
      
      try {
        const vendorData = await getVendorById(vendorId);
        
        setFormData({
          name: vendorData.name || '',
          contactPerson: vendorData.contactPerson || '',
          phone: vendorData.phone || '',
          email: vendorData.email || '',
          services: vendorData.services || [],
          address: vendorData.address || '',
          description: vendorData.description || '',
          active: vendorData.active !== false // default to true if not explicitly false
        });
      } catch (err) {
        console.error('Failed to load vendor data:', err);
        setError('Failed to load vendor data. ' + (err.response?.data?.message || err.message));
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchVendorData();
  }, [vendorId, isEditMode]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear error for this field
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    // Update form data based on input type
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Add a new service
  const handleAddService = () => {
    // Don't add if empty
    if (!newService.trim()) return;
    
    // Format service and add to array
    const formattedService = newService.trim().toLowerCase();
    
    // Don't add duplicates
    if (formData.services.includes(formattedService)) {
      setNewService('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, formattedService]
    }));
    
    // Clear input
    setNewService('');
    
    // Clear any services errors
    setFormErrors(prev => ({ ...prev, services: '' }));
  };
  
  // Remove a service
  const handleRemoveService = (serviceToRemove) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service !== serviceToRemove)
    }));
  };
  
  // Handle service dropdown selection
  const handleServiceSelect = (e) => {
    const selectedService = e.target.value;
    if (!selectedService) return;
    
    // Format and add service
    const formattedService = selectedService.toLowerCase();
    
    // Don't add duplicates
    if (formData.services.includes(formattedService)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, formattedService]
    }));
    
    // Clear any services errors
    setFormErrors(prev => ({ ...prev, services: '' }));
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Vendor name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (formData.services.length === 0) {
      errors.services = 'At least one service is required';
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
        ...formData,
        // Ensure services are all lowercase and trimmed
        services: formData.services.map(s => s.trim().toLowerCase())
      };
      
      if (isEditMode) {
        await updateVendor(vendorId, payload);
        showSuccess('Vendor updated successfully');
      } else {
        await createVendor(payload);
        showSuccess('Vendor created successfully');
      }
      
      // Navigate back to vendors list
      navigate(`${getBaseUrl()}/vendors`);
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} vendor:`, err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} vendor. ` + (err.response?.data?.message || err.message));
      showError(`Failed to ${isEditMode ? 'update' : 'create'} vendor. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate(`${getBaseUrl()}/vendors`);
  };
  
  // Show loading state during initial data fetch
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <Package className="mr-2 h-8 w-8" style={{ color: PRIMARY_COLOR }} />
          {isEditMode ? 'Edit Vendor' : 'Add New Vendor'}
        </h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vendor Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter company or vendor name"
                  disabled={loading}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
              
              {/* Contact Person */}
              <div className="md:col-span-2">
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person (Optional)
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter contact person's name"
                  disabled={loading}
                />
              </div>
              
              {/* Email */}
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
                  className={`w-full px-3 py-2 border ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter email address"
                  disabled={loading}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter phone number"
                  disabled={loading}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>
              
              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter vendor's address"
                  disabled={loading}
                />
              </div>
              
              {/* Services */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Services <span className="text-red-500">*</span>
                </label>
                
                <div className={`p-3 border ${
                  formErrors.services ? 'border-red-500' : 'border-gray-300'
                } rounded-md bg-gray-50 mb-2`}>
                  {formData.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.services.map((service, index) => (
                        <div 
                          key={index} 
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                        >
                          <span className="capitalize">{service.replace('_', ' ')}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(service)}
                            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic mb-3">No services added yet</p>
                  )}
                  
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label htmlFor="newService" className="sr-only">Add a service</label>
                      <input
                        type="text"
                        id="newService"
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Type a service..."
                        disabled={loading}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddService();
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddService}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center"
                      disabled={loading || !newService.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                
                <div className="flex space-x-2 items-center mb-1">
                  <span className="text-sm text-gray-500">Or select from common services:</span>
                  <select
                    className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    onChange={handleServiceSelect}
                    disabled={loading}
                    value=""
                  >
                    <option value="">Select a service</option>
                    {MAINTENANCE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                {formErrors.services && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.services}</p>
                )}
              </div>
              
              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a description of services provided..."
                  disabled={loading}
                ></textarea>
              </div>
              
              {/* Active Status (Edit mode only) */}
              {isEditMode && (
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      name="active"
                      checked={formData.active}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                      This vendor is active and available for assignments
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-3">
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
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center"
                disabled={loading}
              >
                <Save className="mr-2 h-5 w-5" />
                {loading ? 'Saving...' : isEditMode ? 'Update Vendor' : 'Add Vendor'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorFormPage;