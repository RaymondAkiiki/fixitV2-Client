// frontend/src/contexts/NotificationContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as notificationService from '../services/notificationService.js';
import { useGlobalAlert } from './GlobalAlertContext.jsx'; // Import useGlobalAlert

// Create the NotificationContext
export const NotificationContext = createContext();

/**
 * NotificationProvider component
 * Provides notification state and functions to its children components.
 */
export const NotificationProvider = ({ children }) => {
    const { showError } = useGlobalAlert(); // Access global alert functions
    const { user, isAuthenticated, loading: authLoading } = useAuth(); // Get user and auth state

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true); // Changed to 'loading' for consistency, initial true
    const [error, setError] = useState(null); // Changed to null for consistency

    // Fetch notifications from the backend
    const fetchNotifications = useCallback(async (signal) => {
        // Guard against fetching if auth is not ready or not authenticated
        if (authLoading || !isAuthenticated) {
            console.log('NotificationContext: Skipping fetch - Auth not ready or not authenticated.');
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false); // Ensure loading is false if we skip
            setError(null);
            return;
        }

        setLoading(true);
        setError(null); // Clear previous errors
        try {
            console.log('NotificationContext: Attempting to fetch notifications...');
            const response = await notificationService.getAllNotifications(signal); // Pass signal
            console.log('NotificationContext: Notifications fetched successfully.', response);

            // Access the actual array of notifications from the response object
            const fetchedNotifications = response.notifications || [];

            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);

        } catch (err) {
            // Check if the error is due to an aborted request (e.g., component unmounted)
            if (err.name === 'AbortError' || err.message === 'Request Aborted') {
                console.log("Notification fetch aborted.");
            } else {
                const message = err.response?.data?.message || 'Failed to load notifications.';
                showError(message); // Use global alert for errors
                setError(err);
                console.error('NotificationContext - Failed to fetch notifications:', err);
            }
            setNotifications([]); // Clear notifications on error
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, authLoading, showError]); // Dependencies for useCallback

    // Effect to fetch notifications when component mounts or auth state changes
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        // Only run fetchNotifications if auth is not loading and user is authenticated
        if (!authLoading && isAuthenticated) {
            fetchNotifications(signal);
        } else if (!authLoading && !isAuthenticated) {
            // If auth is loaded but not authenticated, clear notifications and set loading to false
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            setError(null);
        }

        // Cleanup function: Abort ongoing fetch requests and clear polling interval if it existed
        return () => {
            controller.abort();
            // If you decide to re-introduce polling, ensure to clear the interval here:
            // if (pollingIntervalId) clearInterval(pollingIntervalId);
        };
    }, [fetchNotifications, authLoading, isAuthenticated]); // Dependencies for useEffect

    /**
     * Marks a specific notification as read.
     * @param {string} notificationId - The ID of the notification to mark as read.
     */
    const markAsRead = useCallback(async (notificationId) => {
        if (!isAuthenticated || !user) return;

        try {
            // Update UI optimistically
            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif._id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));

            // Call API to persist the change
            await notificationService.markNotificationAsRead(notificationId);
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to mark notification as read.');
            console.error('NotificationContext - Failed to mark notification as read:', err);
            // Revert optimistic update if API call fails (or refetch)
            fetchNotifications(); // Refetch to ensure data consistency
        }
    }, [isAuthenticated, user, fetchNotifications, showError]);

    /**
     * Marks all notifications as read.
     */
    const markAllNotificationsAsRead = useCallback(async () => {
        if (!isAuthenticated || !user) return;

        try {
            // Optimistically update UI
            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif.isRead ? notif : { ...notif, isRead: true }
                )
            );
            setUnreadCount(0);

            // Persist change on backend
            await notificationService.markAllNotificationsAsRead();
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to mark all notifications as read.');
            console.error('NotificationContext - Failed to mark all notifications as read:', err);
            fetchNotifications(); // Refetch to ensure data consistency
        }
    }, [isAuthenticated, user, fetchNotifications, showError]);

    // Memoize the context value for performance
    const notificationContextValue = useMemo(() => ({
        notifications,
        unreadCount,
        loading, // Use 'loading' for consistency
        error,
        fetchNotifications, // Allow components to manually refresh
        markAsRead,
        markAllNotificationsAsRead,
    }), [notifications, unreadCount, loading, error, fetchNotifications, markAsRead, markAllNotificationsAsRead]);

    return (
        <NotificationContext.Provider value={notificationContextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook to easily consume the NotificationContext
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
