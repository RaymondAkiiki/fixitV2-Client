// frontend/src/pages/tenant/TenantProfile.jsx

import React, { useState, useEffect } from "react";
import { getMyProfile, updateMyProfile } from "../../services/userService"; // Functions for current user
import Button from "../../components/common/Button"; // Generic button
import { useAuth } from '../../context/AuthContext'; // To update user in context after profile update

// Helper for displaying messages to user (instead of alert)
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Keeping alert for now
};

/**
 * TenantProfile component allows a logged-in tenant to view and edit their own profile details.
 * It combines the functionality of the old EditTenantPage and TenantDetailsPage for the current user.
 */
function TenantProfile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  const { updateUserInContext } = useAuth(); // Function from AuthContext to update local user state

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await getMyProfile(); // Fetch current user's profile
        setProfile(data);
        setFormData({
          name: data.name || "",
          email: data.email || "", // Email is read-only, but good to display
          phone: data.phone || "",
        });
      } catch (err) {
        setError("Failed to load profile. Please try again.");
        console.error("Fetch profile error:", err);
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
      // Only send updatable fields
      const updates = {
        name: formData.name,
        phone: formData.phone,
      };
      const updatedProfile = await updateMyProfile(updates); // Update current user's profile
      setProfile(updatedProfile);
      setIsEditing(false); // Exit edit mode
      updateUserInContext(updatedProfile); // Update user in AuthContext
      showMessage("Profile updated successfully!", 'success');
    } catch (err) {
      setError("Failed to update profile: " + (err.response?.data?.message || err.message));
      console.error("Update profile error:", err);
    }
  };

  if (loading) {
    return (
     
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Loading your profile...</p>
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
   
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">My Profile</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                {/* Email is read-only based on backend design */}
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone:</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
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
              <p className="text-gray-700 text-lg"><strong>Name:</strong> {profile.name}</p>
              <p className="text-gray-700 text-lg"><strong>Email:</strong> {profile.email}</p>
              <p className="text-gray-700 text-lg"><strong>Phone:</strong> {profile.phone || "N/A"}</p>

              {/* Display associated properties and units */}
              <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4 border-t pt-4">Your Property & Unit Associations</h3>
              {profile.associations?.tenancies?.length > 0 ? (
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {profile.associations.tenancies.map(tenancy => (
                    <li key={tenancy.unit?._id} className="text-lg">
                      <strong>Property:</strong> {tenancy.property?.name || 'N/A'} (ID: {tenancy.property?._id}) <br />
                      <strong>Unit:</strong> {tenancy.unit?.unitName || 'N/A'} (ID: {tenancy.unit?._id})
                      {tenancy.unit?._id && (
                        <Link to={`/tenant/my-unit/${tenancy.unit._id}`} className="ml-3 text-blue-600 hover:underline text-sm">View Unit</Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 italic">You are not currently associated with any properties or units as a tenant.</p>
              )}


              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg shadow-md"
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
