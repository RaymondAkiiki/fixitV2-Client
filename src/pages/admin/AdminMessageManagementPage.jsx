// frontend/src/pages/admin/AdminMessageManagementPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import * as messageService from "../../services/messageService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { ROUTES } from '../../utils/constants.js';
import { formatDate } from '../../utils/helpers.js';
import useDebounce from '../../hooks/useDebounce.js';
import { MessageSquare, Eye, Trash2, Mail, MailOpen, PlusCircle } from 'lucide-react';

const AdminMessageManagementPage = () => {
  const { showError, showSuccess } = useGlobalAlert();
  
  // State for messages data
  const [messages, setMessages] = useState([]);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [messageStats, setMessageStats] = useState({
    totalMessages: 0,
    unreadMessages: 0,
    sentMessages: 0,
    receivedMessages: 0,
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: 'inbox', // 'inbox' or 'sent'
    propertyId: '',
    otherUserId: '',
    unreadOnly: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // Selected messages for bulk actions
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Abort controllers for API requests
  const messagesAbortController = useRef(null);
  const propertiesAbortController = useRef(null);
  const usersAbortController = useRef(null);
  const statsAbortController = useRef(null);

  // Fetch messages with filters and pagination
  const fetchMessages = useCallback(async () => {
    // Cancel any ongoing request
    if (messagesAbortController.current) {
      messagesAbortController.current.abort();
    }
    
    // Create new abort controller
    messagesAbortController.current = new AbortController();
    const signal = messagesAbortController.current.signal;
    
    setLoading(true);
    
    try {
      // Prepare API parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        search: debouncedSearch,
        unreadOnly: filters.unreadOnly === 'true'
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0 && params[key] !== false) {
          delete params[key];
        }
      });
      
      // Call the service to get messages
      const response = await messageService.getMessages(params, signal);
      
      // Update state with formatted response data
      setMessages(response.data || []);
      setPagination({
        page: response.pagination?.page || 1,
        limit: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 1
      });
      
      // Clear selected messages when fetching new data
      setSelectedMessages([]);
      setSelectAll(false);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        showError('Failed to load messages: ' + error.message);
        console.error('Error fetching messages:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, pagination.page, pagination.limit, showError]);

  // Fetch properties for filter dropdown
  const fetchProperties = useCallback(async () => {
    // Cancel any ongoing request
    if (propertiesAbortController.current) {
      propertiesAbortController.current.abort();
    }
    
    // Create new abort controller
    propertiesAbortController.current = new AbortController();
    const signal = propertiesAbortController.current.signal;
    
    setPropertiesLoading(true);
    
    try {
      const response = await adminService.getAllProperties({ limit: 100 }, signal);
      setProperties(response.data || []);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        console.error('Error fetching properties for filter:', error);
      }
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  // Fetch users for filter dropdown
  const fetchUsers = useCallback(async () => {
    // Cancel any ongoing request
    if (usersAbortController.current) {
      usersAbortController.current.abort();
    }
    
    // Create new abort controller
    usersAbortController.current = new AbortController();
    const signal = usersAbortController.current.signal;
    
    setUsersLoading(true);
    
    try {
      const response = await adminService.getAllUsers({ limit: 100 }, signal);
      setUsers(response.data || []);
    } catch (error) {
      if (error.message !== 'Request canceled') {
        console.error('Error fetching users for filter:', error);
      }
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Calculate message statistics
  const calculateMessageStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Get the unread count
      const unreadCount = await messageService.getUnreadMessageCount();
      
      // Get sent messages count (sample - this would normally be from an API)
      const sentParams = { type: 'sent', limit: 1 };
      const sentResponse = await messageService.getMessages(sentParams);
      
      // Get inbox messages count (sample - this would normally be from an API)
      const inboxParams = { type: 'inbox', limit: 1 };
      const inboxResponse = await messageService.getMessages(inboxParams);
      
      // Update stats
      setMessageStats({
        totalMessages: (sentResponse.pagination?.total || 0) + (inboxResponse.pagination?.total || 0),
        unreadMessages: unreadCount,
        sentMessages: sentResponse.pagination?.total || 0,
        receivedMessages: inboxResponse.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error calculating message statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Handle marking message as read
  const handleMarkAsRead = useCallback(async (messageId) => {
    setActionLoading(true);
    try {
      await messageService.markMessageAsRead(messageId);
      showSuccess('Message marked as read');
      
      // Update UI optimistically
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
      
      // Update stats
      setMessageStats(prev => ({
        ...prev,
        unreadMessages: Math.max(0, prev.unreadMessages - 1)
      }));
    } catch (error) {
      showError(`Failed to mark message as read: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, [showError, showSuccess]);

  // Handle message deletion
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await messageService.deleteMessage(messageId);
      showSuccess('Message deleted successfully');
      
      // Update UI optimistically
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
      
      // Update stats
      setMessageStats(prev => ({
        ...prev,
        totalMessages: Math.max(0, prev.totalMessages - 1),
        receivedMessages: filters.type === 'inbox' ? Math.max(0, prev.receivedMessages - 1) : prev.receivedMessages,
        sentMessages: filters.type === 'sent' ? Math.max(0, prev.sentMessages - 1) : prev.sentMessages,
      }));
    } catch (error) {
      showError(`Failed to delete message: ${error.message}`);
      // Refresh to get accurate data if optimistic update failed
      fetchMessages();
    } finally {
      setActionLoading(false);
    }
  }, [filters.type, fetchMessages, showError, showSuccess]);

  // Handle bulk message actions
  const handleBulkAction = useCallback(async (action) => {
    if (selectedMessages.length === 0) {
      showError('No messages selected');
      return;
    }
    
    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedMessages.length} message(s)? This action cannot be undone.`)) {
        return;
      }
      
      setActionLoading(true);
      try {
        // In a real app, you'd have a bulk delete API
        // Here we'll do them sequentially for simplicity
        for (const messageId of selectedMessages) {
          await messageService.deleteMessage(messageId);
        }
        
        showSuccess(`${selectedMessages.length} message(s) deleted successfully`);
        fetchMessages(); // Refresh the list
      } catch (error) {
        showError(`Failed to delete messages: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    } else if (action === 'markRead') {
      setActionLoading(true);
      try {
        // In a real app, you'd have a bulk mark read API
        // Here we'll do them sequentially for simplicity
        for (const messageId of selectedMessages) {
          await messageService.markMessageAsRead(messageId);
        }
        
        showSuccess(`${selectedMessages.length} message(s) marked as read`);
        fetchMessages(); // Refresh the list
      } catch (error) {
        showError(`Failed to mark messages as read: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  }, [selectedMessages, fetchMessages, showError, showSuccess]);

  // Toggle message selection
  const toggleMessageSelection = useCallback((messageId) => {
    setSelectedMessages(prev => {
      if (prev.includes(messageId)) {
        return prev.filter(id => id !== messageId);
      } else {
        return [...prev, messageId];
      }
    });
  }, []);

  // Toggle select all messages
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map(msg => msg._id));
    }
    setSelectAll(!selectAll);
  }, [selectAll, messages]);

  // Initial data loading
  useEffect(() => {
    fetchProperties();
    fetchUsers();
    calculateMessageStats();
    
    return () => {
      // Clean up requests on unmount
      if (propertiesAbortController.current) {
        propertiesAbortController.current.abort();
      }
      if (usersAbortController.current) {
        usersAbortController.current.abort();
      }
      if (statsAbortController.current) {
        statsAbortController.current.abort();
      }
    };
  }, [fetchProperties, fetchUsers, calculateMessageStats]);

  // Fetch messages when filters or pagination changes
  useEffect(() => {
    fetchMessages();
    
    return () => {
      if (messagesAbortController.current) {
        messagesAbortController.current.abort();
      }
    };
  }, [fetchMessages]);

  // Filter change handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      type: 'inbox',
      propertyId: '',
      otherUserId: '',
      unreadOnly: '',
      dateFrom: '',
      dateTo: '',
    });
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Message category options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'rent', label: 'Rent & Payments' },
    { value: 'lease', label: 'Lease' },
    { value: 'notification', label: 'Notification' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-[#219377]">
          Message Management
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Monitor and manage system messages, user communications, and notifications.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-end">
        <Link 
          to={ROUTES.ADMIN_MESSAGES_COMPOSE || ROUTES.ADMIN_MESSAGES + '/compose'} 
          className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Compose New Message
        </Link>
      </div>
      
      {/* Message Stats Overview */}
      {!statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Messages</h3>
            <p className="text-2xl font-bold text-gray-800">{messageStats.totalMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Unread Messages</h3>
            <p className="text-2xl font-bold text-blue-600">{messageStats.unreadMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Messages Sent</h3>
            <p className="text-2xl font-bold text-green-600">{messageStats.sentMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Messages Received</h3>
            <p className="text-2xl font-bold text-indigo-600">{messageStats.receivedMessages}</p>
          </div>
        </div>
      )}
      
      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#219377]">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search message content"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Message Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              <option value="inbox">Inbox (Received)</option>
              <option value="sent">Sent</option>
            </select>
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Property */}
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select
              id="propertyId"
              name="propertyId"
              value={filters.propertyId}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              disabled={propertiesLoading}
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property._id} value={property._id}>{property.name}</option>
              ))}
            </select>
          </div>
          
          {/* User */}
          <div>
            <label htmlFor="otherUserId" className="block text-sm font-medium text-gray-700 mb-1">
              {filters.type === 'inbox' ? 'From User' : 'To User'}
            </label>
            <select
              id="otherUserId"
              name="otherUserId"
              value={filters.otherUserId}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              disabled={usersLoading}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName && user.lastName ? 
                    `${user.firstName} ${user.lastName}` : 
                    user.email}
                </option>
              ))}
            </select>
          </div>
          
          {/* Unread Only */}
          {filters.type === 'inbox' && (
            <div>
              <label htmlFor="unreadOnly" className="block text-sm font-medium text-gray-700 mb-1">Read Status</label>
              <select
                id="unreadOnly"
                name="unreadOnly"
                value={filters.unreadOnly}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
              >
                <option value="">All Messages</option>
                <option value="true">Unread Only</option>
                <option value="false">Read Only</option>
              </select>
            </div>
          )}
          
          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
          
          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#219377] focus:border-[#219377]"
            />
          </div>
        </div>
        
        {/* Filter Action Buttons */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleResetFilters}
            className="mr-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchMessages}
            className="px-4 py-2 bg-[#219377] text-white rounded-md hover:bg-[#1b7c66] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Bulk Actions */}
      {selectedMessages.length > 0 && (
        <div className="bg-indigo-50 p-4 mb-4 rounded-lg border border-indigo-200 flex items-center justify-between">
          <div className="text-indigo-800 font-medium">
            {selectedMessages.length} message(s) selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleBulkAction('markRead')}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Mark as Read
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Messages Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-blue-800">Loading messages...</span>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {filters.type === 'inbox' ? 'From' : 'To'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject/Content</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.length > 0 ? (
                messages.map(message => (
                  <tr key={message._id} className={`hover:bg-gray-50 ${!message.isRead && filters.type === 'inbox' ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedMessages.includes(message._id)}
                        onChange={() => toggleMessageSelection(message._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!message.isRead && filters.type === 'inbox' ? (
                        <Mail className="w-5 h-5 text-blue-600" title="Unread" />
                      ) : (
                        <MailOpen className="w-5 h-5 text-gray-400" title="Read" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {filters.type === 'inbox' ? message.senderName : message.recipientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md truncate font-medium">
                        {message.content.substring(0, 60)}
                        {message.content.length > 60 ? '...' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {message.property?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {message.category || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(message.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleDeleteMessage(message._id)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center"
                          title="Delete Message"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                        
                        <Link 
                          to={ROUTES.ADMIN_MESSAGE_DETAILS ? `${ROUTES.ADMIN_MESSAGE_DETAILS.replace(':messageId', message._id)}` : `${ROUTES.ADMIN_MESSAGES}/${message._id}`} 
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="View Message"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                        
                        {!message.isRead && filters.type === 'inbox' && (
                          <button 
                            onClick={() => handleMarkAsRead(message._id)}
                            disabled={actionLoading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center"
                            title="Mark as Read"
                          >
                            <MailOpen className="w-4 h-4 mr-1" />
                            Mark Read
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    {loading ? 
                      'Loading messages...' : 
                      'No messages found matching your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{messages.length}</span> of <span className="font-medium">{pagination.total}</span> messages
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center">
                <span className="text-gray-700 mx-2">Page {pagination.page} of {pagination.pages}</span>
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessageManagementPage;