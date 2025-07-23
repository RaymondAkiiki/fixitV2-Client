import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, XCircle, Calendar, Upload, Trash2 } from 'lucide-react';
import { createScheduledMaintenance, getScheduledMaintenanceById, updateScheduledMaintenance } from '../../services/scheduledMaintenanceService';
import { getAllProperties } from '../../services/propertyService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { MAINTENANCE_CATEGORIES } from '../../utils/constants';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const ScheduledMaintenanceFormPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  
  const isEditMode = !!taskId;
  
  // Get base URL for navigation based on user role
  const getBaseUrl = () => {
    const { role } = user || {};
    if (role === 'admin') return '/admin';
    if (role === 'propertymanager') return '/pm';
    if (role === 'landlord') return '/landlord';
    return '';
  };
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    property: '',
    unit: '',
    scheduledDate: '',
    recurring: false,
    frequency: {
      type: 'monthly',
      interval: 1
    },
    status: 'scheduled'
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [unitsForProperty, setUnitsForProperty] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaFilePreviews, setMediaFilePreviews] = useState([]);
  
  // Fetch initial data: properties and task details if editing
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      setError(null);
      
      try {
        // Fetch all properties
        const propertiesData = await getAllProperties();
        setProperties(Array.isArray(propertiesData) ? propertiesData : (propertiesData?.properties || []));
        
        // Pre-fill form data
        let initialFormData = { ...formData };
        
        // Check for query params (for pre-selected property/unit)
        const queryParams = new URLSearchParams(location.search);
        const preselectedPropertyId = queryParams.get('propertyId');
        const preselectedUnitId = queryParams.get('unitId');
        
        if (isEditMode) {
          // Fetch task data for editing
          const taskData = await getScheduledMaintenanceById(taskId);
          
          if (taskData) {
            initialFormData = {
              title: taskData.title || '',
              description: taskData.description || '',
              category: taskData.category || '',
              property: taskData.property?._id || '',
              unit: taskData.unit?._id || '',
              scheduledDate: taskData.scheduledDate ? new Date(taskData.scheduledDate).toISOString().split('T')[0] : '',
              recurring: taskData.recurring || false,
              frequency: taskData.frequency || { type: 'monthly', interval: 1 },
              status: taskData.status || 'scheduled'
            };
            
            // Set units for the selected property
            if (initialFormData.property) {
              const selectedProperty = propertiesData.find(p => p._id === initialFormData.property);
              setUnitsForProperty(selectedProperty?.units || []);
            }
          }
        } else if (preselectedPropertyId) {
          // Pre-fill from query params
          initialFormData.property = preselectedPropertyId;
          
          // Set units for the pre-selected property
          const selectedProperty = propertiesData.find(p => p._id === preselectedPropertyId);
          setUnitsForProperty(selectedProperty?.units || []);
          
          if (preselectedUnitId) {
            initialFormData.unit = preselectedUnitId;
          }
        }
        
        setFormData(initialFormData);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError('Failed to load initial data. ' + (err.response?.data?.message || err.message));
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchInitialData();
  }, [taskId, isEditMode, location.search, formData]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear the error for this field
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // Special handling for property selection (load related units)
      if (name === 'property') {
        newFormData.unit = ''; // Reset unit when property changes
        const selectedProperty = properties.find(p => p._id === value);
        setUnitsForProperty(selectedProperty?.units || []);
      }
      
      return newFormData;
    });
  };
  
  // Handle recurring schedule changes
  const handleFrequencyChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        [name]: name === 'interval' ? Number(value) : value
      }
    }));
  };
  
  // Handle file uploads
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(prev => [...prev, ...files]);
    
    // Generate previews for images
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaFilePreviews(prev => [...prev, { file: file.name, preview: e.target.result }]);
        };
        reader.readAsDataURL(file);
      } else {
        setMediaFilePreviews(prev => [...prev, { file: file.name, preview: null }]);
      }
    });
  };
  
  // Remove a file from the uploads
  const handleRemoveFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaFilePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.property) errors.property = 'Property is required';
    if (!formData.scheduledDate) errors.scheduledDate = 'Scheduled date is required';
    
    // Additional validation for recurring tasks
    if (formData.recurring && (!formData.frequency.type || !formData.frequency.interval)) {
      errors.frequency = 'Valid frequency settings are required for recurring tasks';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      showError('Please correct the form errors before submitting.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Format payload
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        property: formData.property,
        unit: formData.unit || undefined,
        scheduledDate: formData.scheduledDate,
        recurring: formData.recurring,
        frequency: formData.recurring ? formData.frequency : undefined,
        status: isEditMode ? formData.status : 'scheduled'
      };
      
      let response;
      
      if (isEditMode) {
        response = await updateScheduledMaintenance(taskId, payload, mediaFiles);
        showSuccess('Scheduled maintenance task updated successfully');
      } else {
        response = await createScheduledMaintenance(payload, mediaFiles);
        showSuccess('Scheduled maintenance task created successfully');
      }
      
      navigate(`${getBaseUrl()}/scheduled-maintenance`);
    } catch (err) {
      console.error('Failed to save task:', err);
      setError('Failed to save task: ' + (err.response?.data?.message || err.message));
      showError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancellation
  const handleCancel = () => {
    navigate(`${getBaseUrl()}/scheduled-maintenance`);
  };
  
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Calendar className="mr-2 h-8 w-8" style={{ color: PRIMARY_COLOR }} />
        {isEditMode ? 'Edit Scheduled Maintenance' : 'Schedule New Maintenance'}
      </h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter maintenance task title"
                disabled={loading}
                required
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Describe the maintenance task in detail"
                disabled={loading}
                required
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.category ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                disabled={loading}
                required
              >
                <option value="">Select a category</option>
                {MAINTENANCE_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
              )}
            </div>
            
            {/* Scheduled Date */}
            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.scheduledDate ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
                required
              />
              {formErrors.scheduledDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.scheduledDate}</p>
              )}
            </div>
            
            {/* Property */}
            <div>
              <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-1">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                id="property"
                name="property"
                value={formData.property}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.property ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                disabled={loading}
                required
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {formErrors.property && (
                <p className="mt-1 text-sm text-red-600">{formErrors.property}</p>
              )}
            </div>
            
            {/* Unit (Optional) */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit (Optional)
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || unitsForProperty.length === 0}
              >
                <option value="">Select a unit (optional)</option>
                {unitsForProperty.map(unit => (
                  <option key={unit._id} value={unit._id}>
                    {unit.unitName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status (Edit mode only) */}
            {isEditMode && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            )}
            
            {/* Recurring Toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recurring"
                  name="recurring"
                  checked={formData.recurring}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="recurring" className="ml-2 block text-sm font-medium text-gray-700">
                  This is a recurring maintenance task
                </label>
              </div>
            </div>
            
            {/* Frequency Options (Only when recurring is checked) */}
            {formData.recurring && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label htmlFor="frequencyType" className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency Type
                  </label>
                  <select
                    id="frequencyType"
                    name="type"
                    value={formData.frequency.type}
                    onChange={handleFrequencyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="frequencyInterval" className="block text-sm font-medium text-gray-700 mb-1">
                    Interval
                  </label>
                  <input
                    type="number"
                    id="frequencyInterval"
                    name="interval"
                    value={formData.frequency.interval}
                    onChange={handleFrequencyChange}
                    min="1"
                    max="52"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.frequency.type === 'daily' && 'Every X days'}
                    {formData.frequency.type === 'weekly' && 'Every X weeks'}
                    {formData.frequency.type === 'bi_weekly' && 'Every other week'}
                    {formData.frequency.type === 'monthly' && 'Every X months'}
                    {formData.frequency.type === 'quarterly' && 'Every quarter (3 months)'}
                    {formData.frequency.type === 'yearly' && 'Every X years'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Media Uploads */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach Files (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, PDF up to 10MB each
                  </p>
                </div>
              </div>
              
              {/* File preview section */}
              {mediaFilePreviews.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mediaFilePreviews.map((file, index) => (
                      <div key={index} className="relative border rounded-md overflow-hidden">
                        {file.preview ? (
                          <img src={file.preview} alt={file.file} className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-500 text-xs text-center px-2">{file.file}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center"
              disabled={loading}
            >
              <Save className="mr-2 h-5 w-5" /> 
              {loading ? 'Saving...' : isEditMode ? 'Update Task' : 'Schedule Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduledMaintenanceFormPage;