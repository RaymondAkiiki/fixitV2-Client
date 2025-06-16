// frontend/src/pages/landlord/CreateEditRequestPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/common/Button";
import { Wrench, Save, XCircle, UploadCloud, PlusCircle } from "lucide-react";

// Import updated service functions
import { createRequest, getRequestById, updateRequest, uploadRequestMedia, deleteRequestMedia } from "../../services/requestService";
import { getAllProperties } from "../../services/propertyService"; // To select property/unit

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

// Request Categories and Priorities (lowercase to match backend enum)
const requestCategories = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'appliance', label: 'Appliance' },
    { value: 'structural', label: 'Structural' },
    { value: 'landscaping', label: 'Landscaping' },
    { value: 'other', label: 'Other' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'security', label: 'Security' },
    { value: 'pest_control', label: 'Pest Control' },
    { value: 'scheduled', label: 'Scheduled' },
];

const requestPriorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

/**
 * CreateEditRequestPage allows Property Managers to create new requests or
 * comprehensively edit existing ones.
 */
function CreateEditRequestPage() {
  const { requestId } = useParams(); // Will be undefined for creation, string for editing
  const navigate = useNavigate();
  const location = useLocation(); // To get query params for pre-selecting property/unit
  const isEditMode = !!requestId;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium", // Default priority
    propertyId: "",
    unitId: "",
    mediaFiles: [], // For new uploads
    existingMedia: [], // URLs of existing media
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [unitsForProperty, setUnitsForProperty] = useState([]); // Units of currently selected property

  // Fetch initial data (properties) and request data if in edit mode
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const propertiesData = await getAllProperties();
        setProperties(propertiesData);

        // Pre-populate property/unit from URL query params if creating
        const queryParams = new URLSearchParams(location.search);
        const preselectedPropertyId = queryParams.get('propertyId');
        const preselectedUnitId = queryParams.get('unitId');

        let initialFormData = { ...formData };

        if (isEditMode) {
          const requestData = await getRequestById(requestId);
          initialFormData = {
            title: requestData.title || "",
            description: requestData.description || "",
            category: requestData.category || "",
            priority: requestData.priority || "medium",
            propertyId: requestData.property?._id || "",
            unitId: requestData.unit?._id || "",
            existingMedia: requestData.media || [],
            mediaFiles: [], // Clear new media uploads
          };
          // Set units for the property selected in the request
          if (initialFormData.propertyId) {
            const selectedProp = propertiesData.find(p => p._id === initialFormData.propertyId);
            setUnitsForProperty(selectedProp?.units || []);
          }
        } else if (preselectedPropertyId) {
            initialFormData.propertyId = preselectedPropertyId;
            const selectedProp = propertiesData.find(p => p._id === preselectedPropertyId);
            setUnitsForProperty(selectedProp?.units || []);
            if (preselectedUnitId) {
                initialFormData.unitId = preselectedUnitId;
            }
        }
        setFormData(initialFormData);

      } catch (err) {
        setError("Failed to load initial data. " + (err.response?.data?.message || err.message));
        console.error("Initial data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [requestId, isEditMode, location.search]); // Depend on location.search for query params


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change

    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      // If property changes, reset unitId and update unitsForProperty
      if (name === 'propertyId') {
        newFormData.unitId = "";
        const selectedProperty = properties.find(p => p._id === value);
        setUnitsForProperty(selectedProperty?.units || []);
      }
      return newFormData;
    });
  };

  const handleFileChange = (e) => {
    setFormErrors(prev => ({ ...prev, mediaFiles: '' }));
    setFormData(prev => ({
      ...prev,
      mediaFiles: Array.from(e.target.files)
    }));
  };

  const handleDeleteExistingMedia = async (mediaUrlToDelete) => {
    if (window.confirm("Are you sure you want to delete this media file?")) {
        setLoading(true);
        setError(null);
        try {
            await deleteRequestMedia(requestId, mediaUrlToDelete);
            showMessage("Media file deleted successfully!", 'success');
            setFormData(prev => ({
                ...prev,
                existingMedia: prev.existingMedia.filter(url => url !== mediaUrlToDelete)
            }));
        } catch (err) {
            setError("Failed to delete media. " + (err.response?.data?.message || err.message));
            showMessage("Failed to delete media.", 'error');
            console.error("Delete media error:", err);
        } finally {
            setLoading(false);
        }
    }
  };


  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required.";
    if (!formData.description.trim()) errors.description = "Description is required.";
    if (!formData.category.trim()) errors.category = "Category is required.";
    if (!formData.propertyId.trim()) errors.propertyId = "Property is required.";
    // unitId is optional for requests that apply to a property, not a specific unit
    // if (!formData.unitId.trim()) errors.unitId = "Unit is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) {
      showMessage("Please correct the form errors.", 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        propertyId: formData.propertyId,
        unitId: formData.unitId || null, // Ensure null if empty
        media: formData.existingMedia, // Pass existing media URLs back
      };

      if (isEditMode) {
        // For updates, send the text fields and then handle new media separately
        await updateRequest(requestId, payload);
        if (formData.mediaFiles.length > 0) {
            await uploadRequestMedia(requestId, formData.mediaFiles);
        }
        showMessage("Request updated successfully!", 'success');
      } else {
        // For creation, send all in one multipart form data
        await createRequest(payload, formData.mediaFiles);
        showMessage("Request created successfully!", 'success');
      }
      navigate('/landlord/requests'); // Redirect to requests list after success
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to ${isEditMode ? 'update' : 'create'} request: ${msg}`);
      showMessage(`Failed to ${isEditMode ? 'update' : 'create'} request: ${msg}`, 'error');
      console.error(`${isEditMode ? 'Update' : 'Create'} request error:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) { // Only show loading overlay for edit mode initial fetch
    return (
      
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Loading request data...</p>
      </div>
      
    );
  }


  return (
  
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
        <Wrench className="w-8 h-8 mr-3 text-green-700" />
        {isEditMode ? 'Edit Service Request' : 'Create New Service Request'}
      </h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>}

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              required
              disabled={loading}
            />
            {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className={`w-full px-4 py-2 border ${formErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y`}
              required
              disabled={loading}
            ></textarea>
            {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category:</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${formErrors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 capitalize`}
                required
                disabled={loading}
              >
                <option value="">Select Category</option>
                {requestCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority:</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 capitalize"
                disabled={loading}
              >
                {requestPriorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">Property:</label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${formErrors.propertyId ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
                disabled={loading}
              >
                <option value="">Select Property</option>
                {properties.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {formErrors.propertyId && <p className="text-red-500 text-xs mt-1">{formErrors.propertyId}</p>}
            </div>
            <div>
              <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional):</label>
              <select
                id="unitId"
                name="unitId"
                value={formData.unitId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || unitsForProperty.length === 0}
              >
                <option value="">Select Unit</option>
                {unitsForProperty.map(u => (
                  <option key={u._id} value={u._id}>{u.unitName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <UploadCloud className="w-5 h-5 mr-2 text-green-700" /> Upload Media
            </h3>
            {formData.existingMedia.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Existing Media:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.existingMedia.map((mediaUrl, index) => (
                    <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                      {mediaUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                        <img src={mediaUrl} alt={`Existing Media ${index + 1}`} className="w-full h-24 object-cover" />
                      ) : (
                        <video src={mediaUrl} controls className="w-full h-24 object-contain bg-gray-100" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingMedia(mediaUrl)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label htmlFor="mediaFiles" className="block text-sm font-medium text-gray-700 mb-1">Attach New Files (Images/Videos):</label>
              <input
                type="file"
                id="mediaFiles"
                name="mediaFiles"
                multiple
                onChange={handleFileChange}
                className={`w-full px-3 py-2 border ${formErrors.mediaFiles ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
                disabled={loading}
                accept="image/*,video/*"
              />
              {formErrors.mediaFiles && <p className="text-red-500 text-xs mt-1">{formErrors.mediaFiles}</p>}
              {formData.mediaFiles.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">Selected new files: {formData.mediaFiles.map(f => f.name).join(', ')}</p>
              )}
            </div>
          </div>


          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => navigate('/landlord/requests')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-5 rounded-lg shadow-sm flex items-center"
              disabled={loading}
            >
              <XCircle className="w-5 h-5 mr-2" /> Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
              disabled={loading}
            >
              <Save className="w-5 h-5 mr-2" /> {isEditMode ? 'Update Request' : 'Create Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
    
  );
}

export default CreateEditRequestPage;
