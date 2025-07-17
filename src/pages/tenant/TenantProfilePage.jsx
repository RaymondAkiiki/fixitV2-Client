// frontend/src/pages/tenant/TenantProfilePage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { User, Lock, Bell, Save, Eye, EyeOff, Home } from "lucide-react"; // Added Home icon for associations

import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx"; // Using LoadingSpinner

import { getMyProfile, updateMyProfile } from "../../services/userService.js";
import { changePassword } from "../../services/authService.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx";
import useForm from "../../hooks/useForm.js"; // Import useForm hook
import { ROUTES } from "../../utils/constants.js"; // Import ROUTES

// Define primary color for consistent styling
const PRIMARY_COLOR = "#219377";

/**
 * Client-side validation for the profile information form.
 * @param {object} values - The form values { name, email, phone, notificationsEnabled }.
 * @returns {object} An object containing validation errors.
 */
const validateProfileForm = (values) => {
  const errors = {};
  if (!values.name.trim()) {
    errors.name = "Full Name is required.";
  }
  if (values.phone && !/^\d{7,15}$/.test(values.phone.trim())) {
    errors.phone = "Please enter a valid phone number (7-15 digits).";
  }
  return errors;
};

/**
 * Client-side validation for the change password form.
 * @param {object} values - The form values { currentPassword, newPassword, confirmNewPassword }.
 * @returns {object} An object containing validation errors.
 */
const validatePasswordForm = (values) => {
  const errors = {};
  if (!values.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }
  if (!values.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (values.newPassword.length < 8) {
    errors.newPassword = "New password must be at least 8 characters long.";
  }
  if (!values.confirmNewPassword) {
    errors.confirmNewPassword = "Please confirm your new password.";
  } else if (values.newPassword !== values.confirmNewPassword) {
    errors.confirmNewPassword = "New passwords do not match.";
  }
  return errors;
};

function TenantProfilePage() {
  const { setUser } = useAuth(); // Assuming setUser is available to update auth context
  const { showSuccess, showError } = useGlobalAlert();

  // State for initial profile data loading
  const [initialProfileLoad, setInitialProfileLoad] = useState(true);
  const [profile, setProfile] = useState(null); // Keep original profile for associations display

  // --- Profile Information Form with useForm ---
  const {
    values: profileData,
    errors: profileErrors,
    handleChange: handleProfileChange,
    handleSubmit: handleUpdateProfile,
    isSubmitting: isUpdatingProfile, // Loading state for profile update form
    setValues: setProfileFormValues // To set initial values from API
  } = useForm(
    { name: "", email: "", phone: "", notificationsEnabled: true },
    validateProfileForm,
    async (formValues) => {
      try {
        const updatedUser = await updateMyProfile({
          name: formValues.name,
          phone: formValues.phone,
          notificationsEnabled: formValues.notificationsEnabled,
        });
        // Update the user context with the new profile data
        if (setUser) setUser((prev) => ({ ...prev, ...updatedUser }));
        setProfile(updatedUser); // Update local profile state as well
        showSuccess("Profile updated successfully!");
        // Optionally, turn off editing mode after successful save
        // setIsEditing(false); // If you want to automatically switch back to view mode
      } catch (err) {
        console.error("Failed to update profile:", err);
        showError(err.response?.data?.message || "Failed to update profile. Please try again.");
      }
    }
  );

  // --- Password Change Form with useForm ---
  const {
    values: passwordForm,
    errors: passwordErrors,
    handleChange: handlePasswordChange,
    handleSubmit: handleChangePassword,
    isSubmitting: isChangingPassword, // Loading state for password change form
    resetForm: resetPasswordForm // To clear password fields after successful change
  } = useForm(
    { currentPassword: "", newPassword: "", confirmNewPassword: "" },
    validatePasswordForm,
    async (formValues) => {
      try {
        await changePassword(formValues.currentPassword, formValues.newPassword);
        showSuccess("Password changed successfully! Please log in with your new password if redirected.");
        resetPasswordForm(); // Clear password fields
      } catch (err) {
        console.error("Failed to change password:", err);
        showError(err.response?.data?.message || "Failed to change password. Please try again.");
      }
    }
  );

  // --- Fetch current user profile on component mount ---
  const fetchProfileData = useCallback(async () => {
    setInitialProfileLoad(true);
    try {
      const data = await getMyProfile();
      setProfile(data); // Set the full profile data
      setProfileFormValues({ // Populate the profile edit form
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : true,
      });
    } catch (err) {
      console.error("Failed to load profile data:", err);
      showError("Failed to load profile data. " + (err.response?.data?.message || err.message));
    } finally {
      setInitialProfileLoad(false);
    }
  }, [showError, setProfileFormValues]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // --- Password Visibility States ---
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (initialProfileLoad) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" color={PRIMARY_COLOR} className="mr-4" />
        <p className="text-xl text-gray-700 font-semibold">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-8">
        <p className="text-xl text-red-600">Profile not found or could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      <h1 className="text-3xl font-extrabold mb-6 border-b pb-2 flex items-center" style={{ color: PRIMARY_COLOR }}>
        <User className="w-8 h-8 mr-3" style={{ color: PRIMARY_COLOR }} />
        My Profile & Settings
      </h1>

      {/* Profile Information Section */}
      <section className="bg-white p-8 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <User className="w-6 h-6 mr-2" style={{ color: PRIMARY_COLOR }} />
          Personal Information
        </h2>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <Input
            label="Full Name"
            id="name"
            name="name"
            type="text"
            value={profileData.name}
            onChange={handleProfileChange}
            placeholder="Your Full Name"
            required
            error={profileErrors.name}
            disabled={isUpdatingProfile}
          />
          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            value={profileData.email}
            disabled={true} // Email is read-only
            className="opacity-70 cursor-not-allowed"
            infoText="Email cannot be changed here. Contact support for email updates."
          />
          <Input
            label="Phone Number"
            id="phone"
            name="phone"
            type="tel"
            value={profileData.phone}
            onChange={handleProfileChange}
            placeholder="e.g., +2567xxxxxxxx"
            error={profileErrors.phone}
            disabled={isUpdatingProfile}
          />
          <div className="flex items-center space-x-3 mt-4 p-4 bg-[#f6fdfc] rounded-lg border border-[#e6f7f2]">
            <input
              type="checkbox"
              id="notificationsEnabled"
              name="notificationsEnabled"
              checked={profileData.notificationsEnabled}
              onChange={handleProfileChange}
              className="h-5 w-5 text-[#219377] rounded focus:ring-[#219377] border-gray-300"
              disabled={isUpdatingProfile}
            />
            <label htmlFor="notificationsEnabled" className="text-base font-medium text-gray-700 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-gray-600" /> Receive Email Notifications
            </label>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              className="py-2.5 px-6 rounded-lg bg-[#219377] hover:bg-[#1a7b64] text-white shadow-md transition"
              loading={isUpdatingProfile}
              disabled={isUpdatingProfile}
            >
              <Save className="w-5 h-5 mr-2" /> {isUpdatingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </section>

      {/* Property & Unit Associations Section (Read-only for Tenant) */}
      <section className="bg-white p-8 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Home className="w-6 h-6 mr-2" style={{ color: PRIMARY_COLOR }} />
          Your Property & Unit Associations
        </h2>
        {profile.associations?.tenancies?.length > 0 ? (
          <ul className="list-disc list-inside space-y-3 text-gray-700">
            {profile.associations.tenancies.map((tenancy) => (
              <li key={tenancy.unit?._id || tenancy.property?._id} className="text-lg">
                <strong>Property:</strong> {tenancy.property?.name || "N/A"}
                {tenancy.unit?.unitName && (
                  <>
                    <br />
                    <strong>Unit:</strong> {tenancy.unit.unitName}
                  </>
                )}
                {tenancy.unit?._id && (
                  <Link
                    to={ROUTES.TENANT_MY_UNIT.replace(':unitId', tenancy.unit._id)}
                    className="ml-3 text-blue-600 hover:underline text-sm"
                  >
                    View Unit Details
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 italic">
            You are not currently associated with any properties or units as a tenant.
            Please contact your property manager if this is incorrect.
          </p>
        )}
      </section>

      {/* Change Password Section */}
      <section className="bg-white p-8 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Lock className="w-6 h-6 mr-2" style={{ color: PRIMARY_COLOR }} />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-6">
          {/* Current Password */}
          <div className="relative">
            <Input
              label="Current Password"
              id="currentPassword"
              name="currentPassword"
              type={showPassword.current ? "text" : "password"}
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter your current password"
              required
              error={passwordErrors.currentPassword}
              disabled={isChangingPassword}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
              aria-label={showPassword.current ? "Hide current password" : "Show current password"}
              tabIndex={-1}
            >
              {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {/* New Password */}
          <div className="relative">
            <Input
              label="New Password"
              id="newPassword"
              name="newPassword"
              type={showPassword.new ? "text" : "password"}
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="Minimum 8 characters"
              required
              error={passwordErrors.newPassword}
              disabled={isChangingPassword}
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
              aria-label={showPassword.new ? "Hide new password" : "Show new password"}
              tabIndex={-1}
            >
              {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {/* Confirm New Password */}
          <div className="relative">
            <Input
              label="Confirm New Password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              type={showPassword.confirm ? "text" : "password"}
              value={passwordForm.confirmNewPassword}
              onChange={handlePasswordChange}
              placeholder="Re-enter new password"
              required
              error={passwordErrors.confirmNewPassword}
              disabled={isChangingPassword}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
              aria-label={showPassword.confirm ? "Hide confirmed new password" : "Show confirmed new password"}
              tabIndex={-1}
            >
              {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              className="py-2.5 px-6 rounded-lg bg-[#ffbd59] hover:bg-[#e7a741] text-[#1c2522] shadow-md transition"
              loading={isChangingPassword}
              disabled={isChangingPassword}
            >
              <Save className="w-5 h-5 mr-2" /> {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default TenantProfilePage;
