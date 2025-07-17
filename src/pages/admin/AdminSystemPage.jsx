// frontend/src/pages/admin/AdminSystemPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js"; // Ensure .js extension
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx'; // Import useGlobalAlert
import useForm from '../../hooks/useForm.js'; // Import useForm hook
import Input from '../../components/common/Input.jsx'; // Ensure .jsx extension
import Button from '../../components/common/Button.jsx'; // Ensure .jsx extension
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'; // Using LoadingSpinner
import { Activity, BellRing } from 'lucide-react'; // Icons for System Health and Broadcast
import { USER_ROLES } from '../../utils/constants.js'; // Import USER_ROLES for broadcast target roles

/**
 * Helper function to format uptime from seconds to a human-readable string.
 * @param {number} totalSeconds - Uptime in seconds.
 * @returns {string} Formatted uptime string.
 */
const formatUptime = (totalSeconds) => {
  const days = Math.floor(totalSeconds / (3600 * 24));
  totalSeconds %= (3600 * 24);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (seconds > 0 || result.length === 0) result.push(`${seconds}s`); // Always show seconds if nothing else or if it's just seconds

  return result.join(' ');
};

/**
 * Client-side validation for the broadcast notification form.
 * @param {object} values - The form values { title, message, targetRole }.
 * @returns {object} An object containing validation errors.
 */
const validateBroadcastForm = (values) => {
  const errors = {};
  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  }
  if (!values.message.trim()) {
    errors.message = 'Message is required.';
  }
  return errors;
};

const AdminSystemPage = () => {
  const { showSuccess, showError } = useGlobalAlert();

  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Initialize useForm for the broadcast notification form
  const {
    values: broadcast,
    errors: broadcastErrors,
    handleChange: handleBroadcastChange,
    handleSubmit: handleSendBroadcast,
    isSubmitting: broadcastLoading,
    resetForm: resetBroadcastForm // To clear the form after successful submission
  } = useForm(
    { title: '', message: '', targetRole: 'All' }, // Default targetRole
    validateBroadcastForm,
    async (formValues) => {
      try {
        const payload = {
          ...formValues,
          // Ensure targetRole is sent as lowercase if backend expects it
          targetRole: formValues.targetRole === 'All' ? 'all' : formValues.targetRole.toLowerCase(),
        };
        const response = await adminService.sendSystemBroadcastNotification(payload);
        showSuccess(response.message || 'Broadcast notification sent successfully!');
        resetBroadcastForm(); // Clear the form
      } catch (err) {
        console.error("Send broadcast error:", err);
        showError(err.response?.data?.message || 'Failed to send broadcast notification. Please try again.');
      }
    }
  );

  // Fetch system health on component mount
  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const response = await adminService.getSystemHealthSummary();
      setHealth(response.data);
    } catch (err) {
      console.error("Failed to load system health:", err);
      showError('Failed to load system health summary. Please try again.');
    } finally {
      setLoadingHealth(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Options for target role dropdown, including 'All Users'
  const targetRoleOptions = [
    { value: 'All', label: 'All Users' },
    ...Object.values(USER_ROLES).map(role => ({
      value: role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' '), // Capitalize and replace underscores
      label: `All ${role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}s`
    }))
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">System Management</h1>

      {/* System Health Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-600" /> System Health
        </h2>
        {loadingHealth ? (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="md" color="#219377" className="mr-3" />
            <p className="text-gray-700">Loading system health...</p>
          </div>
        ) : health ? (
          <ul className="space-y-3 text-gray-700">
            <li className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
              <strong>Database Status:</strong>
              <span className={`font-medium ${health.databaseStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
                {health.databaseStatus}
              </span>
            </li>
            <li className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
              <strong>Server Uptime:</strong>
              <span>{formatUptime(health.uptimeInSeconds)}</span>
            </li>
            <li className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
              <strong>Node Version:</strong>
              <span>{health.nodeVersion}</span>
            </li>
            <li className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
              <strong>Platform:</strong>
              <span>{health.platform}</span>
            </li>
            <li className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
              <strong>Memory Usage (RSS):</strong>
              <span>{(health.memoryUsage?.rss / 1024 / 1024).toFixed(2)} MB</span>
            </li>
          </ul>
        ) : (
          <p className="text-red-500">Failed to load system health data. Check console for details.</p>
        )}
      </div>

      {/* Broadcast Notification Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <BellRing className="w-6 h-6 mr-2 text-purple-600" /> Send Broadcast Notification
        </h2>
        <form onSubmit={handleSendBroadcast} className="space-y-5">
          <Input
            label="Title"
            id="broadcast-title"
            name="title"
            type="text"
            value={broadcast.title}
            onChange={handleBroadcastChange}
            placeholder="e.g., Important System Update"
            required
            error={broadcastErrors.title}
            disabled={broadcastLoading}
          />
          <div className="relative">
            <label htmlFor="broadcast-message" className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              id="broadcast-message"
              rows="4"
              value={broadcast.message}
              onChange={handleBroadcastChange}
              required
              className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${broadcastErrors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${broadcastLoading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              disabled={broadcastLoading}
            />
            {broadcastErrors.message && <p className="mt-1 text-xs text-red-500">{broadcastErrors.message}</p>}
          </div>

          <div>
            <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <select
              name="targetRole"
              id="targetRole"
              value={broadcast.targetRole}
              onChange={handleBroadcastChange}
              required
              className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
                ${broadcastErrors.targetRole ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
                ${broadcastLoading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
              `}
              disabled={broadcastLoading}
            >
              {targetRoleOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {broadcastErrors.targetRole && <p className="mt-1 text-xs text-red-500">{broadcastErrors.targetRole}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            loading={broadcastLoading}
            disabled={broadcastLoading}
          >
            {broadcastLoading ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminSystemPage;
