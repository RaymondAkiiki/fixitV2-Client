// src/contexts/NotificationContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as notificationService from '../services/notificationService.js';
import { useGlobalAlert } from './GlobalAlertContext.jsx';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { showError, showSuccess } = useGlobalAlert();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // State management
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // For polling unread count
  const pollingIntervalRef = useRef(null);
  const pollingDelayMs = 30000; // 30 seconds
  
  // Check if component should render based on auth state
  if (authLoading) {
    return null; // Don't render anything while auth is loading
  }
  
  /**
   * Fetch notifications with optional filters
   * @param {Object} options - Fetch options
   * @param {Object} [options.filters={}] - Query filters
   * @param {boolean} [options.reset=false] - Whether to reset pagination
   * @param {AbortSignal} [options.signal] - AbortSignal to cancel request
   */
  const fetchNotifications = useCallback(async (options = {}) => {
    const { filters = {}, reset = false, signal } = options;
    
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    
    // Set current page - reset to 1 if requested
    const currentPage = reset ? 1 : page;
    
    // Prepare parameters
    const params = {
      ...filters,
      page: currentPage,
      limit
    };
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getAllNotifications(params, signal);
      
      if (reset || currentPage === 1) {
        // Replace all notifications
        setNotifications(response.data || []);
      } else {
        // Append to existing notifications
        setNotifications(prev => [
          ...prev,
          ...(response.data || [])
        ]);
      }
      
      // Update counts and pagination
      setUnreadCount(response.unreadCount || 0);
      setTotalCount(response.total || 0);
      setTotalPages(response.totalPages || 1);
      
      // If reset was requested, make sure page is set to 1
      if (reset) {
        setPage(1);
      }
      
      return response;
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        const message = err.response?.data?.message || 'Failed to load notifications.';
        showError(message);
        setError(err);
        console.error('NotificationContext - Failed to fetch notifications:', err);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, limit, showError]);
  
  /**
   * Load more notifications (pagination)
   */
  const loadMoreNotifications = useCallback(async () => {
    if (page < totalPages && !loading) {
      setPage(prevPage => prevPage + 1);
      await fetchNotifications({ reset: false });
    }
  }, [page, totalPages, loading, fetchNotifications]);
  
  /**
   * Refresh notifications by resetting pagination and fetching again
   */
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications({ reset: true });
  }, [fetchNotifications]);
  
  /**
   * Fetch just the unread count
   * @param {AbortSignal} [signal] - AbortSignal to cancel request
   */
  const fetchUnreadCount = useCallback(async (signal) => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const response = await notificationService.getUnreadNotificationCount(signal);
      setUnreadCount(response.count || 0);
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch unread notification count:', err);
      }
    }
  }, [isAuthenticated]);
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   */
  const markAsRead = useCallback(async (notificationId) => {
    // Optimistically update the UI
    setNotifications(prev => 
      prev.map(n => 
        n._id === notificationId 
          ? { ...n, read: true } 
          : n
      )
    );
    
    // Update the unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (err) {
      // Revert the optimistic update
      showError(err.message || 'Failed to mark notification as read.');
      refreshNotifications();
    }
  }, [showError, refreshNotifications]);
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    // Optimistically update the UI
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    try {
      const result = await notificationService.markAllNotificationsAsRead();
      if (result.success) {
        showSuccess(result.message || 'All notifications marked as read.');
      }
    } catch (err) {
      // Revert the optimistic update
      showError(err.message || 'Failed to mark all notifications as read.');
      refreshNotifications();
    }
  }, [showSuccess, showError, refreshNotifications]);
  
  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   */
  const deleteNotification = useCallback(async (notificationId) => {
    // Optimistically update the UI
    const notificationToDelete = notifications.find(n => n._id === notificationId);
    const wasUnread = notificationToDelete && !notificationToDelete.read;
    
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    setTotalCount(prev => Math.max(0, prev - 1));
    
    // Update unread count if needed
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    try {
      const result = await notificationService.deleteNotification(notificationId);
      if (result.success) {
        showSuccess(result.message || 'Notification deleted successfully.');
      }
    } catch (err) {
      // Revert the optimistic update
      showError(err.message || 'Failed to delete notification.');
      refreshNotifications();
    }
  }, [notifications, showSuccess, showError, refreshNotifications]);
  
  /**
   * Fetch user notification preferences
   */
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      setPreferences(null);
      return;
    }
    
    try {
      const response = await notificationService.getNotificationPreferences();
      if (response.success) {
        setPreferences(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err);
      // Don't show an error to the user - this is background functionality
    }
  }, [isAuthenticated]);
  
  /**
   * Update user notification preferences
   * @param {Object} newPreferences - Updated preferences
   */
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      const response = await notificationService.updateNotificationPreferences(newPreferences);
      if (response.success) {
        setPreferences(response.data);
        showSuccess(response.message || 'Notification preferences updated successfully.');
        return response.data;
      }
    } catch (err) {
      showError(err.message || 'Failed to update notification preferences.');
      throw err;
    }
  }, [showSuccess, showError]);
  
  // Initial data fetch
  useEffect(() => {
    const controller = new AbortController();
    
    if (!authLoading && isAuthenticated) {
      // Fetch notifications and preferences
      fetchNotifications({ reset: true, signal: controller.signal });
      fetchPreferences();
      
      // Start polling for unread count
      pollingIntervalRef.current = setInterval(() => {
        fetchUnreadCount(new AbortController().signal);
      }, pollingDelayMs);
    } else if (!authLoading && !isAuthenticated) {
      // Reset state if not authenticated
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      setPreferences(null);
      setLoading(false);
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
    
    // Cleanup function
    return () => {
      controller.abort();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [authLoading, isAuthenticated, fetchNotifications, fetchPreferences, fetchUnreadCount]);
  
  // Memoized context value
  const value = useMemo(() => ({
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    page,
    limit,
    totalPages,
    preferences,
    fetchNotifications,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    setLimit,
    hasMore: page < totalPages
  }), [
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    page,
    limit,
    totalPages,
    preferences,
    fetchNotifications,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences
  ]);
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to use the notification context
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};