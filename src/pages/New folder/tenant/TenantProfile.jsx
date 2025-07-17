import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "../../services/userService";
import Button from "../../components/common/Button";
import { useAuth } from "../../contexts/AuthContext";

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Helper for displaying messages to user (prefer toast/snackbar in production)
const showMessage = (msg, type = "info") => {
  // Replace with a toast/snackbar/modal system in production
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg);
};

function TenantProfile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  const { updateUserInContext } = useAuth();

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await getMyProfile();
        setProfile(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (err) {
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const updates = {
        name: formData.name,
        phone: formData.phone,
      };
      const updatedProfile = await updateMyProfile(updates);
      setProfile(updatedProfile);
      setIsEditing(false);
      updateUserInContext(updatedProfile);
      showMessage("Profile updated successfully!", "success");
    } catch (err) {
      setError(
        "Failed to update profile: " + (err.response?.data?.message || err.message)
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
          Loading your profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-red-600">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        My Profile
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
        className="bg-white p-8 rounded-xl shadow-lg border max-w-2xl mx-auto"
        style={{ borderColor: PRIMARY_COLOR + "20" }}
      >
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Name:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg focus:ring-[#219377] focus:border-[#219377] text-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed.</p>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Phone:
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg focus:ring-[#219377] focus:border-[#219377] text-gray-800"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-5 rounded-lg shadow-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700 text-lg">
              <strong>Name:</strong> {profile.name}
            </p>
            <p className="text-gray-700 text-lg">
              <strong>Email:</strong> {profile.email}
            </p>
            <p className="text-gray-700 text-lg">
              <strong>Phone:</strong> {profile.phone || "N/A"}
            </p>

            {/* Display associated properties and units */}
            <h3 className="text-xl font-semibold mt-8 mb-4 border-t pt-4" style={{ color: PRIMARY_COLOR }}>
              Your Property & Unit Associations
            </h3>
            {profile.associations?.tenancies?.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {profile.associations.tenancies.map((tenancy) => (
                  <li key={tenancy.unit?._id} className="text-lg">
                    <strong>Property:</strong> {tenancy.property?.name || "N/A"} (ID: {tenancy.property?._id}) <br />
                    <strong>Unit:</strong> {tenancy.unit?.unitName || "N/A"} (ID: {tenancy.unit?._id})
                    {tenancy.unit?._id && (
                      <Link
                        to={`/tenant/my-unit/${tenancy.unit._id}`}
                        className="ml-3 text-blue-600 hover:underline text-sm"
                      >
                        View Unit
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 italic">
                You are not currently associated with any properties or units as a tenant.
              </p>
            )}

            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => setIsEditing(true)}
                  className="bg-[#219377] hover:bg-emerald-700 text-white py-2 px-5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-[#219377] transition"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantProfile;