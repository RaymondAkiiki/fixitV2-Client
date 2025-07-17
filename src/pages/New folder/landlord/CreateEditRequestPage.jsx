import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/common/Button";
import { Wrench, Save, XCircle, UploadCloud } from "lucide-react";
import { createRequest, getRequestById, updateRequest, uploadRequestMedia, deleteRequestMedia } from "../../services/requestService";
import { getAllProperties } from "../../services/propertyService";

// Branding
const PRIMARY_COLOR = "#219377";
const PRIMARY_DARK = "#197b63";
const SECONDARY_COLOR = "#ffbd59";

const requestCategories = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural" },
  { value: "landscaping", label: "Landscaping" },
  { value: "other", label: "Other" },
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "pest_control", label: "Pest Control" },
  { value: "scheduled", label: "Scheduled" },
];

const requestPriorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const showMessage = (msg, type = "info") => alert(msg);

function CreateEditRequestPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!requestId;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    propertyId: "",
    unitId: "",
    mediaFiles: [],
    existingMedia: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [unitsForProperty, setUnitsForProperty] = useState([]);

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
        const preselectedPropertyId = queryParams.get("propertyId");
        const preselectedUnitId = queryParams.get("unitId");

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
            mediaFiles: [],
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
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line
  }, [requestId, isEditMode, location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: "" }));
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      if (name === "propertyId") {
        newFormData.unitId = "";
        const selectedProperty = properties.find(p => p._id === value);
        setUnitsForProperty(selectedProperty?.units || []);
      }
      return newFormData;
    });
  };

  const handleFileChange = (e) => {
    setFormErrors(prev => ({ ...prev, mediaFiles: "" }));
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
        showMessage("Media file deleted successfully!", "success");
        setFormData(prev => ({
          ...prev,
          existingMedia: prev.existingMedia.filter(url => url !== mediaUrlToDelete)
        }));
      } catch (err) {
        setError("Failed to delete media. " + (err.response?.data?.message || err.message));
        showMessage("Failed to delete media.", "error");
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
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) {
      showMessage("Please correct the form errors.", "error");
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
        unitId: formData.unitId || null,
        media: formData.existingMedia,
      };

      if (isEditMode) {
        await updateRequest(requestId, payload);
        if (formData.mediaFiles.length > 0) {
          await uploadRequestMedia(requestId, formData.mediaFiles);
        }
        showMessage("Request updated successfully!", "success");
      } else {
        await createRequest(payload, formData.mediaFiles);
        showMessage("Request created successfully!", "success");
      }
      navigate("/landlord/requests");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to ${isEditMode ? "update" : "create"} request: ${msg}`);
      showMessage(`Failed to ${isEditMode ? "update" : "create"} request: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading request data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
        <Wrench className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
        {isEditMode ? "Edit Service Request" : "Create New Service Request"}
      </h1>

      {error && (
        <div
          className="px-4 py-3 rounded relative mb-4 flex items-center"
          style={{
            backgroundColor: "#fed7d7",
            border: "1.5px solid #f56565",
            color: "#9b2c2c"
          }}
          role="alert"
        >
          <strong className="font-bold mr-2">Error!</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-lg border max-w-4xl mx-auto" style={{ borderColor: PRIMARY_COLOR + "20" }}>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.title ? "border-red-500" : "border-[#219377]"}`}
              style={{ color: PRIMARY_COLOR }}
              required
              disabled={loading}
            />
            {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none resize-y ${formErrors.description ? "border-red-500" : "border-[#219377]"}`}
              style={{ color: PRIMARY_COLOR }}
              required
              disabled={loading}
            ></textarea>
            {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Category:</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none capitalize ${formErrors.category ? "border-red-500" : "border-[#219377]"}`}
                style={{ color: PRIMARY_COLOR }}
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
              <label htmlFor="priority" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Priority:</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none capitalize"
                style={{ color: PRIMARY_COLOR }}
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
              <label htmlFor="propertyId" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Property:</label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.propertyId ? "border-red-500" : "border-[#219377]"}`}
                style={{ color: PRIMARY_COLOR }}
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
              <label htmlFor="unitId" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>Unit (Optional):</label>
              <select
                id="unitId"
                name="unitId"
                value={formData.unitId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
                style={{ color: PRIMARY_COLOR }}
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
          <div className="border border-[#219377] p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
              <UploadCloud className="w-5 h-5 mr-2" style={{ color: SECONDARY_COLOR }} /> Upload Media
            </h3>
            {formData.existingMedia.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2" style={{ color: PRIMARY_COLOR }}>Existing Media:</p>
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
              <label htmlFor="mediaFiles" className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Attach New Files (Images/Videos):</label>
              <input
                type="file"
                id="mediaFiles"
                name="mediaFiles"
                multiple
                onChange={handleFileChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${formErrors.mediaFiles ? "border-red-500" : "border-[#219377]"}`}
                style={{ color: PRIMARY_COLOR }}
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
              onClick={() => navigate("/landlord/requests")}
              className="py-2 px-5 rounded-lg flex items-center"
              style={{ backgroundColor: "#e4e4e7", color: PRIMARY_COLOR, fontWeight: 600 }}
              disabled={loading}
            >
              <XCircle className="w-5 h-5 mr-2" /> Cancel
            </Button>
            <Button
              type="submit"
              className="py-2 px-5 rounded-lg flex items-center shadow-md"
              style={{ backgroundColor: PRIMARY_COLOR, color: "#fff", fontWeight: 600 }}
              disabled={loading}
            >
              <Save className="w-5 h-5 mr-2" /> {isEditMode ? "Update Request" : "Create Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEditRequestPage;