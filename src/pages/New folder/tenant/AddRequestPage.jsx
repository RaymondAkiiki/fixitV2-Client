import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import { Loader2 } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext.jsx";
import { createRequest } from "../../services/requestService.js";
import { getMyProfile } from "../../services/userService.js";

// Branding Colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const CATEGORY_OPTIONS = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC (Heating & Cooling)" },
  { value: "appliance", label: "Appliance" },
  { value: "general", label: "General/Other" },
];
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const AddRequestPage = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "plumbing",
    priority: "medium",
    propertyId: "",
    unitId: "",
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [tenancies, setTenancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenancies = async () => {
      if (!user) return;
      try {
        const profile = await getMyProfile();
        const userTenancies = profile.associations?.tenancies || [];
        setTenancies(userTenancies);
        if (userTenancies.length > 0) {
          setFormData((prev) => ({
            ...prev,
            propertyId: userTenancies[0].property._id,
            unitId: userTenancies[0].unit._id,
          }));
        }
      } catch (err) {
        setError("Could not load your property information. Please go back and try again.");
      }
    };
    fetchTenancies();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTenancyChange = (e) => {
    const selectedTenancy = tenancies.find((t) => t.unit._id === e.target.value);
    if (selectedTenancy) {
      setFormData((prev) => ({
        ...prev,
        propertyId: selectedTenancy.property._id,
        unitId: selectedTenancy.unit._id,
      }));
    }
  };

  const handleFileChange = (e) => {
    setMediaFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.propertyId || !formData.unitId) {
      setError("You must select a property and unit.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createRequest(formData, mediaFiles);
      alert("Request submitted successfully!");
      navigate("/tenant/requests");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <header className="flex items-center justify-between mb-7 border-b pb-3" style={{ borderColor: PRIMARY_COLOR }}>
        <h1 className="text-3xl font-extrabold flex items-center" style={{ color: PRIMARY_COLOR }}>
          Submit a New Request
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm"
          style={{ color: PRIMARY_COLOR }}
        >
          <FaArrowLeft />
          Back to Requests
        </button>
      </header>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border" style={{ borderColor: PRIMARY_COLOR + "20" }}>
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

        {tenancies.length === 0 && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-4">
            <strong>Notice:</strong> You are not currently associated with any property or unit.
            <br />
            Please contact your property manager or landlord to be linked to your residence before submitting a request.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {tenancies.length > 1 && (
            <div>
              <label htmlFor="unitId" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Select your Unit
              </label>
              <select
                id="unitId"
                name="unitId"
                value={formData.unitId}
                onChange={handleTenancyChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
                style={{ color: PRIMARY_COLOR }}
              >
                {tenancies.map((t) => (
                  <option key={t.unit._id} value={t.unit._id}>
                    {t.unit.unitName} at {t.property.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Request Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Leaking kitchen sink"
              required
              className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
              style={{ color: PRIMARY_COLOR }}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Detailed Description
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Please provide as much detail as possible..."
              required
              className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none resize-y"
              style={{ color: PRIMARY_COLOR }}
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Category
              </label>
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none capitalize"
                style={{ color: PRIMARY_COLOR }}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Priority
              </label>
              <select
                name="priority"
                id="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none capitalize"
                style={{ color: PRIMARY_COLOR }}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mediaFiles" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Upload Photos/Videos (Optional)
            </label>
            <input
              type="file"
              name="mediaFiles"
              id="mediaFiles"
              onChange={handleFileChange}
              multiple
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          <div className="pt-4 border-t border-[#219377]">
            <button
              type="submit"
              disabled={loading || tenancies.length === 0}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg shadow-md font-semibold"
              style={{
                backgroundColor: loading || tenancies.length === 0 ? "#cccccc" : PRIMARY_COLOR,
                color: "#fff"
              }}
            >
              {loading ? <Loader2 className="animate-spin" /> : <FaPaperPlane />}
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRequestPage;