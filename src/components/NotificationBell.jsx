// src/components/NotificationBell.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

/**
 * Renders a notification bell icon with a dropdown of recent notifications
 */
const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    refreshNotifications 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => setIsOpen(false));
  
  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);
  
  // Format notification date
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'unknown date';
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification bell icon */}
      <button
        className="relative p-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-20 overflow-hidden">
          {/* Header */}
          <div className="p-3 bg-gray-100 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                  setIsOpen(false);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications to display
              </div>
            ) : (
              <ul>
                {notifications.slice(0, 5).map((notification) => (
                  <li 
                    key={notification._id}
                    className={`p-3 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div 
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification._id);
                        }
                        if (notification.link) {
                          // Close dropdown when clicking a notification with a link
                          setIsOpen(false);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {notification.type && (
                            <span className="inline-block mr-2 px-2 py-1 text-xs rounded-full bg-gray-200">
                              {notification.type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.sentAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.link && (
                        <Link 
                          to={notification.link}
                          className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-2 bg-gray-100 border-t text-center">
            <Link 
              to="/notifications"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;