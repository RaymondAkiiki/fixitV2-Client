import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Bell, 
  Check, 
  Loader2, 
  Filter, 
  Trash2, 
  Settings, 
  ChevronRight, 
  ChevronDown, 
  MessageSquare, 
  CheckCircle2,
  Mail,
  Smartphone
} from "lucide-react";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { formatDistanceToNow } from "date-fns";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import * as notificationService from "../../services/notificationService";

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const NotificationListPage = () => {
  const { showSuccess, showError } = useGlobalAlert();
  
  // State for notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // State for preferences section
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    channels: ["in_app", "email"],
    emailSettings: {},
    smsSettings: {}
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Available notification types
  const notificationTypes = [
    { id: "maintenance_request", label: "Maintenance Requests" },
    { id: "lease_expiry", label: "Lease Expiry" },
    { id: "rent_due", label: "Rent Due" },
    { id: "rent_overdue", label: "Rent Overdue" },
    { id: "comment", label: "Comments" },
    { id: "mention", label: "Mentions" },
    { id: "daily_digest", label: "Daily Digest" },
    { id: "system_alert", label: "System Alerts" }
  ];

  // Fetch notifications with current filters
  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const params = {
        page: currentPage,
        limit,
        readStatus: filter !== "all" ? filter : undefined
      };
      
      const response = await notificationService.getAllNotifications(params);
      
      const newNotifications = response.data || [];
      if (reset) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setUnreadCount(response.unreadCount || 0);
      setTotalCount(response.total || 0);
      setHasMore(currentPage < response.totalPages);
      if (reset) {
        setPage(1);
      }
      
      return response;
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications. " + (err.message || "Please try again."));
      return null;
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, limit, filter]);

  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      setLoadingPreferences(true);
      const response = await notificationService.getNotificationPreferences();
      if (response.success && response.data) {
        setPreferences({
          channels: response.data.channels || ["in_app"],
          emailSettings: response.data.emailSettings || {},
          smsSettings: response.data.smsSettings || {}
        });
      }
    } catch (err) {
      console.error("Failed to load notification preferences:", err);
      showError("Failed to load notification preferences");
    } finally {
      setLoadingPreferences(false);
    }
  }, [showError]);

  // Initial data load
  useEffect(() => {
    fetchNotifications(true);
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  // Update when filter changes
  useEffect(() => {
    fetchNotifications(true);
  }, [filter, fetchNotifications]);

  // Load more notifications
  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) return;
    setPage(prevPage => prevPage + 1);
    await fetchNotifications(false);
  };

  // Mark a notification as read
  const handleMarkAsRead = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      showSuccess("Notification marked as read");
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      showError("Failed to mark notification as read");
    } finally {
      setActionLoading(false);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      const result = await notificationService.markAllNotificationsAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        showSuccess("All notifications marked as read");
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      showError("Failed to mark all notifications as read");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (id) => {
    try {
      setActionLoading(true);
      const result = await notificationService.deleteNotification(id);
      if (result.success) {
        // Find notification to check if it was unread
        const notificationToDelete = notifications.find(n => n._id === id);
        const wasUnread = notificationToDelete && !notificationToDelete.read;
        
        // Update state
        setNotifications(prev => prev.filter(n => n._id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
        
        // Update unread count if needed
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        showSuccess("Notification deleted");
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
      showError("Failed to delete notification");
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return "unknown date";
    }
  };

  // Handle preferences changes
  const handleChannelToggle = (channel) => {
    setPreferences(prev => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel];
      
      return { ...prev, channels };
    });
  };

  const handleEmailSettingToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      emailSettings: {
        ...prev.emailSettings,
        [key]: !prev.emailSettings[key]
      }
    }));
  };

  const handleSmsSettingToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      smsSettings: {
        ...prev.smsSettings,
        [key]: !prev.smsSettings[key]
      }
    }));
  };

  // Save notification preferences
  const savePreferences = async () => {
    try {
      setSavingPreferences(true);
      const response = await notificationService.updateNotificationPreferences(preferences);
      if (response.success) {
        showSuccess("Notification preferences updated successfully");
        setPreferences(response.data);
      }
    } catch (err) {
      console.error("Failed to update notification preferences:", err);
      showError("Failed to update notification preferences");
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: PRIMARY_COLOR }}>
          <Bell className="w-7 h-7" style={{ color: SECONDARY_COLOR }} />
          Notifications
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your notifications and preferences
        </p>
      </div>

      {/* Toggle Preferences Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="flex items-center font-medium text-gray-700 hover:text-gray-900"
        >
          {showPreferences ? (
            <ChevronDown className="w-5 h-5 mr-2" />
          ) : (
            <ChevronRight className="w-5 h-5 mr-2" />
          )}
          <Settings className="w-5 h-5 mr-2" style={{ color: PRIMARY_COLOR }} />
          Notification Preferences
        </button>
      </div>

      {/* Notification Preferences Section */}
      {showPreferences && (
        <div className="bg-white rounded-lg shadow-md mb-8 p-6 border border-gray-200">
          {loadingPreferences ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading preferences...</span>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium mb-4" style={{ color: PRIMARY_COLOR }}>
                Notification Channels
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Choose how you want to receive notifications. You must select at least one channel.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="channel-in-app"
                      type="checkbox"
                      checked={preferences.channels.includes("in_app")}
                      onChange={() => handleChannelToggle("in_app")}
                      disabled={preferences.channels.length === 1 && preferences.channels.includes("in_app")}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="channel-in-app" className="font-medium text-gray-700">In-App Notifications</label>
                    <p className="text-gray-500">Receive notifications within the application</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="channel-email"
                      type="checkbox"
                      checked={preferences.channels.includes("email")}
                      onChange={() => handleChannelToggle("email")}
                      disabled={preferences.channels.length === 1 && preferences.channels.includes("email")}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="channel-email" className="font-medium text-gray-700">Email Notifications</label>
                    <p className="text-gray-500">Receive notifications via email</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="channel-sms"
                      type="checkbox"
                      checked={preferences.channels.includes("sms")}
                      onChange={() => handleChannelToggle("sms")}
                      disabled={preferences.channels.length === 1 && preferences.channels.includes("sms")}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="channel-sms" className="font-medium text-gray-700">SMS Notifications</label>
                    <p className="text-gray-500">Receive notifications via SMS (text message)</p>
                  </div>
                </div>
              </div>
              
              {preferences.channels.includes("email") && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2" style={{ color: PRIMARY_COLOR }} />
                    Email Notification Settings
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose which types of notifications you want to receive via email.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notificationTypes.map(type => (
                      <div key={`email-${type.id}`} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`email-${type.id}`}
                            type="checkbox"
                            checked={preferences.emailSettings[type.id] !== false}
                            onChange={() => handleEmailSettingToggle(type.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`email-${type.id}`} className="font-medium text-gray-700">{type.label}</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {preferences.channels.includes("sms") && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-4 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" style={{ color: PRIMARY_COLOR }} />
                    SMS Notification Settings
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose which types of notifications you want to receive via SMS. Standard message rates may apply.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notificationTypes.map(type => (
                      <div key={`sms-${type.id}`} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`sms-${type.id}`}
                            type="checkbox"
                            checked={preferences.smsSettings[type.id] !== false}
                            onChange={() => handleSmsSettingToggle(type.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`sms-${type.id}`} className="font-medium text-gray-700">{type.label}</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={savePreferences}
                  disabled={savingPreferences}
                  className="px-4 py-2 rounded-md"
                  style={{ backgroundColor: PRIMARY_COLOR, color: "white" }}
                >
                  {savingPreferences ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <></>}
                  Save Preferences
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Notifications section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-gray-500" />
              <span className="text-gray-600 mr-4">Filter:</span>
              
              <div className="flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className={`px-3 py-1 text-sm font-medium rounded-l-lg ${
                    filter === "all" 
                      ? `text-white bg-${PRIMARY_COLOR.replace('#', '')}`
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  } border border-gray-300`}
                  onClick={() => setFilter("all")}
                  style={filter === "all" ? { backgroundColor: PRIMARY_COLOR } : {}}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm font-medium ${
                    filter === "unread" 
                      ? `text-white bg-${PRIMARY_COLOR.replace('#', '')}`
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  } border-t border-b border-gray-300`}
                  onClick={() => setFilter("unread")}
                  style={filter === "unread" ? { backgroundColor: PRIMARY_COLOR } : {}}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm font-medium rounded-r-lg ${
                    filter === "read" 
                      ? `text-white bg-${PRIMARY_COLOR.replace('#', '')}`
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  } border border-gray-300`}
                  onClick={() => setFilter("read")}
                  style={filter === "read" ? { backgroundColor: PRIMARY_COLOR } : {}}
                >
                  Read ({totalCount - unreadCount})
                </button>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="flex items-center px-3 py-1 rounded-lg text-sm"
                style={{ backgroundColor: SECONDARY_COLOR, color: "#1c2522" }}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark All as Read
              </Button>
            )}
          </div>
        </div>
        
        {/* Notifications list */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-500">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert type="error" message={error} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications found</p>
            <p className="text-sm text-gray-400 mt-1">Any new notifications will appear here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li 
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        {/* Notification type badge */}
                        {notification.type && (
                          <span 
                            className="inline-block px-2 py-1 text-xs rounded-full"
                            style={{ 
                              backgroundColor: notification.read ? '#e5e7eb' : SECONDARY_COLOR,
                              color: notification.read ? '#4b5563' : '#1c2522'
                            }}
                          >
                            {notification.type.replace(/_/g, ' ')}
                          </span>
                        )}
                        
                        {/* Notification sender/source */}
                        <span className="text-sm font-medium text-gray-900">
                          {notification.sender ? (
                            `${notification.sender.firstName || ''} ${notification.sender.lastName || ''}`.trim() || notification.sender.email
                          ) : (
                            'System'
                          )}
                        </span>
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.createdAt || notification.sentAt)}
                      </span>
                    </div>
                    
                    {/* Notification message */}
                    <p className="mt-1 text-sm text-gray-700">
                      {notification.message}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="mt-2 flex items-center gap-3">
                      {notification.link && (
                        <Link 
                          to={notification.link}
                          className="text-xs font-medium hover:underline"
                          style={{ color: PRIMARY_COLOR }}
                        >
                          View details →
                        </Link>
                      )}
                      
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="text-xs font-medium flex items-center gap-1 hover:underline"
                          style={{ color: PRIMARY_COLOR }}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteNotification(notification._id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                    aria-label="Delete notification"
                    disabled={actionLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {/* Load more button */}
        {hasMore && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
            <Button
              onClick={loadMoreNotifications}
              disabled={loadingMore}
              className="px-4 py-2 text-sm font-medium bg-white rounded-md border hover:bg-gray-50"
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load more notifications'
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Comments section hint */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <MessageSquare className="w-6 h-6 mr-3 mt-1" style={{ color: PRIMARY_COLOR }} />
          <div>
            <h3 className="font-medium text-gray-900">Comments and Mentions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Comments and @mentions in maintenance requests, properties and other resources will trigger notifications. 
              You can customize which notifications you receive in the preferences section above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationListPage;