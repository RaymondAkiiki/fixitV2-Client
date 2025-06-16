// frontend/src/contexts/NotificationContext.jsx

// This context manages in-app notifications, including fetching, marking as read,
// and providing a mechanism for displaying notification toasts or lists.

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx'; // Corrected import path to include .jsx extension
import * as notificationService from '../services/notificationService.js'; // Use notification service

// Create the NotificationContext
export const NotificationContext = createContext();

/**
 * NotificationProvider component
 * Provides notification state and functions to its children components.
 */
export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth(); // Get user from AuthContext
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch notifications from the backend
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated() || !user || authLoading) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await notificationService.getAllNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Failed to load notifications.');
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user, authLoading]);

    // Effect to fetch notifications when component mounts or user logs in/out
    useEffect(() => {
        fetchNotifications();
        // Set up polling for new notifications (optional, for basic real-time)
        // For true real-time, consider WebSockets (e.g., Socket.IO)
        const pollingInterval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds

        return () => clearInterval(pollingInterval); // Cleanup on unmount
    }, [fetchNotifications]);

    /**
     * Marks a specific notification as read.
     * @param {string} notificationId - The ID of the notification to mark as read.
     */
    const markAsRead = useCallback(async (notificationId) => {
        if (!isAuthenticated() || !user) return;

        try {
            // Update UI optimistically
            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif._id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));

            // Call API to persist the change
            await notificationService.markAsRead(notificationId);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            // Revert optimistic update if API call fails (or refetch)
            fetchNotifications();
            setError('Failed to mark notification as read.');
        }
    }, [isAuthenticated, user, fetchNotifications]);

    /**
     * Marks all notifications as read.
     */
    const markAllNotificationsAsRead = useCallback(async () => {
        if (!isAuthenticated() || !user) return;

        try {
            // Optimistically update UI
            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif.isRead ? notif : { ...notif, isRead: true }
                )
            );
            setUnreadCount(0);

            // Persist change on backend
            await notificationService.markAllAsRead();
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            fetchNotifications();
            setError('Failed to mark all as read.');
        }
    }, [isAuthenticated, user, fetchNotifications]);

    // Value provided by the context
    const notificationContextValue = {
        notifications,
        unreadCount,
        isLoading,
        error,
        fetchNotifications, // Allow components to manually refresh
        markAsRead,
        markAllNotificationsAsRead,
    };

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