// frontend/src/pages/admin/AdminSystemPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as adminService from "../../services/adminService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import useForm from '../../hooks/useForm.js';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { 
  Activity, BellRing, Server, CheckCircle, XCircle, Database, 
  Cpu, MemoryStick, Code, Settings, HardDrive, Users, Bell,
  RefreshCw, Shield, Clock, AlertCircle
} from 'lucide-react';
import { USER_ROLES } from '../../utils/constants.js';

// --- Helper Functions ---
const formatUptime = (totalSeconds) => {
  if (!totalSeconds && totalSeconds !== 0) return 'Unknown';
  
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (seconds > 0 || result.length === 0) result.push(`${seconds}s`);
  
  return result.join(' ');
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return 'Unknown';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Form validation for broadcast notifications
const validateBroadcastForm = (values) => {
  const errors = {};
  
  if (!values.title.trim()) {
    errors.title = 'Title is required';
  } else if (values.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
  }
  
  if (!values.message.trim()) {
    errors.message = 'Message content is required';
  } else if (values.message.length > 500) {
    errors.message = 'Message must be less than 500 characters';
  }
  
  return errors;
};

// --- Reusable UI Components ---
const HealthStat = ({ icon: Icon, label, value, status, tooltip }) => {
  let statusColor = 'text-gray-600';
  if (status === 'good') statusColor = 'text-green-600';
  if (status === 'warning') statusColor = 'text-amber-600';
  if (status === 'bad') statusColor = 'text-red-600';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200/80 hover:bg-gray-100 transition-colors" title={tooltip}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-gray-500">
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <span className={`font-bold ${statusColor}`}>{value}</span>
    </div>
  );
};

const StorageCard = ({ storage, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-gray-200 flex justify-center items-center h-48">
        <LoadingSpinner size="md" />
      </div>
    );
  }
  
  if (!storage) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center h-48 text-gray-500">
        <XCircle className="w-10 h-10 mb-2 text-red-500" />
        <p>Storage data unavailable</p>
      </div>
    );
  }
  
  const usedPercent = (storage.used / storage.total * 100) || 0;
  const barColor = usedPercent > 90 ? 'bg-red-500' : usedPercent > 70 ? 'bg-amber-500' : 'bg-green-500';
  
  return (
    <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <HardDrive className="w-5 h-5 mr-2 text-blue-600" />
          Storage Usage
        </h3>
        <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {formatBytes(storage.used)} / {formatBytes(storage.total)}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className={`${barColor} h-2.5 rounded-full transition-all duration-500`} 
          style={{ width: `${Math.min(usedPercent, 100)}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{usedPercent.toFixed(1)}% Used</span>
        <span>{(100 - usedPercent).toFixed(1)}% Free</span>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 p-3 rounded border border-gray-100">
          <p className="text-xs text-gray-500">Media Files</p>
          <p className="font-semibold">{storage.mediaFiles || 0}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded border border-gray-100">
          <p className="text-xs text-gray-500">Documents</p>
          <p className="font-semibold">{storage.documentFiles || 0}</p>
        </div>
      </div>
    </div>
  );
};

const ActiveUsersCard = ({ activeUsers, isLoading, onRefresh }) => {
  const getStatusClass = (lastSeen) => {
    if (!lastSeen) return "bg-gray-100 text-gray-800";
    
    const lastSeenTime = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    const minutesAgo = Math.floor((now - lastSeenTime) / (1000 * 60));
    
    if (minutesAgo < 5) return "bg-green-100 text-green-800";
    if (minutesAgo < 15) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Users className="w-5 h-5 mr-2 text-indigo-600" />
          Active Users
        </h3>
        <button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          title="Refresh active users"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="sm" />
        </div>
      ) : activeUsers && activeUsers.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {activeUsers.map((user, index) => (
            <div key={user._id || index} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-800">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getStatusClass(user.lastActive)}`}>
                {user.lastActive ? new Date(user.lastActive).toLocaleTimeString() : 'Unknown'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <Users className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-sm">No active users found</p>
        </div>
      )}
    </div>
  );
};

const AdminSystemPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  
  // State management
  const [systemHealth, setSystemHealth] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  
  // Loading states
  const [healthLoading, setHealthLoading] = useState(true);
  const [storageLoading, setStorageLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Error states
  const [healthError, setHealthError] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [usersError, setUsersError] = useState(null);
  
  // Abort controllers for cancelling API requests
  const healthAbortController = useRef(null);
  const storageAbortController = useRef(null);
  const usersAbortController = useRef(null);
  
  // Broadcast notification form
  const {
    values: broadcastForm,
    errors: broadcastErrors,
    handleChange: handleBroadcastChange,
    handleSubmit: handleBroadcastSubmit,
    isSubmitting: isBroadcasting,
    resetForm: resetBroadcastForm
  } = useForm(
    { 
      title: '', 
      message: '', 
      targetRole: 'all',
      priority: 'normal'
    },
    validateBroadcastForm,
    async (values) => {
      try {
        const response = await adminService.sendSystemBroadcastNotification({
          title: values.title,
          message: values.message,
          targetRole: values.targetRole,
          priority: values.priority
        });
        
        showSuccess(response.message || 'Broadcast notification sent successfully!');
        resetBroadcastForm();
      } catch (error) {
        showError(error.message || 'Failed to send broadcast notification');
      }
    }
  );

  // Fetch system health data
  const fetchSystemHealth = useCallback(async () => {
    // Cancel any ongoing request
    if (healthAbortController.current) {
      healthAbortController.current.abort();
    }
    
    // Create new abort controller
    healthAbortController.current = new AbortController();
    const signal = healthAbortController.current.signal;
    
    setHealthLoading(true);
    setHealthError(null);
    
    try {
      const response = await adminService.getSystemHealthSummary(signal);
      setSystemHealth(response.data);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        setHealthError(error.message || 'Failed to load system health data');
        console.error('Error fetching system health:', error);
      }
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch storage statistics
  const fetchStorageStats = useCallback(async () => {
    // Cancel any ongoing request
    if (storageAbortController.current) {
      storageAbortController.current.abort();
    }
    
    // Create new abort controller
    storageAbortController.current = new AbortController();
    const signal = storageAbortController.current.signal;
    
    setStorageLoading(true);
    setStorageError(null);
    
    try {
      const response = await adminService.getMediaStorageStats(signal);
      setStorageStats(response.data);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        setStorageError(error.message || 'Failed to load storage statistics');
        console.error('Error fetching storage stats:', error);
      }
    } finally {
      setStorageLoading(false);
    }
  }, []);

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    // Cancel any ongoing request
    if (usersAbortController.current) {
      usersAbortController.current.abort();
    }
    
    // Create new abort controller
    usersAbortController.current = new AbortController();
    const signal = usersAbortController.current.signal;
    
    setUsersLoading(true);
    setUsersError(null);
    
    try {
      const response = await adminService.getCurrentlyActiveUsers({ minutes: 15 }, signal);
      setActiveUsers(response.data || []);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        setUsersError(error.message || 'Failed to load active users');
        console.error('Error fetching active users:', error);
      }
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchSystemHealth();
    fetchStorageStats();
    fetchActiveUsers();
    
    // Set up polling for active users (every 30 seconds)
    const usersPollInterval = setInterval(fetchActiveUsers, 30000);
    
    // Cleanup function
    return () => {
      clearInterval(usersPollInterval);
      
      if (healthAbortController.current) {
        healthAbortController.current.abort();
      }
      
      if (storageAbortController.current) {
        storageAbortController.current.abort();
      }
      
      if (usersAbortController.current) {
        usersAbortController.current.abort();
      }
    };
  }, [fetchSystemHealth, fetchStorageStats, fetchActiveUsers]);

  // Target role options for broadcast form
  const targetRoleOptions = [
    { value: 'all', label: 'All Users' },
    ...Object.entries(USER_ROLES).map(([key, value]) => ({
      value: value.toLowerCase(),
      label: `${key} Only`
    }))
  ];

  // Priority options for broadcast form
  const priorityOptions = [
    { value: 'low', label: 'Low - Informational' },
    { value: 'normal', label: 'Normal - Standard' },
    { value: 'high', label: 'High - Important' },
    { value: 'urgent', label: 'Urgent - Critical' }
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377] flex items-center">
          <Settings className="w-8 h-8 mr-3" />
          System Management
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor system health, resource usage, and send notifications to users.
        </p>
      </div>

      {/* System Stats and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* System Health Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2] h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#219377] flex items-center">
                <Activity className="w-5 h-5 mr-2" /> System Health & Status
              </h2>
              <button 
                onClick={fetchSystemHealth} 
                disabled={healthLoading}
                className="p-2 text-[#219377] hover:bg-[#e6f7f2] rounded-full disabled:opacity-50 transition-colors"
                title="Refresh system health data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            {healthLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="md" color="#219377" />
              </div>
            ) : healthError ? (
              <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <AlertCircle className="w-12 h-12 mb-3" />
                <p className="font-semibold">Failed to load system health data</p>
                <p className="text-sm mt-1">{healthError}</p>
                <button 
                  onClick={fetchSystemHealth}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : systemHealth ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HealthStat 
                  icon={Database} 
                  label="Database" 
                  value={systemHealth.database || 'Unknown'} 
                  status={systemHealth.database === 'connected' ? 'good' : 'bad'}
                  tooltip="Database connection status" 
                />
                
                <HealthStat 
                  icon={Server} 
                  label="Server Uptime" 
                  value={formatUptime(systemHealth.uptime)} 
                  status={systemHealth.uptime > 3600 ? 'good' : 'warning'}
                  tooltip="How long the server has been running" 
                />
                
                <HealthStat 
                  icon={Clock} 
                  label="Response Time" 
                  value={systemHealth.responseTime ? `${systemHealth.responseTime.toFixed(2)} ms` : 'Unknown'} 
                  status={systemHealth.responseTime < 100 ? 'good' : systemHealth.responseTime < 300 ? 'warning' : 'bad'}
                  tooltip="Average API response time" 
                />
                
                <HealthStat 
                  icon={MemoryStick} 
                  label="Memory Usage" 
                  value={systemHealth.memoryUsage ? `${(systemHealth.memoryUsage.usedMem / systemHealth.memoryUsage.totalMem * 100).toFixed(1)}%` : 'Unknown'} 
                  status={systemHealth.memoryUsage && systemHealth.memoryUsage.usedMem / systemHealth.memoryUsage.totalMem < 0.7 ? 'good' : 'warning'}
                  tooltip="Current server memory usage" 
                />
                
                <HealthStat 
                  icon={Cpu} 
                  label="CPU Load" 
                  value={systemHealth.cpuLoad ? `${(systemHealth.cpuLoad * 100).toFixed(1)}%` : 'Unknown'} 
                  status={systemHealth.cpuLoad < 0.5 ? 'good' : systemHealth.cpuLoad < 0.8 ? 'warning' : 'bad'}
                  tooltip="Current CPU utilization" 
                />
                
                <HealthStat 
                  icon={Code} 
                  label="Environment" 
                  value={systemHealth.environment || 'Unknown'} 
                  status={systemHealth.environment === 'production' ? 'good' : 'warning'}
                  tooltip="Current deployment environment" 
                />
                
                <HealthStat 
                  icon={Shield} 
                  label="System Status" 
                  value={systemHealth.status || 'Unknown'} 
                  status={systemHealth.status === 'healthy' ? 'good' : systemHealth.status === 'degraded' ? 'warning' : 'bad'}
                  tooltip="Overall system health status" 
                />
                
                <HealthStat 
                  icon={Users} 
                  label="Total Users" 
                  value={systemHealth.userCount || 'Unknown'} 
                  tooltip="Total registered users in the system" 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <XCircle className="w-12 h-12 mb-3" />
                <p className="font-semibold">No system health data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-8">
          {/* Storage Stats Card */}
          <StorageCard storage={storageStats} isLoading={storageLoading} />
          
          {/* Active Users Card */}
          <ActiveUsersCard 
            activeUsers={activeUsers} 
            isLoading={usersLoading}
            onRefresh={fetchActiveUsers}
          />
        </div>
      </div>
      
      {/* Broadcast Notification Section */}
      <section className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-xl font-semibold mb-6 text-[#219377] flex items-center">
          <Bell className="w-5 h-5 mr-2" /> Send System Broadcast
        </h2>
        
        <form onSubmit={handleBroadcastSubmit} className="space-y-6">
          <Input
            label="Notification Title"
            id="title"
            name="title"
            value={broadcastForm.title}
            onChange={handleBroadcastChange}
            placeholder="Enter broadcast title..."
            maxLength={100}
            error={broadcastErrors.title}
            disabled={isBroadcasting}
            required
          />
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows="5"
              value={broadcastForm.message}
              onChange={handleBroadcastChange}
              placeholder="Enter the message content for your broadcast..."
              maxLength={500}
              disabled={isBroadcasting}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:outline-none ${
                broadcastErrors.message 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-[#219377] focus:ring-[#e6f7f2]'
              } ${isBroadcasting ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              required
            ></textarea>
            {broadcastErrors.message ? (
              <p className="mt-1 text-xs text-red-500">{broadcastErrors.message}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Remaining: {500 - (broadcastForm.message?.length || 0)} characters
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                id="targetRole"
                name="targetRole"
                value={broadcastForm.targetRole}
                onChange={handleBroadcastChange}
                disabled={isBroadcasting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:outline-none focus:border-[#219377] focus:ring-[#e6f7f2] bg-white"
              >
                {targetRoleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority Level
              </label>
              <select
                id="priority"
                name="priority"
                value={broadcastForm.priority}
                onChange={handleBroadcastChange}
                disabled={isBroadcasting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:outline-none focus:border-[#219377] focus:ring-[#e6f7f2] bg-white"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              className="py-2.5 px-6 rounded-lg bg-[#ffbd59] hover:bg-[#e7a741] text-[#1c2522] shadow-md transition-colors flex items-center"
              loading={isBroadcasting}
              disabled={isBroadcasting}
            >
              <BellRing className="w-5 h-5 mr-2" />
              {isBroadcasting ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AdminSystemPage;