import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as notificationService from '../services/notificationService.js';
import { useGlobalAlert } from './GlobalAlertContext.jsx';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { showError } = useGlobalAlert();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    if (authLoading) {
        // If AuthProvider is still loading, NotificationProvider should not proceed
        // with its logic or render its children. This prevents the error
        // if React evaluates this component before AuthProvider is fully ready.
        return null; // Or return a simple loading spinner specific to notifications if desired
    }

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotifications = useCallback(async (signal) => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await notificationService.getAllNotifications({}, signal);
            const fetchedNotifications = response.notifications || [];
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
        } catch (err) {
            if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
                const message = err.response?.data?.message || 'Failed to load notifications.';
                showError(message);
                setError(err);
                console.error('NotificationContext - Failed to fetch notifications:', err);
                setNotifications([]);
                setUnreadCount(0);
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, showError]);

    useEffect(() => {
        const controller = new AbortController();
        if (!authLoading && isAuthenticated) {
            fetchNotifications(controller.signal);
        } else if (!authLoading && !isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
        }
        return () => {
            controller.abort();
        };
    }, [authLoading, isAuthenticated, fetchNotifications]);

    const markAsRead = useCallback(async (notificationId) => {
        setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await notificationService.markNotificationAsRead(notificationId);
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to mark as read.');
            fetchNotifications(); // Revert by refetching
        }
    }, [showError, fetchNotifications]);

    const markAllNotificationsAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await notificationService.markAllNotificationsAsRead();
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to mark all as read.');
            fetchNotifications(); // Revert
        }
    }, [showError, fetchNotifications]);

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllNotificationsAsRead,
    }), [notifications, unreadCount, loading, error, fetchNotifications, markAsRead, markAllNotificationsAsRead]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};