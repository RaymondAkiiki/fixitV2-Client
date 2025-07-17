// frontend/src/pages/( was changed from shared since its the only one in the folder /MyProfilePage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import { User, Mail, Phone, Lock, Bell, Save, Eye, EyeOff } from "lucide-react";

// Import API services
import { getUserProfile, updateUserProfile } from "../../services/userService";
import { changePassword } from "../../services/authService"; // This function needs to be added to authService.js
import { useAuth } from "../../contexts/AuthContext"; // To get current user's role for layout and data

// Helper for displaying messages to user (using Alert instead of toast)
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  // In a full app, you'd use a more sophisticated toast/snackbar system.
  // For now, this component will manage its own Alert state.
};

/**
 * MyProfilePage allows authenticated users to view and update their personal profile
 * details and change their password. It's shared across different user roles.
 */
function MyProfilePage() {
  const navigate = useNavigate();
  const { user: currentUser, updateAuthUser } = useAuth(); // Get current user from AuthContext

  // State for profile data
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    notificationsEnabled: true, // Assuming this field exists on the user model
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileMessageType, setProfileMessageType] = useState('info');

  // State for password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordMessageType, setPasswordMessageType] = useState('info');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);


  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileMessage('');
      try {
        const data = await getUserProfile(); // Fetches current logged-in user's profile
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : true, // Default to true if not set
        });
      } catch (err) {
        setProfileMessageType('error');
        setProfileMessage("Failed to load profile data. " + (err.response?.data?.message || err.message));
        console.error("Fetch profile error:", err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // --- Profile Data Handlers ---
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setProfileErrors(prev => ({ ...prev, [name]: '' }));
    setProfileMessage(''); // Clear any general messages on change
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
    setProfileMessage('');
    setProfileMessageType('info');
    if (!validateProfileForm()) {
        setProfileMessage('Please correct the errors in your profile information.');
        setProfileMessageType('error');
        return;
    }

    setProfileLoading(true);
    try {
      const updatedUser = await updateUserProfile({
        name: profileData.name,
        phone: profileData.phone,
        notificationsEnabled: profileData.notificationsEnabled,
      });
      // Optionally update auth context user info (e.g., if name changed)
      updateAuthUser(prevUser => ({ ...prevUser, name: updatedUser.name, phone: updatedUser.phone }));

      setProfileMessageType('success');
      setProfileMessage("Profile updated successfully!");
    } catch (err) {
      setProfileMessageType('error');
      setProfileMessage("Failed to update profile: " + (err.response?.data?.message || err.message));
      console.error("Update profile error:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  // --- Password Change Handlers ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    setPasswordMessage(''); // Clear any general messages on change
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = "Current password is required.";
    if (!passwordForm.newPassword) errors.newPassword = "New password is required.";
    if (passwordForm.newPassword.length < 8) errors.newPassword = "New password must be at least 8 characters.";
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) errors.confirmNewPassword = "Passwords do not match.";

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordMessageType('info');
    if (!validatePasswordForm()) {
        setPasswordMessage('Please correct the errors in the password form.');
        setPasswordMessageType('error');
        return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessageType('success');
      setPasswordMessage("Password changed successfully! Please log in with your new password if redirected.");
      // Clear password fields
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      // If authService.changePassword logs out the user, handle accordingly.
      // Assuming it might invalidate current token and require re-login.
      // If it doesn't, no immediate redirect is needed.
      // For robust implementation, consider forcing re-login after password change.
      // For now, let's assume it doesn't automatically log out.
    } catch (err) {
      setPasswordMessageType('error');
      setPasswordMessage("Failed to change password: " + (err.response?.data?.message || err.message));
      console.error("Change password error:", err);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
   
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <User className="w-8 h-8 mr-3 text-green-700" />
          My Profile & Settings
        </h1>

        {/* Profile Information Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
            <User className="w-6 h-6 mr-2 text-green-700" />
            Personal Information
          </h2>
          {profileMessage && <Alert type={profileMessageType} message={profileMessage} onClose={() => setProfileMessage('')} className="mb-4" />}

          {profileLoading ? (
            <div className="flex justify-center items-center h-32">
              <Spinner size="md" color="#219377" />
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
                disabled={true} // Email should not be directly editable here for security/auth flow reasons
                className="opacity-70 cursor-not-allowed"
                infoText="Email cannot be changed here. Contact support for email updates." // Helper text
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

              {/* Notification Preferences */}
              <div className="flex items-center space-x-3 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                  variant="primary"
                  className="py-2.5 px-6"
                  loading={profileLoading}
                  disabled={profileLoading}
                >
                  <Save className="w-5 h-5 mr-2" /> Save Profile
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
            <Lock className="w-6 h-6 mr-2 text-green-700" />
            Change Password
          </h2>
          {passwordMessage && <Alert type={passwordMessageType} message={passwordMessage} onClose={() => setPasswordMessage('')} className="mb-4" />}

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="relative">
              <Input
                label="Current Password"
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
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
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
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
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                type={showConfirmNewPassword ? "text" : "password"}
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
                onClick={() => setShowConfirmNewPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors top-8"
                aria-label={showConfirmNewPassword ? "Hide confirmed new password" : "Show confirmed new password"}
                tabIndex={-1}
              >
                {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                variant="secondary" // Using secondary variant for password change button
                className="py-2.5 px-6"
                loading={passwordLoading}
                disabled={passwordLoading}
              >
                <Save className="w-5 h-5 mr-2" /> Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
  );
}

export default MyProfilePage;
