// frontend/src/pages/pm/CreateEditPropertyPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import { Building, Save, XCircle } from "lucide-react"; // Icons

// Import updated service functions
import { createProperty, getPropertyById, updateProperty } from "../../services/propertyService";

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * CreateEditPropertyPage allows Property Managers to add new properties or
 * edit existing ones.
 */
function CreateEditPropertyPage() {
  const { propertyId } = useParams(); // Will be undefined for creation, string for editing
  const navigate = useNavigate();
  const isEditMode = !!propertyId;

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

  useEffect(() => {
    if (isEditMode) {
      const fetchProperty = async () => {
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
          setError("Failed to load property data for editing. " + (err.response?.data?.message || err.message));
          console.error("Fetch property for edit error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProperty();
    }
  }, [propertyId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change

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
    // Add more validation rules as needed (e.g., max lengths)
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
      if (isEditMode) {
        await updateProperty(propertyId, formData);
        showMessage("Property updated successfully!", 'success');
      } else {
        await createProperty(formData);
        showMessage("Property created successfully!", 'success');
      }
      navigate('/pm/properties'); // Redirect to properties list after success
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to ${isEditMode ? 'update' : 'create'} property: ${msg}`);
      showMessage(`Failed to ${isEditMode ? 'update' : 'create'} property: ${msg}`, 'error');
      console.error(`${isEditMode ? 'Update' : 'Create'} property error:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) { // Only show loading overlay for edit mode initial fetch
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Loading property data...</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <Building className="w-8 h-8 mr-3 text-green-700" />
          {isEditMode ? 'Edit Property' : 'Add New Property'}
        </h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700 mb-1">Property Name:</label>
              <input
                type="text"
                id="propertyName"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
                disabled={loading}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            <fieldset className="border border-gray-200 p-4 rounded-lg">
              <legend className="text-lg font-medium text-gray-800 px-2 -ml-2">Address</legend>
              <div className="space-y-4 mt-2">
                <div>
                  <label htmlFor="addressStreet" className="block text-sm font-medium text-gray-700 mb-1">Street Address:</label>
                  <input
                    type="text"
                    id="addressStreet"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="addressCity" className="block text-sm font-medium text-gray-700 mb-1">City:</label>
                    <input
                      type="text"
                      id="addressCity"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${formErrors["address.city"] ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      required
                      disabled={loading}
                    />
                    {formErrors["address.city"] && <p className="text-red-500 text-xs mt-1">{formErrors["address.city"]}</p>}
                  </div>
                  <div>
                    <label htmlFor="addressState" className="block text-sm font-medium text-gray-700 mb-1">State/Province:</label>
                    <input
                      type="text"
                      id="addressState"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="addressCountry" className="block text-sm font-medium text-gray-700 mb-1">Country:</label>
                  <input
                    type="text"
                    id="addressCountry"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${formErrors["address.country"] ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                    disabled={loading}
                  />
                  {formErrors["address.country"] && <p className="text-red-500 text-xs mt-1">{formErrors["address.country"]}</p>}
                </div>
              </div>
            </fieldset>

            <div>
              <label htmlFor="propertyDetails" className="block text-sm font-medium text-gray-700 mb-1">Details (Optional):</label>
              <textarea
                id="propertyDetails"
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
                disabled={loading}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                onClick={() => navigate('/pm/properties')}
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
                <Save className="w-5 h-5 mr-2" /> {isEditMode ? 'Update Property' : 'Create Property'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PropertyManagerLayout>
  );
}

export default CreateEditPropertyPage;
