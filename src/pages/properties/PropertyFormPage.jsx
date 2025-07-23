import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/common/Button";
import { Building, Save, XCircle } from "lucide-react";
import { createProperty, getPropertyById, updateProperty } from "../../services/propertyService";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../utils/constants";

// Brand Colors
const PRIMARY_COLOR = "#219377";
const PRIMARY_DARK = "#197b63";
const SECONDARY_COLOR = "#ffbd59";

function PropertyFormPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!propertyId;
  const { showSuccess, showError } = useGlobalAlert();
  const { isAdmin, isPropertyManager, isLandlord } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: ""
    },
    details: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Determine the base path for navigation based on user role
  const getBasePath = useCallback(() => {
    if (isAdmin) return ROUTES.ADMIN_BASE;
    if (isPropertyManager) return ROUTES.PM_BASE;
    if (isLandlord) return ROUTES.LANDLORD_BASE;
    return ''; // Fallback
  }, [isAdmin, isPropertyManager, isLandlord]);

  useEffect(() => {
    if (isEditMode) {
      fetchPropertyData();
    }
  }, [propertyId, isEditMode]);

  const fetchPropertyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPropertyById(propertyId);
      setFormData({
        name: data.name || "",
        address: {
          street: data.address?.street || "",
          city: data.address?.city || "",
          state: data.address?.state || "",
          country: data.address?.country || ""
        },
        details: data.details || ""
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError("Failed to load property data for editing. " + msg);
      showError("Failed to load property data for editing. " + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData(f => ({
        ...f,
        address: { ...f.address, [addressField]: value }
      }));
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Property name is required.";
    if (!formData.address.city.trim()) errors["address.city"] = "City is required.";
    if (!formData.address.country.trim()) errors["address.country"] = "Country is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) {
      showError("Please correct the form errors.");
      return;
    }
    setLoading(true);
    try {
      if (isEditMode) {
        await updateProperty(propertyId, formData);
        showSuccess("Property updated successfully!");
      } else {
        await createProperty(formData);
        showSuccess("Property created successfully!");
      }
      navigate(`${getBasePath()}/properties`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to ${isEditMode ? 'update' : 'create'} property: ${msg}`);
      showError(`Failed to ${isEditMode ? 'update' : 'create'} property: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading property data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        <Building className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
        {isEditMode ? "Edit Property" : "Add New Property"}
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
        className="p-8 rounded-xl shadow-lg border max-w-3xl mx-auto"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "20" }}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="propertyName" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Property Name:
            </label>
            <input
              type="text"
              id="propertyName"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.name ? 'border-red-500' : 'border-[#219377]'}`}
              style={{ color: PRIMARY_COLOR }}
              required
              disabled={loading}
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          <fieldset className="border p-4 rounded-lg" style={{ borderColor: PRIMARY_COLOR + "20" }}>
            <legend className="text-lg font-bold px-2 -ml-2" style={{ color: PRIMARY_COLOR }}>Address</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="addressStreet" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                  Street Address:
                </label>
                <input
                  type="text"
                  id="addressStreet"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
                  style={{ color: PRIMARY_COLOR }}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addressCity" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                    City:
                  </label>
                  <input
                    type="text"
                    id="addressCity"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors["address.city"] ? 'border-red-500' : 'border-[#219377]'}`}
                    style={{ color: PRIMARY_COLOR }}
                    required
                    disabled={loading}
                  />
                  {formErrors["address.city"] && <p className="text-red-500 text-xs mt-1">{formErrors["address.city"]}</p>}
                </div>
                <div>
                  <label htmlFor="addressState" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                    State/Province:
                  </label>
                  <input
                    type="text"
                    id="addressState"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
                    style={{ color: PRIMARY_COLOR }}
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="addressCountry" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                  Country:
                </label>
                <input
                  type="text"
                  id="addressCountry"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors["address.country"] ? 'border-red-500' : 'border-[#219377]'}`}
                  style={{ color: PRIMARY_COLOR }}
                  required
                  disabled={loading}
                />
                {formErrors["address.country"] && <p className="text-red-500 text-xs mt-1">{formErrors["address.country"]}</p>}
              </div>
            </div>
          </fieldset>

          <div>
            <label htmlFor="propertyDetails" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Details (Optional):
            </label>
            <textarea
              id="propertyDetails"
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none resize-y"
              style={{ color: PRIMARY_COLOR }}
              disabled={loading}
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => navigate(`${getBasePath()}/properties`)}
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
                backgroundColor: PRIMARY_COLOR,
                color: "#fff",
                fontWeight: 600
              }}
              disabled={loading}
            >
              <Save className="w-5 h-5 mr-2" /> {isEditMode ? "Update Property" : "Create Property"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PropertyFormPage;