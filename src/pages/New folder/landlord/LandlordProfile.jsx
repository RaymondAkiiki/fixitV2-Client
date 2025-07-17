import React, { useState, useEffect } from "react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { User, Lock, Bell, Save, Eye, EyeOff } from "lucide-react";

import { getMyProfile, updateMyProfile } from "../../services/userService";
import { changePassword } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

function LandlordProfile() {
  const { user, setUser } = useAuth();

  // --- Profile State ---
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    notificationsEnabled: true,
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState("info");

  // --- Password State ---
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] = useState("info");
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // --- Fetch current user profile ---
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileMessage('');
      try {
        const data = await getMyProfile();
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : true,
        });
      } catch (err) {
        setProfileMessageType("error");
        setProfileMessage("Failed to load profile data. " + (err.response?.data?.message || err.message));
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // --- Profile Data Handlers ---
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setProfileErrors((prev) => ({ ...prev, [name]: "" }));
    setProfileMessage("");
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
      setProfileMessage("Please correct the errors in your profile information.");
      setProfileMessageType("error");
      return;
    }
    setProfileLoading(true);
    setProfileMessage('');
    setProfileMessageType('info');
    try {
      const updatedUser = await updateMyProfile({
        name: profileData.name,
        phone: profileData.phone,
        notificationsEnabled: profileData.notificationsEnabled,
      });
      if (setUser) setUser((prev) => ({ ...prev, ...updatedUser }));
      setProfileMessageType("success");
      setProfileMessage("Profile updated successfully!");
    } catch (err) {
      setProfileMessageType("error");
      setProfileMessage("Failed to update profile: " + (err.response?.data?.message || err.message));
    } finally {
      setProfileLoading(false);
    }
  };

  // --- Password Change Handlers ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    setPasswordMessage("");
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
      setPasswordMessage("Please correct the errors in the password form.");
      setPasswordMessageType("error");
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage('');
    setPasswordMessageType('info');
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessageType("success");
      setPasswordMessage("Password changed successfully! Please log in with your new password if redirected.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      setPasswordMessageType("error");
      setPasswordMessage("Failed to change password: " + (err.response?.data?.message || err.message));
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- UI ---
  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center"
          style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
        <User className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
        My Profile & Settings
      </h1>

      {/* Profile Information Section */}
      <div
        className="p-8 rounded-xl shadow-lg border mb-8"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "14" }}
      >
        <h2 className="text-2xl font-semibold mb-5 flex items-center"
            style={{ color: PRIMARY_COLOR }}>
          <User className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} />
          Personal Information
        </h2>
        {profileMessage && (
          <Alert
            type={profileMessageType}
            message={profileMessage}
            onClose={() => setProfileMessage("")}
            className="mb-4"
          />
        )}

        {profileLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="md" color={PRIMARY_COLOR} />
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
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
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
              style={{ borderColor: PRIMARY_COLOR, color: "#64748b" }}
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
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
            />
            <div className="flex items-center space-x-3 mt-4 p-4 rounded-lg border"
                 style={{ background: "#f6fcfa", borderColor: PRIMARY_COLOR + "30" }}>
              <input
                type="checkbox"
                id="notificationsEnabled"
                name="notificationsEnabled"
                checked={profileData.notificationsEnabled}
                onChange={handleProfileChange}
                className="h-5 w-5 rounded focus:ring-2"
                style={{
                  accentColor: PRIMARY_COLOR,
                  borderColor: PRIMARY_COLOR
                }}
                disabled={profileLoading}
              />
              <label htmlFor="notificationsEnabled" className="text-base font-medium flex items-center"
                     style={{ color: "#475569" }}>
                <Bell className="w-5 h-5 mr-2" style={{ color: SECONDARY_COLOR }} /> Receive Email Notifications
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                variant="primary"
                className="py-2.5 px-6"
                loading={profileLoading}
                disabled={profileLoading}
                style={{
                  backgroundColor: PRIMARY_COLOR,
                  color: "#fff",
                  fontWeight: 600
                }}
              >
                <Save className="w-5 h-5 mr-2" /> Save Profile
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password Section */}
      <div
        className="p-8 rounded-xl shadow-lg border mb-8"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "14" }}
      >
        <h2 className="text-2xl font-semibold mb-5 flex items-center"
            style={{ color: PRIMARY_COLOR }}>
          <Lock className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} />
          Change Password
        </h2>
        {passwordMessage && (
          <Alert
            type={passwordMessageType}
            message={passwordMessage}
            onClose={() => setPasswordMessage("")}
            className="mb-4"
          />
        )}
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
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
            />
            <button
              type="button"
              onClick={() => setShow((prev) => ({ ...prev, current: !prev.current }))}
              className="absolute inset-y-0 right-3 flex items-center transition-colors top-8"
              style={{ color: PRIMARY_COLOR }}
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
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
            />
            <button
              type="button"
              onClick={() => setShow((prev) => ({ ...prev, new: !prev.new }))}
              className="absolute inset-y-0 right-3 flex items-center transition-colors top-8"
              style={{ color: PRIMARY_COLOR }}
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
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
            />
            <button
              type="button"
              onClick={() => setShow((prev) => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute inset-y-0 right-3 flex items-center transition-colors top-8"
              style={{ color: PRIMARY_COLOR }}
              aria-label={show.confirm ? "Hide confirmed new password" : "Show confirmed new password"}
              tabIndex={-1}
            >
              {show.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              variant="secondary"
              className="py-2.5 px-6"
              loading={passwordLoading}
              disabled={passwordLoading}
              style={{
                backgroundColor: SECONDARY_COLOR,
                color: "#1a3b34",
                fontWeight: 600
              }}
            >
              <Save className="w-5 h-5 mr-2" /> Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LandlordProfile;