import React, { useState, useEffect } from "react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";
import { User, Lock, Bell, Save, Eye, EyeOff } from "lucide-react";
import { getMyProfile, updateMyProfile } from "../../services/userService";
import { changePassword } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { useGlobalAlert } from "../../context/GlobalAlertContext";

/**
 * PMProfile allows authenticated users (PMs, landlords, etc.) to view and update their personal profile
 * and change their password. It uses the /users/me backend endpoints for consistency.
 */
const PRIMARY = "#219377";
const SECONDARY = "#ffbd59";

function PMProfile() {
  const { user, setUser } = useAuth();
  const { showSuccess, showError, showInfo } = useGlobalAlert();

  // --- Profile State ---
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    notificationsEnabled: true,
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);

  // --- Password State ---
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // --- Fetch current user profile ---
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const data = await getMyProfile();
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : true,
        });
      } catch (err) {
        showError("Failed to load profile data. " + (err.response?.data?.message || err.message));
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  // --- Profile Data Handlers ---
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setProfileErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!profileData.name.trim()) errors.name = "Name is required.";
    if (profileData.phone && !/^\d{7,15}$/.test(profileData.phone.trim())) {
      errors.phone = "Please enter a valid phone number (min 7 digits).";
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) {
      showError("Please correct the errors in your profile information.");
      return;
    }
    setProfileLoading(true);
    try {
      const updatedUser = await updateMyProfile({
        name: profileData.name,
        phone: profileData.phone,
        notificationsEnabled: profileData.notificationsEnabled,
      });
      if (setUser) setUser((prev) => ({ ...prev, ...updatedUser }));
      showSuccess("Profile updated successfully!");
    } catch (err) {
      showError("Failed to update profile: " + (err.response?.data?.message || err.message));
    } finally {
      setProfileLoading(false);
    }
  };

  // --- Password Change Handlers ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = "Current password is required.";
    if (!passwordForm.newPassword) errors.newPassword = "New password is required.";
    if (passwordForm.newPassword.length < 8) errors.newPassword = "New password must be at least 8 characters.";
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword)
      errors.confirmNewPassword = "Passwords do not match.";
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      showError("Please correct the errors in the password form.");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showSuccess("Password changed successfully! Please log in with your new password if redirected.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      showError("Failed to change password: " + (err.response?.data?.message || err.message));
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- UI ---
  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      <h1 className="text-3xl font-extrabold mb-6 border-b pb-2 flex items-center" style={{ color: PRIMARY }}>
        <User className="w-8 h-8 mr-3" style={{ color: PRIMARY }} />
        My Profile & Settings
      </h1>

      {/* Profile Information Section */}
      <section className="bg-white p-8 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY }}>
          <User className="w-6 h-6 mr-2" style={{ color: PRIMARY }} />
          Personal Information
        </h2>
        {profileLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="md" color={PRIMARY} />
          </div>
        ) : (
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
              disabled={profileLoading}
            />
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              value={profileData.email}
              disabled={true}
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
              disabled={profileLoading}
            />
            <div className="flex items-center space-x-3 mt-4 p-4 bg-[#f6fdfc] rounded-lg border border-[#e6f7f2]">
              <input
                type="checkbox"
                id="notificationsEnabled"
                name="notificationsEnabled"
                checked={profileData.notificationsEnabled}
                onChange={handleProfileChange}
                className="h-5 w-5 text-[#219377] rounded focus:ring-[#219377] border-gray-300"
                disabled={profileLoading}
              />
              <label htmlFor="notificationsEnabled" className="text-base font-medium text-gray-700 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-gray-600" /> Receive Email Notifications
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                className="py-2.5 px-6 rounded-lg bg-[#219377] hover:bg-[#1a7b64] text-white shadow-md transition"
                loading={profileLoading}
                disabled={profileLoading}
              >
                <Save className="w-5 h-5 mr-2" /> Save Profile
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Change Password Section */}
      <section className="bg-white p-8 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY }}>
          <Lock className="w-6 h-6 mr-2" style={{ color: PRIMARY }} />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-6">
          {/* Current Password */}
          <div className="relative">
            <Input
              label="Current Password"
              id="currentPassword"
              name="currentPassword"
              type={show.current ? "text" : "password"}
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter your current password"
              required
              error={passwordErrors.currentPassword}
              disabled={passwordLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((prev) => ({ ...prev, current: !prev.current }))}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
              aria-label={show.current ? "Hide current password" : "Show current password"}
              tabIndex={-1}
            >
              {show.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {/* New Password */}
          <div className="relative">
            <Input
              label="New Password"
              id="newPassword"
              name="newPassword"
              type={show.new ? "text" : "password"}
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="Minimum 8 characters"
              required
              error={passwordErrors.newPassword}
              disabled={passwordLoading}
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((prev) => ({ ...prev, new: !prev.new }))}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
              aria-label={show.new ? "Hide new password" : "Show new password"}
              tabIndex={-1}
            >
              {show.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {/* Confirm New Password */}
          <div className="relative">
            <Input
              label="Confirm New Password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              type={show.confirm ? "text" : "password"}
              value={passwordForm.confirmNewPassword}
              onChange={handlePasswordChange}
              placeholder="Re-enter new password"
              required
              error={passwordErrors.confirmNewPassword}
              disabled={passwordLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((prev) => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
              aria-label={show.confirm ? "Hide confirmed new password" : "Show confirmed new password"}
              tabIndex={-1}
            >
              {show.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              className="py-2.5 px-6 rounded-lg bg-[#ffbd59] hover:bg-[#e7a741] text-[#1c2522] shadow-md transition"
              loading={passwordLoading}
              disabled={passwordLoading}
            >
              <Save className="w-5 h-5 mr-2" /> Change Password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default PMProfile;