import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/common/Button";
import { FileArchive, Save, XCircle } from "lucide-react";
import { createScheduledMaintenance, getScheduledMaintenanceById, updateScheduledMaintenance } from "../../services/scheduledMaintenanceService";
import { getAllProperties } from "../../services/propertyService";

const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const maintenanceCategories = [
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
];

const showMessage = (msg, type = "info") => alert(msg);

function CreateEditScheduledMaintenancePage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!taskId;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    property: "",
    unit: "",
    scheduledDate: "",
    recurring: false,
    frequency: {},
    status: "scheduled",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [unitsForProperty, setUnitsForProperty] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const propertiesData = await getAllProperties();
        setProperties(propertiesData);

        let initialFormData = { ...formData };
        const queryParams = new URLSearchParams(location.search);
        const preselectedPropertyId = queryParams.get("propertyId");
        const preselectedUnitId = queryParams.get("unitId");

        if (isEditMode) {
          const taskData = await getScheduledMaintenanceById(taskId);
          initialFormData = {
            title: taskData.title || "",
            description: taskData.description || "",
            category: taskData.category || "",
            property: taskData.property?._id || "",
            unit: taskData.unit?._id || "",
            scheduledDate: taskData.scheduledDate
              ? new Date(taskData.scheduledDate).toISOString().split("T")[0]
              : "",
            recurring: taskData.recurring || false,
            frequency: taskData.frequency || {},
            status: taskData.status || "scheduled",
          };
          if (initialFormData.property) {
            const selectedProp = propertiesData.find(
              (p) => p._id === initialFormData.property
            );
            setUnitsForProperty(selectedProp?.units || []);
          }
        } else if (preselectedPropertyId) {
          initialFormData.property = preselectedPropertyId;
          const selectedProp = propertiesData.find(
            (p) => p._id === preselectedPropertyId
          );
          setUnitsForProperty(selectedProp?.units || []);
          if (preselectedUnitId) {
            initialFormData.unit = preselectedUnitId;
          }
        }
        setFormData(initialFormData);
      } catch (err) {
        setError(
          "Failed to load initial data. " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line
  }, [taskId, isEditMode, location.search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "property") {
        newFormData.unit = "";
        const selectedProperty = properties.find((p) => p._id === value);
        setUnitsForProperty(selectedProperty?.units || []);
      }
      return newFormData;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required.";
    if (!formData.description.trim())
      errors.description = "Description is required.";
    if (!formData.category.trim()) errors.category = "Category is required.";
    if (!formData.property.trim()) errors.property = "Property is required.";
    if (!formData.scheduledDate.trim())
      errors.scheduledDate = "Scheduled date is required.";
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
        category: formData.category.toLowerCase(),
        property: formData.property,
        unit: formData.unit || null,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        recurring: formData.recurring,
        frequency: formData.frequency,
        status: formData.status,
      };

      if (isEditMode) {
        await updateScheduledMaintenance(taskId, payload);
        showMessage("Scheduled maintenance task updated successfully!", "success");
      } else {
        await createScheduledMaintenance(payload);
        showMessage("Scheduled maintenance task created successfully!", "success");
      }
      navigate("/landlord/scheduled-maintenance");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(
        `Failed to ${isEditMode ? "update" : "create"} task: ${msg}`
      );
      showMessage(
        `Failed to ${isEditMode ? "update" : "create"} task: ${msg}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
          Loading task data...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        <FileArchive className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
        {isEditMode ? "Edit Maintenance Task" : "Schedule New Maintenance"}
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

      <div
        className="bg-white p-8 rounded-xl shadow-lg border max-w-4xl mx-auto"
        style={{ borderColor: PRIMARY_COLOR + "20" }}
      >
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Title:
            </label>
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
            <label htmlFor="description" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Description:
            </label>
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
              <label htmlFor="category" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Category:
              </label>
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
                {maintenanceCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
            </div>
            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Scheduled Date:
              </label>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.scheduledDate ? "border-red-500" : "border-[#219377]"}`}
                style={{ color: PRIMARY_COLOR }}
                required
                disabled={loading}
              />
              {formErrors.scheduledDate && <p className="text-red-500 text-xs mt-1">{formErrors.scheduledDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="property" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Property:
              </label>
              <select
                id="property"
                name="property"
                value={formData.property}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.property ? "border-red-500" : "border-[#219377]"}`}
                style={{ color: PRIMARY_COLOR }}
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
              <label htmlFor="unit" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Unit (Optional):
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
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

          {isEditMode && (
            <div>
              <label htmlFor="status" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Status:
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none capitalize"
                style={{ color: PRIMARY_COLOR }}
                disabled={loading}
              >
                {["scheduled", "in_progress", "completed", "canceled"].map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring not implemented, placeholder for future */}
          {/* ... */}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => navigate("/landlord/scheduled-maintenance")}
              className="py-2 px-5 rounded-lg flex items-center"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600
              }}
              disabled={loading}
            >
              <XCircle className="w-5 h-5 mr-2" /> Cancel
            </Button>
            <Button
              type="submit"
              className="py-2 px-5 rounded-lg flex items-center shadow-md"
              style={{
                backgroundColor: "#a78bfa",
                color: "#fff",
                fontWeight: 600
              }}
              disabled={loading}
            >
              <Save className="w-5 h-5 mr-2" /> {isEditMode ? "Update Task" : "Schedule Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEditScheduledMaintenancePage;