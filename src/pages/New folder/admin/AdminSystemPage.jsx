import React, { useState, useEffect } from 'react';
import * as adminService from "../../services/adminService.js";

const AdminSystemPage = () => {
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState('');

  const [broadcast, setBroadcast] = useState({ title: '', message: '', targetRole: 'All' });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoadingHealth(true);
        const response = await adminService.getSystemHealthSummary();
        setHealth(response.data);
        setHealthError('');
      } catch (err) {
        setHealthError('Failed to load system health. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoadingHealth(false);
      }
    };
    fetchHealth();
  }, []);

  const handleBroadcastChange = (e) => {
    setBroadcast(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title.trim() || !broadcast.message.trim()) {
      setBroadcastMessage({ type: 'error', text: 'Title and message are required.' });
      return;
    }
    setBroadcastLoading(true);
    setBroadcastMessage('');
    try {
      const response = await adminService.sendSystemBroadcastNotification(broadcast);
      setBroadcastMessage({ type: 'success', text: response.data.message });
      setBroadcast({ title: '', message: '', targetRole: 'All' }); // Reset form
    } catch (err) {
      setBroadcastMessage({ type: 'error', text: 'Failed to send broadcast: ' + (err.response?.data?.message || err.message) });
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">System Health</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          {loadingHealth && <p>Loading system health...</p>}
          {healthError && <p className="text-red-500">{healthError}</p>}
          {health && (
            <ul className="space-y-2">
              <li><strong>Database Status:</strong> <span className={health.databaseStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}>{health.databaseStatus}</span></li>
              <li><strong>Server Uptime:</strong> {(health.uptimeInSeconds / 3600).toFixed(2)} hours</li>
              <li><strong>Node Version:</strong> {health.nodeVersion}</li>
              <li><strong>Platform:</strong> {health.platform}</li>
              {/* You can format memoryUsage better if needed */}
              <li><strong>Memory Usage (RSS):</strong> {(health.memoryUsage?.rss / 1024 / 1024).toFixed(2)} MB</li>
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Broadcast Notification</h2>
        <form onSubmit={handleSendBroadcast} className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              id="title"
              value={broadcast.title}
              onChange={handleBroadcastChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              name="message"
              id="message"
              rows="4"
              value={broadcast.message}
              onChange={handleBroadcastChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700">Target Role</label>
            <select
              name="targetRole"
              id="targetRole"
              value={broadcast.targetRole}
              onChange={handleBroadcastChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="All">All Users</option>
              <option value="Tenant">All Tenants</option>
              <option value="Landlord">All Landlords</option>
              <option value="PropertyManager">All Property Managers</option>
              <option value="Admin">All Admins</option>
            </select>
          </div>
          {broadcastMessage && (
            <p className={`text-sm ${broadcastMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {broadcastMessage.text}
            </p>
          )}
          <div>
            <button
              type="submit"
              disabled={broadcastLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#219377] hover:bg-[#1e7f66] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e7f66] disabled:opacity-50"
            >
              {broadcastLoading ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSystemPage;