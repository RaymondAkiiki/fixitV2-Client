// frontend/src/pages/pm/CreateEditScheduledMaintenancePage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import { FileArchive, Save, XCircle } from "lucide-react";

// Import updated service functions
import { createScheduledMaintenance, getScheduledMaintenanceById, updateScheduledMaintenance } from "../../services/scheduledMaintenanceService";
import { getAllProperties } from "../../services/propertyService"; // To select property/unit

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

// Maintenance Categories
const maintenanceCategories = [
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
];

/**
 * CreateEditScheduledMaintenancePage allows Property Managers to create new
 * scheduled maintenance tasks or edit existing ones.
 */
function CreateEditScheduledMaintenancePage() {
  const { taskId } = useParams(); // Will be undefined for creation, string for editing
  const navigate = useNavigate();
  const location = useLocation(); // For query params to pre-select property/unit
  const isEditMode = !!taskId;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    property: "", // propertyId
    unit: "",     // unitId (optional)
    scheduledDate: "",
    recurring: false, // For future recurring tasks
    frequency: {},    // For future recurring tasks
    status: "scheduled" // Default status for new tasks
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [unitsForProperty, setUnitsForProperty] = useState([]); // Units of currently selected property

  // Fetch initial data (properties) and task data if in edit mode
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const propertiesData = await getAllProperties();
        setProperties(propertiesData);

        let initialFormData = { ...formData };
        const queryParams = new URLSearchParams(location.search);
        const preselectedPropertyId = queryParams.get('propertyId');
        const preselectedUnitId = queryParams.get('unitId');

        if (isEditMode) {
          const taskData = await getScheduledMaintenanceById(taskId);
          initialFormData = {
            title: taskData.title || "",
            description: taskData.description || "",
            category: taskData.category || "",
            property: taskData.property?._id || "",
            unit: taskData.unit?._id || "",
            scheduledDate: taskData.scheduledDate ? new Date(taskData.scheduledDate).toISOString().split('T')[0] : "", // Format to YYYY-MM-DD
            recurring: taskData.recurring || false,
            frequency: taskData.frequency || {},
            status: taskData.status || "scheduled"
          };
          // Set units for the property selected in the task
          if (initialFormData.property) {
            const selectedProp = propertiesData.find(p => p._id === initialFormData.property);
            setUnitsForProperty(selectedProp?.units || []);
          }
        } else if (preselectedPropertyId) {
            initialFormData.property = preselectedPropertyId;
            const selectedProp = propertiesData.find(p => p._id === preselectedPropertyId);
            setUnitsForProperty(selectedProp?.units || []);
            if (preselectedUnitId) {
                initialFormData.unit = preselectedUnitId;
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
  }, [taskId, isEditMode, location.search]); // Depend on location.search for query params

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change

    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // If property changes, reset unit and update unitsForProperty
      if (name === 'property') {
        newFormData.unit = "";
        const selectedProperty = properties.find(p => p._id === value);
        setUnitsForProperty(selectedProperty?.units || []);
      }
      return newFormData;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required.";
    if (!formData.description.trim()) errors.description = "Description is required.";
    if (!formData.category.trim()) errors.category = "Category is required.";
    if (!formData.property.trim()) errors.property = "Property is required.";
    if (!formData.scheduledDate.trim()) errors.scheduledDate = "Scheduled date is required.";

    // Add more specific validations if needed (e.g., date format, future date)
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
        category: formData.category.toLowerCase(), // Ensure lowercase for backend
        property: formData.property,
        unit: formData.unit || null, // Ensure null if empty
        scheduledDate: new Date(formData.scheduledDate).toISOString(), // Send as ISO string
        recurring: formData.recurring,
        frequency: formData.frequency,
        status: formData.status,
      };

      if (isEditMode) {
        await updateScheduledMaintenance(taskId, payload);
        showMessage("Scheduled maintenance task updated successfully!", 'success');
      } else {
        await createScheduledMaintenance(payload);
        showMessage("Scheduled maintenance task created successfully!", 'success');
      }
      navigate('/pm/scheduled-maintenance'); // Redirect to tasks list after success
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to ${isEditMode ? 'update' : 'create'} task: ${msg}`);
      showMessage(`Failed to ${isEditMode ? 'update' : 'create'} task: ${msg}`, 'error');
      console.error(`${isEditMode ? 'Update' : 'Create'} task error:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) { // Only show loading overlay for edit mode initial fetch
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Loading task data...</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <FileArchive className="w-8 h-8 mr-3 text-green-700" />
          {isEditMode ? 'Edit Maintenance Task' : 'Schedule New Maintenance'}
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
                className={`w-full px-4 py-2 border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
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
                className={`w-full px-4 py-2 border ${formErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 resize-y`}
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
                  className={`w-full px-4 py-2 border ${formErrors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 capitalize`}
                  required
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  {maintenanceCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
              </div>
              <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date:</label>
                <input
                  type="date"
                  id="scheduledDate"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${formErrors.scheduledDate ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                  required
                  disabled={loading}
                />
                {formErrors.scheduledDate && <p className="text-red-500 text-xs mt-1">{formErrors.scheduledDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-1">Property:</label>
                <select
                  id="property"
                  name="property"
                  value={formData.property}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${formErrors.property ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                  required
                  disabled={loading}
                >
                  <option value="">Select Property</option>
                  {properties.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                {formErrors.property && <p className="text-red-500 text-xs mt-1">{formErrors.property}</p>}
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional):</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  disabled={loading || unitsForProperty.length === 0}
                >
                  <option value="">Select Unit</option>
                  {unitsForProperty.map(u => (
                    <option key={u._id} value={u._id}>{u.unitName}</option>
                  ))}
                </select>
              </div>
            </div>

            {isEditMode && (
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 capitalize"
                        disabled={loading}
                    >
                        {['scheduled', 'in_progress', 'completed', 'canceled'].map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Future: Recurring task options */}
            {/* <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="recurring"
                  checked={formData.recurring}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-purple-600 rounded"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">Recurring Task?</span>
              </label>
            </div>
            {formData.recurring && (
              <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Recurring Frequency</h4>
                <p className="text-sm text-gray-600 italic">Implement frequency options (e.g., daily, weekly, monthly) here.</p>
              </div>
            )} */}

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                onClick={() => navigate('/pm/scheduled-maintenance')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-5 rounded-lg shadow-sm flex items-center"
                disabled={loading}
              >
                <XCircle className="w-5 h-5 mr-2" /> Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
                disabled={loading}
              >
                <Save className="w-5 h-5 mr-2" /> {isEditMode ? 'Update Task' : 'Schedule Task'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PropertyManagerLayout>
  );
}

export default CreateEditScheduledMaintenancePage;
