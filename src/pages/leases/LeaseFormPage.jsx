import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLease, useLeaseMutations } from '../../hooks/useLeases';
import { useProperties } from '../../hooks/useProperties';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import Spinner from '../../components/common/Spinner';
import { USER_ROLES } from '../../utils/constants';
import { FaChevronLeft, FaSave, FaUpload, FaExclamationCircle } from 'react-icons/fa';

const LeaseFormPage = () => {
  const { id } = useParams(); // If id exists, we're editing; otherwise, creating
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  // Check if user has permission
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isPropertyManager = user?.role === USER_ROLES.PROPERTY_MANAGER;
  const isLandlord = user?.role === USER_ROLES.LANDLORD;
  const canManageLeases = isAdmin || isPropertyManager || isLandlord;
  
  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!canManageLeases) {
      showError("You don't have permission to manage leases");
      navigate('/leases');
    }
  }, [canManageLeases, navigate, showError]);
  
  // Get lease data if editing
  const { 
    data: existingLease, 
    isLoading: isLoadingLease, 
    isError: isErrorLease 
  } = useLease(id);
  
  // Get properties for dropdown
  const { properties, isLoading: isLoadingProperties } = useProperties();
  
  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    securityDeposit: '',
    currency: 'USD',
    paymentDueDay: '1',
    lateFee: '',
    gracePeriod: '5',
    terms: '',
    notes: '',
    status: 'active'
  });
  
  // UI state
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Mutations
  const { 
    createLease, 
    isCreating,
    updateLease,
    isUpdating,
    uploadDocument,
    isUploading
  } = useLeaseMutations();
  
  // Determine if form is in edit mode
  const isEditMode = !!id;
  
  // Fill form with existing data if editing
  useEffect(() => {
    if (isEditMode && existingLease) {
      // Set form data from existing lease
      setFormData({
        propertyId: existingLease.property?._id || '',
        unitId: existingLease.unit?._id || '',
        tenantId: existingLease.tenant?._id || '',
        leaseStartDate: existingLease.leaseStartDate ? new Date(existingLease.leaseStartDate).toISOString().split('T')[0] : '',
        leaseEndDate: existingLease.leaseEndDate ? new Date(existingLease.leaseEndDate).toISOString().split('T')[0] : '',
        monthlyRent: existingLease.monthlyRent || '',
        securityDeposit: existingLease.securityDeposit || '',
        currency: existingLease.currency || 'USD',
        paymentDueDay: existingLease.paymentDueDay?.toString() || '1',
        lateFee: existingLease.lateFee || '',
        gracePeriod: existingLease.gracePeriod?.toString() || '5',
        terms: existingLease.terms || '',
        notes: existingLease.notes || '',
        status: existingLease.status || 'active'
      });
      
      // Set selected property to load units
      const property = properties?.find(p => p._id === existingLease.property?._id);
      if (property) {
        setSelectedProperty(property);
      }
    }
  }, [isEditMode, existingLease, properties]);
  
  // Load units when property changes
  useEffect(() => {
    if (selectedProperty?.units) {
      setUnits(selectedProperty.units);
    } else {
      setUnits([]);
    }
  }, [selectedProperty]);
  
  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.propertyId) newErrors.propertyId = 'Property is required';
    if (!formData.unitId) newErrors.unitId = 'Unit is required';
    if (!formData.tenantId) newErrors.tenantId = 'Tenant is required';
    if (!formData.leaseStartDate) newErrors.leaseStartDate = 'Start date is required';
    if (!formData.leaseEndDate) newErrors.leaseEndDate = 'End date is required';
    if (formData.leaseEndDate && formData.leaseStartDate && new Date(formData.leaseEndDate) <= new Date(formData.leaseStartDate)) {
      newErrors.leaseEndDate = 'End date must be after start date';
    }
    if (!formData.monthlyRent) newErrors.monthlyRent = 'Monthly rent is required';
    if (formData.monthlyRent && isNaN(formData.monthlyRent)) newErrors.monthlyRent = 'Monthly rent must be a number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Update form data
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If changing property, update units
    if (name === 'propertyId') {
      const property = properties?.find(p => p._id === value);
      setSelectedProperty(property);
      
      // Reset unit selection
      setFormData(prev => ({ ...prev, unitId: '' }));
    }
  };
  
  // Handle file change
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }
    
    try {
      let leaseId = id;
      
      if (isEditMode) {
        // Update existing lease
        await updateLease({
          leaseId,
          updateData: formData
        });
        showSuccess('Lease updated successfully');
      } else {
        // Create new lease
        const response = await createLease(formData);
        leaseId = response._id;
        showSuccess('Lease created successfully');
      }
      
      // Upload document if provided
      if (documentFile) {
        await uploadDocument({
          leaseId,
          file: documentFile
        });
        showSuccess('Document uploaded successfully');
      }
      
      // Navigate to lease details
      navigate(`/leases/${leaseId}`);
    } catch (error) {
      showError('Failed to save lease: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Show loading state
  if ((isEditMode && isLoadingLease) || isLoadingProperties) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  // Show error state for editing
  if (isEditMode && isErrorLease) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          An error occurred while loading the lease. Please try again.
        </div>
        <div className="mt-4 text-center">
          <Link to="/leases" className="inline-flex items-center text-blue-600">
            <FaChevronLeft className="mr-1" /> Back to Leases
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center">
        <Link to="/leases" className="mr-4 text-blue-600 hover:text-blue-800">
          <FaChevronLeft /> Back
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Edit Lease' : 'Create New Lease'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property & Unit Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Property & Unit</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="propertyId">
                Property*
              </label>
              <select
                id="propertyId"
                name="propertyId"
                className={`w-full p-2 border rounded-md ${
                  errors.propertyId && touched.propertyId ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.propertyId}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, propertyId: true }))}
                required
              >
                <option value="">Select a property</option>
                {properties?.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {errors.propertyId && touched.propertyId && (
                <p className="text-red-500 text-sm mt-1">{errors.propertyId}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="unitId">
                Unit*
              </label>
              <select
                id="unitId"
                name="unitId"
                className={`w-full p-2 border rounded-md ${
                  errors.unitId && touched.unitId ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.unitId}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, unitId: true }))}
                disabled={!formData.propertyId}
                required
              >
                <option value="">Select a unit</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.unitName}
                  </option>
                ))}
              </select>
              {errors.unitId && touched.unitId && (
                <p className="text-red-500 text-sm mt-1">{errors.unitId}</p>
              )}
              {!formData.propertyId && (
                <p className="text-gray-500 text-sm mt-1">Please select a property first</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tenantId">
                Tenant*
              </label>
              <select
                id="tenantId"
                name="tenantId"
                className={`w-full p-2 border rounded-md ${
                  errors.tenantId && touched.tenantId ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.tenantId}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, tenantId: true }))}
                required
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
              {errors.tenantId && touched.tenantId && (
                <p className="text-red-500 text-sm mt-1">{errors.tenantId}</p>
              )}
              {!formData.propertyId && (
                <p className="text-gray-500 text-sm mt-1">Please select a property first</p>
              )}
            </div>
          </div>
          
          {/* Lease Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Lease Details</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leaseStartDate">
                  Start Date*
                </label>
                <input
                  type="date"
                  id="leaseStartDate"
                  name="leaseStartDate"
                  className={`w-full p-2 border rounded-md ${
                    errors.leaseStartDate && touched.leaseStartDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.leaseStartDate}
                  onChange={handleChange}
                  onBlur={() => setTouched(prev => ({ ...prev, leaseStartDate: true }))}
                  required
                />
                {errors.leaseStartDate && touched.leaseStartDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.leaseStartDate}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leaseEndDate">
                  End Date*
                </label>
                <input
                  type="date"
                  id="leaseEndDate"
                  name="leaseEndDate"
                  className={`w-full p-2 border rounded-md ${
                    errors.leaseEndDate && touched.leaseEndDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.leaseEndDate}
                  onChange={handleChange}
                  onBlur={() => setTouched(prev => ({ ...prev, leaseEndDate: true }))}
                  required
                />
                {errors.leaseEndDate && touched.leaseEndDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.leaseEndDate}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="monthlyRent">
                  Monthly Rent*
                </label>
                <div className="flex">
                  <select
                    id="currency"
                    name="currency"
                    className="p-2 border-t border-l border-b border-gray-300 rounded-l-md"
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">$</option>
                    <option value="EUR">€</option>
                    <option value="GBP">£</option>
                  </select>
                  <input
                    type="number"
                    id="monthlyRent"
                    name="monthlyRent"
                    className={`flex-1 p-2 border-t border-r border-b rounded-r-md ${
                      errors.monthlyRent && touched.monthlyRent ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, monthlyRent: true }))}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {errors.monthlyRent && touched.monthlyRent && (
                  <p className="text-red-500 text-sm mt-1">{errors.monthlyRent}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="securityDeposit">
                  Security Deposit
                </label>
                <div className="flex">
                  <span className="p-2 border-t border-l border-b border-gray-300 rounded-l-md bg-gray-50">
                    {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}
                  </span>
                  <input
                    type="number"
                    id="securityDeposit"
                    name="securityDeposit"
                    className="flex-1 p-2 border-t border-r border-b border-gray-300 rounded-r-md"
                    value={formData.securityDeposit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="paymentDueDay">
                  Payment Due Day
                </label>
                <select
                  id="paymentDueDay"
                  name="paymentDueDay"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.paymentDueDay}
                  onChange={handleChange}
                >
                  {[...Array(28)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lateFee">
                  Late Fee
                </label>
                <div className="flex">
                  <span className="p-2 border-t border-l border-b border-gray-300 rounded-l-md bg-gray-50">
                    {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}
                  </span>
                  <input
                    type="number"
                    id="lateFee"
                    name="lateFee"
                    className="flex-1 p-2 border-t border-r border-b border-gray-300 rounded-r-md"
                    value={formData.lateFee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="gracePeriod">
                Grace Period (days)
              </label>
              <input
                type="number"
                id="gracePeriod"
                name="gracePeriod"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.gracePeriod}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
        </div>
        
        {/* Additional Details Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="terms">
              Terms & Conditions
            </label>
            <textarea
              id="terms"
              name="terms"
              rows="4"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.terms}
              onChange={handleChange}
              placeholder="Enter lease terms and conditions..."
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter any additional notes about this lease..."
            ></textarea>
          </div>
          
          {isEditMode && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="pending_renewal">Pending Renewal</option>
              </select>
            </div>
          )}
        </div>
        
        {/* Document Upload Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Document Upload</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="documentFile">
              Lease Document
            </label>
            <div className="flex items-center">
              <input
                type="file"
                id="documentFile"
                name="documentFile"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="documentFile"
                className="cursor-pointer flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FaUpload className="mr-2" />
                {documentFile ? 'Change File' : 'Select File'}
              </label>
              {documentFile && (
                <span className="ml-3 text-sm text-gray-700">{documentFile.name}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Upload a signed lease agreement (PDF, DOC, DOCX format, max 10MB)
            </p>
          </div>
        </div>
        
        {/* Form Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          <Link
            to="/leases"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isCreating || isUpdating || isUploading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {(isCreating || isUpdating || isUploading) ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                {isEditMode ? 'Update Lease' : 'Create Lease'}
              </>
            )}
          </button>
        </div>
        
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
            <div className="flex items-center text-red-600 mb-2">
              <FaExclamationCircle className="mr-2" />
              <span className="font-medium">Please fix the following errors:</span>
            </div>
            <ul className="ml-6 list-disc text-sm text-red-600">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
};

export default LeaseFormPage;