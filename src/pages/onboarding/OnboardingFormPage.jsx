import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as onboardingService from '../../services/onboardingService';
import * as propertyService from '../../services/propertyService';
import * as userService from '../../services/userService';
import { validateFiles, fileListToArray } from '../../utils/fileUploadUtils';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import Spinner from '../../components/common/Spinner';
import { FaArrowLeft, FaSave, FaTrash, FaUpload, FaEye, FaFile } from 'react-icons/fa';

export default function OnboardingFormPage() {
  const { documentId } = useParams();
  const isEditMode = !!documentId;
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('guidelines');
  const [visibility, setVisibility] = useState('all_tenants');
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Dropdown options
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileError, setFileError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Fetch existing document data if in edit mode
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!isEditMode) return;
      
      setLoading(true);
      try {
        const document = await onboardingService.getOnboardingById(documentId);
        
        // Populate form with document data
        setTitle(document.title || '');
        setDescription(document.description || '');
        setCategory(document.category || 'guidelines');
        setVisibility(document.visibility || 'all_tenants');
        setPropertyId(document.property?._id || '');
        setUnitId(document.unit?._id || '');
        setTenantId(document.tenant?._id || '');
        setFileName(document.fileName || '');
        setPreviewUrl(document.mediaUrl || '');
      } catch (error) {
        console.error('Error fetching document:', error);
        showError(error.message || 'Failed to load document data');
        navigate('/onboarding');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentData();
  }, [documentId, isEditMode, navigate, showError]);
  
  // Fetch properties for dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyService.getAllProperties();
        setProperties(response.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    
    fetchProperties();
  }, []);
  
  // Fetch units when property is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (!propertyId) {
        setUnits([]);
        setUnitId('');
        return;
      }
      
      try {
        const response = await propertyService.getPropertyById(propertyId);
        if (response && response.units) {
          setUnits(response.units);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };
    
    fetchUnits();
  }, [propertyId]);
  
  // Fetch tenants when visibility is set to specific tenant
  useEffect(() => {
    const fetchTenants = async () => {
      if (visibility !== 'specific_tenant') {
        setTenants([]);
        setTenantId('');
        return;
      }
      
      try {
        const params = { role: USER_ROLES.TENANT };
        if (propertyId) params.propertyId = propertyId;
        
        const response = await userService.getAllUsers(params);
        setTenants(response.data || []);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      }
    };
    
    fetchTenants();
  }, [visibility, propertyId]);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    
    // Validate file type and size
    const { isValid, message } = validateFiles(
      [selectedFile], 
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 
      10 // 10MB max
    );
    
    if (!isValid) {
      setFileError(message);
      return;
    }
    
    setFileError('');
    setDocumentFile(selectedFile);
    setFileName(selectedFile.name);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      showError('Please enter a title for the document');
      return;
    }
    
    if (!isEditMode && !documentFile) {
      showError('Please select a document file to upload');
      return;
    }
    
    if (visibility === 'property_tenants' && !propertyId) {
      showError('Please select a property for property-specific visibility');
      return;
    }
    
    if (visibility === 'unit_tenants' && (!propertyId || !unitId)) {
      showError('Please select both property and unit for unit-specific visibility');
      return;
    }
    
    if (visibility === 'specific_tenant' && !tenantId) {
      showError('Please select a tenant for tenant-specific visibility');
      return;
    }
    
    setSaving(true);
    
    try {
      const documentData = {
        title,
        description,
        category,
        visibility,
        ...(propertyId && { propertyId }),
        ...(unitId && { unitId }),
        ...(tenantId && { tenantId }),
        ...(documentFile && { documentFile })
      };
      
      if (isEditMode) {
        await onboardingService.updateOnboarding(documentId, documentData);
        showSuccess('Document updated successfully');
      } else {
        await onboardingService.createOnboarding(documentData);
        showSuccess('Document created successfully');
      }
      
      navigate('/onboarding');
    } catch (error) {
      console.error('Error saving document:', error);
      showError(error.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle document preview
  const handlePreview = useCallback(async () => {
    if (!documentId) return;
    
    try {
      const downloadInfo = await onboardingService.getOnboardingDocumentDownloadInfo(documentId);
      window.open(downloadInfo.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error previewing document:', error);
      showError('Failed to preview document');
    }
  }, [documentId, showError]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
        <span className="ml-2">Loading document data...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/onboarding" className="mr-4 text-blue-600">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Onboarding Document' : 'Create Onboarding Document'}
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* Title field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
                Document Title*
              </label>
              <input
                id="title"
                type="text"
                className="w-full p-2 border rounded-md"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            {/* Description field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="w-full p-2 border rounded-md"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            {/* Category selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
                Category*
              </label>
              <select
                id="category"
                className="w-full p-2 border rounded-md"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="guidelines">Guidelines</option>
                <option value="policy">Policy Document</option>
                <option value="sop">Standard Operating Procedure</option>
                <option value="training">Training Material</option>
                <option value="welcome">Welcome Package</option>
              </select>
            </div>
            
            {/* Visibility selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="visibility">
                Visibility*
              </label>
              <select
                id="visibility"
                className="w-full p-2 border rounded-md"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                required
              >
                <option value="all_tenants">All Tenants</option>
                <option value="property_tenants">Property-Specific Tenants</option>
                <option value="unit_tenants">Unit-Specific Tenants</option>
                <option value="specific_tenant">Specific Tenant</option>
              </select>
            </div>
            
            {/* Property selection (conditional) */}
            {(visibility === 'property_tenants' || visibility === 'unit_tenants') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="propertyId">
                  Property*
                </label>
                <select
                  id="propertyId"
                  className="w-full p-2 border rounded-md"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Unit selection (conditional) */}
            {visibility === 'unit_tenants' && propertyId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="unitId">
                  Unit*
                </label>
                <select
                  id="unitId"
                  className="w-full p-2 border rounded-md"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                >
                  <option value="">Select a unit</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.unitName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Tenant selection (conditional) */}
            {visibility === 'specific_tenant' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tenantId">
                  Tenant*
                </label>
                <select
                  id="tenantId"
                  className="w-full p-2 border rounded-md"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                >
                  <option value="">Select a tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.firstName} {tenant.lastName} ({tenant.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* File upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document File {!isEditMode && '*'}
              </label>
              
              {isEditMode && fileName && (
                <div className="flex items-center mb-2 p-2 bg-gray-50 rounded-md">
                  <FaFile className="text-blue-500 mr-2" />
                  <span className="flex-1 truncate">{fileName}</span>
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="text-blue-600 hover:text-blue-800 ml-2"
                    title="Preview document"
                  >
                    <FaEye />
                  </button>
                </div>
              )}
              
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="documentFile"
                  className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  <FaUpload className="inline mr-2" />
                  {isEditMode ? 'Replace Document' : 'Select Document'}
                </label>
                <input
                  id="documentFile"
                  name="documentFile"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                />
                <span className="ml-3 text-sm text-gray-500">
                  {documentFile ? documentFile.name : 'No file selected'}
                </span>
              </div>
              
              {fileError && (
                <p className="mt-2 text-sm text-red-600">{fileError}</p>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                Accept PDF, Word (.doc, .docx) files up to 10MB
              </p>
            </div>
            
            {/* Form actions */}
            <div className="flex justify-between mt-8">
              <Link
                to="/onboarding"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center px-4 py-2 rounded-md ${
                  saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {isEditMode ? 'Update Document' : 'Create Document'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}