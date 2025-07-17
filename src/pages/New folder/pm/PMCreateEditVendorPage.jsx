// frontend/src/pages/pm/PMCreateEditVendorPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { Package, Save, XCircle } from "lucide-react"; // Icons

// Import updated service functions
import { createVendor, getVendorById, updateVendor } from "../../services/vendorService";

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * PMCreateEditVendorPage allows Property Managers to add new vendors or
 * edit existing ones.
 */
function PMCreateEditVendorPage() {
  const { vendorId } = useParams(); // Will be undefined for creation, string for editing
  const navigate = useNavigate();
  const isEditMode = !!vendorId;

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    services: "", // Comma-separated string for input
    address: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      const fetchVendor = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getVendorById(vendorId);
          setFormData({
            name: data.name || "",
            contactPerson: data.contactPerson || "",
            phone: data.phone || "",
            email: data.email || "",
            services: (data.services && data.services.length > 0) ? data.services.join(", ") : "", // Convert array to comma-separated string
            address: data.address || "",
            description: data.description || "",
          });
        } catch (err) {
          setError("Failed to load vendor data for editing. " + (err.response?.data?.message || err.message));
          console.error("Fetch vendor for edit error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchVendor();
    }
  }, [vendorId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
    setFormData(f => ({ ...f, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Vendor name is required.";
    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Invalid email format.";
    }
    if (!formData.phone.trim()) errors.phone = "Phone number is required.";
    if (!formData.services.trim()) errors.services = "At least one service is required.";
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
        ...formData,
        services: formData.services.split(",").map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase()), // Convert string to array, filter empty, lowercase
      };

      if (isEditMode) {
        await updateVendor(vendorId, payload);
        showMessage("Vendor updated successfully!", 'success');
      } else {
        await createVendor(payload);
        showMessage("Vendor created successfully!", 'success');
      }
      navigate('/pm/vendors'); // Redirect to vendors list after success
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to ${isEditMode ? 'update' : 'create'} vendor: ${msg}`);
      showMessage(`Failed to ${isEditMode ? 'update' : 'create'} vendor: ${msg}`, 'error');
      console.error(`${isEditMode ? 'Update' : 'Create'} vendor error:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) { // Only show loading overlay for edit mode initial fetch
    return (
      
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Loading vendor data...</p>
      </div>
      
    );
  }

  return (
  
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
        <Package className="w-8 h-8 mr-3 text-green-700" />
        {isEditMode ? 'Edit Vendor' : 'Add New Vendor'}
      </h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>}

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Vendor Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
              required
              disabled={loading}
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">Contact Person (Optional):</label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                required
                disabled={loading}
              />
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
              <input
                type="tel" // Use type="tel" for phone numbers
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                required
                disabled={loading}
              />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-1">Services (comma-separated):</label>
            <input
              type="text"
              id="services"
              name="services"
              value={formData.services}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${formErrors.services ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
              placeholder="e.g., plumbing, electrical, HVAC, cleaning"
              required
              disabled={loading}
            />
            {formErrors.services && <p className="text-red-500 text-xs mt-1">{formErrors.services}</p>}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address (Optional):</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional):</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 resize-y"
              disabled={loading}
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => navigate('/pm/vendors')}
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
              <Save className="w-5 h-5 mr-2" /> {isEditMode ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
    
  );
}

export default PMCreateEditVendorPage;
