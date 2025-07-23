// frontend/src/pages/admin/AdminProfilePage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { User, Lock, Bell, Save, Eye, EyeOff, Shield } from "lucide-react";

import Input from "../../components/common/Input.jsx"; 
import Button from "../../components/common/Button.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import * as userService from "../../services/userService.js";
import * as authService from "../../services/authService.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx";
import useForm from "../../hooks/useForm.js";

// Theme colors
const PRIMARY_COLOR = "#219377"; // Green
const SECONDARY_COLOR = "#ffbd59"; // Orange

/**
 * Validates the profile form data
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
const validateProfileForm = (values) => {
  const errors = {};
  
  if (!values.firstName?.trim()) {
    errors.firstName = "First name is required";
  }
  
  if (!values.lastName?.trim()) {
    errors.lastName = "Last name is required";
  }
  
  if (values.phone && !/^\+?[\d\s()-]{7,20}$/.test(values.phone.trim())) {
    errors.phone = "Please enter a valid phone number";
  }
  
  return errors;
};

/**
 * Validates the password change form data
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
const validatePasswordForm = (values) => {
  const errors = {};
  
  if (!values.currentPassword) {
    errors.currentPassword = "Current password is required";
  }
  
  if (!values.newPassword) {
    errors.newPassword = "New password is required";
  } else if (values.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters long";
  }
  
  if (!values.confirmNewPassword) {
    errors.confirmNewPassword = "Please confirm your password";
  } else if (values.newPassword !== values.confirmNewPassword) {
    errors.confirmNewPassword = "Passwords do not match";
  }
  
  return errors;
};

/**
 * Validates notification preferences form
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
const validateNotificationForm = (values) => {
  // No specific validation rules needed for checkboxes
  return {};
};

const AdminProfilePage = () => {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  // Request cancellation
  const profileAbortController = useRef(null);
  
  // Loading state for initial profile fetch
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile form
  const {
    values: profileData,
    errors: profileErrors,
    setValues: setProfileData,
    handleChange: handleProfileChange,
    handleSubmit: handleProfileSubmit,
    isSubmitting: isProfileSubmitting
  } = useForm(
    {
      firstName: "",
      lastName: "",
      email: "",
      phone: ""
    },
    validateProfileForm,
    async (values) => {
      try {
        // Call API with updated profile data
        const updatedUser = await userService.updateMyProfile({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone
        });
        
        // Update auth context if the API call was successful
        if (setUser) {
          setUser(prevUser => ({
            ...prevUser,
            firstName: updatedUser.firstName || prevUser.firstName,
            lastName: updatedUser.lastName || prevUser.lastName,
            phone: updatedUser.phone || prevUser.phone
          }));
        }
        
        showSuccess("Profile updated successfully!");
      } catch (error) {
        showError(error.message || "Failed to update profile");
        console.error("Profile update error:", error);
      }
    }
  );

  // Password change form
  const {
    values: passwordData,
    errors: passwordErrors,
    handleChange: handlePasswordChange,
    handleSubmit: handlePasswordSubmit,
    resetForm: resetPasswordForm,
    isSubmitting: isPasswordSubmitting
  } = useForm(
    {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: ""
    },
    validatePasswordForm,
    async (values) => {
      try {
        // Call API to change password
        await authService.changePassword(
          values.currentPassword,
          values.newPassword
        );
        
        resetPasswordForm();
        showSuccess("Password changed successfully!");
      } catch (error) {
        showError(error.message || "Failed to change password");
        console.error("Password change error:", error);
      }
    }
  );

  // Notification preferences form
  const {
    values: notificationData,
    errors: notificationErrors,
    setValues: setNotificationData,
    handleChange: handleNotificationChange,
    handleSubmit: handleNotificationSubmit,
    isSubmitting: isNotificationSubmitting
  } = useForm(
    {
      emailNotifications: true,
      smsNotifications: false,
      appNotifications: true
    },
    validateNotificationForm,
    async (values) => {
      try {
        // Call API to update notification preferences
        const preferences = {
          channels: [],
          emailSettings: { enabled: values.emailNotifications },
          smsSettings: { enabled: values.smsNotifications },
          appSettings: { enabled: values.appNotifications }
        };
        
        // Add enabled channels to the channels array
        if (values.emailNotifications) preferences.channels.push('email');
        if (values.smsNotifications) preferences.channels.push('sms');
        if (values.appNotifications) preferences.channels.push('app');
        
        await userService.updateNotificationPreferences(preferences);
        showSuccess("Notification preferences updated successfully!");
      } catch (error) {
        showError(error.message || "Failed to update notification preferences");
        console.error("Notification update error:", error);
      }
    }
  );

  // Fetch user profile data
  const fetchProfileData = useCallback(async () => {
    // Cancel any ongoing request
    if (profileAbortController.current) {
      profileAbortController.current.abort();
    }
    
    // Create new abort controller
    profileAbortController.current = new AbortController();
    const signal = profileAbortController.current.signal;
    
    setInitialLoading(true);
    try {
      // Fetch user profile
      const userData = await userService.getMyProfile(signal);
      
      // Update profile form
      setProfileData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || ""
      });
      
      // Get notification preferences
      const preferences = userData.preferences || await userService.getNotificationPreferences(signal);
      
      // Update notification form based on preferences
      setNotificationData({
        emailNotifications: preferences?.emailSettings?.enabled || preferences?.channels?.includes('email') || true,
        smsNotifications: preferences?.smsSettings?.enabled || preferences?.channels?.includes('sms') || false,
        appNotifications: preferences?.appSettings?.enabled || preferences?.channels?.includes('app') || true
      });
      
    } catch (error) {
      if (error.message !== "Request Aborted" && error.message !== "Request canceled") {
        showError("Failed to load profile data: " + error.message);
        console.error("Error fetching profile:", error);
      }
    } finally {
      setInitialLoading(false);
    }
  }, [showError, setProfileData, setNotificationData]);

  // Load profile data on component mount
  useEffect(() => {
    fetchProfileData();
    
    // Cleanup function to cancel pending requests
    return () => {
      if (profileAbortController.current) {
        profileAbortController.current.abort();
      }
    };
  }, [fetchProfileData]);

  // Handle password visibility toggle
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Render loading state
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f8fafc]">
        <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
        <p className="ml-4 text-xl font-semibold text-gray-700">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f8fafc] min-h-full">
      <h1 className="text-3xl font-extrabold mb-6 text-[#219377] border-b pb-3 flex items-center">
        <Shield className="w-8 h-8 mr-3 text-[#219377]" />
        Admin Profile & Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Profile Information */}
        <div className="lg:col-span-2">
          <section className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
            <h2 className="text-xl font-semibold mb-5 text-[#219377] flex items-center">
              <User className="w-5 h-5 mr-2 text-[#219377]" />
              Personal Information
            </h2>
            
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="First Name"
                  id="firstName"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  placeholder="Your first name"
                  error={profileErrors.firstName}
                  disabled={isProfileSubmitting}
                  required
                />
                
                <Input
                  label="Last Name"
                  id="lastName"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  placeholder="Your last name"
                  error={profileErrors.lastName}
                  disabled={isProfileSubmitting}
                  required
                />
              </div>
              
              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                disabled={true}
                className="bg-gray-50"
                infoText="Email cannot be changed. Contact support if you need to update your email."
              />
              
              <Input
                label="Phone Number"
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                placeholder="Your phone number"
                error={profileErrors.phone}
                disabled={isProfileSubmitting}
              />
              
              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  className="bg-[#219377] hover:bg-[#1b7c66] text-white px-6 py-2.5 rounded-lg shadow-sm flex items-center"
                  loading={isProfileSubmitting}
                  disabled={isProfileSubmitting}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isProfileSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </section>
          
          {/* Password Section */}
          <section className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
            <h2 className="text-xl font-semibold mb-5 text-[#219377] flex items-center">
              <Lock className="w-5 h-5 mr-2 text-[#219377]" />
              Change Password
            </h2>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="relative">
                <Input
                  label="Current Password"
                  id="currentPassword"
                  name="currentPassword"
                  type={showPassword.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                  error={passwordErrors.currentPassword}
                  disabled={isPasswordSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-9 text-gray-500"
                  tabIndex="-1"
                >
                  {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  label="New Password"
                  id="newPassword"
                  name="newPassword"
                  type={showPassword.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="At least 8 characters"
                  error={passwordErrors.newPassword}
                  disabled={isPasswordSubmitting}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-9 text-gray-500"
                  tabIndex="-1"
                >
                  {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  label="Confirm New Password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm your new password"
                  error={passwordErrors.confirmNewPassword}
                  disabled={isPasswordSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-9 text-gray-500"
                  tabIndex="-1"
                >
                  {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  className="bg-[#ffbd59] hover:bg-[#e7a741] text-gray-900 px-6 py-2.5 rounded-lg shadow-sm flex items-center"
                  loading={isPasswordSubmitting}
                  disabled={isPasswordSubmitting}
                >
                  <Lock className="w-5 h-5 mr-2" />
                  {isPasswordSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </section>
        </div>
        
        {/* Column 2: Notification Preferences & Role Info */}
        <div className="lg:col-span-1">
          {/* Role Information Card */}
          <section className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
            <h2 className="text-xl font-semibold mb-5 text-[#219377] flex items-center">
              <Shield className="w-5 h-5 mr-2 text-[#219377]" />
              Admin Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-700" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Administrator</h3>
                  <p className="text-sm text-gray-600">Full platform access and management</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 space-y-2 mt-3 p-3 bg-gray-50 rounded-lg">
                <p>As an administrator, you have full access to manage all aspects of the platform, including:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>User management</li>
                  <li>Property and unit administration</li>
                  <li>System configuration</li>
                  <li>Access to all reports and analytics</li>
                </ul>
              </div>
              
              <div className="text-xs text-gray-500 mt-3">
                <p>Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Unknown'}</p>
                <p>Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}</p>
              </div>
            </div>
          </section>
          
          {/* Notification Preferences */}
          <section className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2]">
            <h2 className="text-xl font-semibold mb-5 text-[#219377] flex items-center">
              <Bell className="w-5 h-5 mr-2 text-[#219377]" />
              Notification Preferences
            </h2>
            
            <form onSubmit={handleNotificationSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    checked={notificationData.emailNotifications}
                    onChange={handleNotificationChange}
                    disabled={isNotificationSubmitting}
                    className="w-4 h-4 text-[#219377] rounded border-gray-300 focus:ring-[#219377]"
                  />
                  <label htmlFor="emailNotifications" className="ml-3 flex-1 text-gray-700">
                    Email Notifications
                  </label>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    name="smsNotifications"
                    checked={notificationData.smsNotifications}
                    onChange={handleNotificationChange}
                    disabled={isNotificationSubmitting}
                    className="w-4 h-4 text-[#219377] rounded border-gray-300 focus:ring-[#219377]"
                  />
                  <label htmlFor="smsNotifications" className="ml-3 flex-1 text-gray-700">
                    SMS Notifications
                  </label>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    id="appNotifications"
                    name="appNotifications"
                    checked={notificationData.appNotifications}
                    onChange={handleNotificationChange}
                    disabled={isNotificationSubmitting}
                    className="w-4 h-4 text-[#219377] rounded border-gray-300 focus:ring-[#219377]"
                  />
                  <label htmlFor="appNotifications" className="ml-3 flex-1 text-gray-700">
                    In-App Notifications
                  </label>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2 mb-4">
                Choose how you want to receive notifications about system events, user actions, and important updates.
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg shadow-sm flex items-center text-sm"
                  loading={isNotificationSubmitting}
                  disabled={isNotificationSubmitting}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {isNotificationSubmitting ? "Updating..." : "Update Notifications"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;