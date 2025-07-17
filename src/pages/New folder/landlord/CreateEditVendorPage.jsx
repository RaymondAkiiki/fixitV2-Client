import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { Package, Save, XCircle } from "lucide-react";
import { createVendor, getVendorById, updateVendor } from "../../services/vendorService";

// Brand Colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const showMessage = (msg, type = "info") => alert(msg);

function CreateEditVendorPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!vendorId;

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    services: "",
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
            services: Array.isArray(data.services) && data.services.length > 0
              ? data.services.join(", ")
              : "",
            address: data.address || "",
            description: data.description || "",
          });
        } catch (err) {
          setError("Failed to load vendor data for editing. " + (err.response?.data?.message || err.message));
        } finally {
          setLoading(false);
        }
      };
      fetchVendor();
    }
  }, [vendorId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      showMessage("Please correct the form errors.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        services: formData.services.split(",").map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase()),
      };

      if (isEditMode) {
        await updateVendor(vendorId, payload);
        showMessage("Vendor updated successfully!", "success");
      } else {
        await createVendor(payload);
        showMessage("Vendor created successfully!", "success");
      }
      navigate("/landlord/vendors");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to ${isEditMode ? "update" : "create"} vendor: ${msg}`);
      showMessage(`Failed to ${isEditMode ? "update" : "create"} vendor: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading vendor data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
        <Package className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
        {isEditMode ? "Edit Vendor" : "Add New Vendor"}
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

      <div className="bg-white p-8 rounded-xl shadow-lg border max-w-3xl mx-auto" style={{ borderColor: PRIMARY_COLOR + "20" }}>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Vendor Name:
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.name ? "border-red-500" : "border-[#219377]"}`}
              style={{ color: PRIMARY_COLOR }}
              required
              disabled={loading}
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="contactPerson" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Contact Person (Optional):
            </label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
              style={{ color: PRIMARY_COLOR }}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.email ? "border-red-500" : "border-[#219377]"}`}
                style={{ color: PRIMARY_COLOR }}
                required
                disabled={loading}
              />
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Phone:
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.phone ? "border-red-500" : "border-[#219377]"}`}
                style={{ color: PRIMARY_COLOR }}
                required
                disabled={loading}
              />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="services" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Services (comma-separated):
            </label>
            <input
              type="text"
              id="services"
              name="services"
              value={formData.services}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.services ? "border-red-500" : "border-[#219377]"}`}
              style={{ color: PRIMARY_COLOR }}
              placeholder="e.g., plumbing, electrical, HVAC, cleaning"
              required
              disabled={loading}
            />
            {formErrors.services && <p className="text-red-500 text-xs mt-1">{formErrors.services}</p>}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Address (Optional):
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
              style={{ color: PRIMARY_COLOR }}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Description (Optional):
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
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
              onClick={() => navigate("/landlord/vendors")}
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
              <Save className="w-5 h-5 mr-2" /> {isEditMode ? "Update Vendor" : "Add Vendor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEditVendorPage;