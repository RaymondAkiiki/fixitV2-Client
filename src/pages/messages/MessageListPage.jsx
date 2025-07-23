import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as messageService from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import Spinner from '../../components/common/Spinner';
import { FaEnvelope, FaEnvelopeOpen, FaTrash, FaSearch, FaFilter, FaPen } from 'react-icons/fa';

export default function MessageListPage() {
  const { user } = useAuth();
  const { showError } = useGlobalAlert();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState({});
  const [conversationList, setConversationList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, unread, property
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  // Fetch messages and organize into conversations
  const fetchMessages = useCallback(async () => {
    // ✅ Add check to ensure user exists before trying to access user._id
    if (!user || !user._id) {
      console.log('User not available yet, skipping message fetch');
      return;
    }

    setLoading(true);
    try {
      // Get all messages (both inbox and sent)
      const inboxResponse = await messageService.getMessages({ type: 'inbox', limit: 100 });
      const sentResponse = await messageService.getMessages({ type: 'sent', limit: 100 });
      
      // Combine all messages
      const allMessages = [...inboxResponse.data, ...sentResponse.data];
      
      // Group by conversation
      const groupedConversations = messageService.groupMessagesByConversation(allMessages, user._id);
      setConversations(groupedConversations);
      
      // Create a sorted list of conversations (most recent first)
      const sortedList = Object.keys(groupedConversations).map(key => ({
        otherUserId: key,
        otherUser: groupedConversations[key].otherParty,
        lastMessage: groupedConversations[key].lastMessage,
        unreadCount: groupedConversations[key].unreadCount,
        property: groupedConversations[key].lastMessage?.property || null
      })).sort((a, b) => 
        new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt)
      );
      
      setConversationList(sortedList);
      
      // Count total unread
      const unreadTotal = sortedList.reduce((acc, conv) => acc + conv.unreadCount, 0);
      setTotalUnread(unreadTotal);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showError('Could not load your messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, showError]); // ✅ Added user as a dependency

  useEffect(() => {
    // ✅ Only fetch messages if user exists
    if (user) {
      fetchMessages();
      
      // Set up polling for new messages every 30 seconds
      const intervalId = setInterval(fetchMessages, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [fetchMessages, user]); // ✅ Added user as a dependency

  // Handle marking a conversation as read
  const handleMarkAsRead = async (otherUserId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await messageService.markConversationAsRead({ otherUserId });
      
      // Update local state to reflect the change
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[otherUserId]) {
          updated[otherUserId].unreadCount = 0;
        }
        return updated;
      });
      
      setConversationList(prev => 
        prev.map(conv => 
          conv.otherUserId === otherUserId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
      // Update total unread count
      setTotalUnread(prev => prev - (conversations[otherUserId]?.unreadCount || 0));
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      showError('Failed to mark conversation as read.');
    }
  };

  // Filter conversations based on current filters
  const filteredConversations = conversationList.filter(conv => {
    // Apply search filter
    const otherUserName = `${conv.otherUser?.firstName || ''} ${conv.otherUser?.lastName || ''}`.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      otherUserName.includes(searchQuery.toLowerCase()) ||
      (conv.lastMessage?.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply type filter
    const matchesType = filterType === 'all' || 
      (filterType === 'unread' && conv.unreadCount > 0) ||
      (filterType === 'property' && conv.property);
    
    // Apply property filter
    const matchesProperty = propertyFilter === '' || 
      conv.property?._id === propertyFilter;
    
    return matchesSearch && matchesType && matchesProperty;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages {totalUnread > 0 && `(${totalUnread})`}</h1>
        <Link 
          to="/messages/compose" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPen className="mr-2" /> New Message
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full p-2 pl-10 border rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select 
              className="p-2 border rounded-md"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread</option>
              <option value="property">Property Related</option>
            </select>
            
            {filterType === 'property' && (
              <select 
                className="p-2 border rounded-md"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
              >
                <option value="">All Properties</option>
                {/* This would be populated from your properties */}
                {/* For now just showing how it would work */}
              </select>
            )}
          </div>
        </div>
      </div>
      
      {/* Loading state when user isn't available yet */}
      {!user ? (
        <div className="flex justify-center my-12">
          <Spinner />
          <span className="ml-2">Loading user data...</span>
        </div>
      ) : loading ? (
        <div className="flex justify-center my-12">
          <Spinner />
          <span className="ml-2">Loading messages...</span>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-lg text-gray-600">
            {searchQuery || filterType !== 'all' 
              ? 'No messages match your filters.' 
              : 'You have no messages yet.'}
          </p>
          {searchQuery || filterType !== 'all' ? (
            <button 
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setPropertyFilter('');
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          ) : (
            <Link to="/messages/compose" className="mt-4 inline-block text-blue-600 hover:underline">
              Send your first message
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conv) => (
              <li 
                key={conv.otherUserId} 
                className={`${conv.unreadCount > 0 ? 'bg-blue-50' : ''} hover:bg-gray-50 transition`}
              >
                <div 
                  className="p-4 cursor-pointer flex items-start"
                  onClick={() => navigate(`/messages/${conv.otherUserId}`)}
                >
                  <div className="mr-4 mt-1">
                    {conv.otherUser?.profileImage ? (
                      <img 
                        src={conv.otherUser.profileImage} 
                        alt={conv.otherUser?.firstName || 'User'} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                        {(conv.otherUser?.firstName?.[0] || '') + (conv.otherUser?.lastName?.[0] || '')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conv.otherUser?.firstName 
                          ? `${conv.otherUser.firstName} ${conv.otherUser.lastName || ''}`
                          : conv.otherUser?.email || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(conv.lastMessage?.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {conv.property && (
                      <p className="text-xs text-blue-600 mb-1">
                        Re: {conv.property.name}
                        {conv.lastMessage?.unit?.unitName && ` - Unit ${conv.lastMessage.unit.unitName}`}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage?.content || 'No message content'}
                    </p>
                    
                    <div className="mt-1 flex items-center gap-3">
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {conv.unreadCount} unread
                        </span>
                      )}
                      
                      <div className="flex space-x-2 mt-1">
                        {conv.unreadCount > 0 && (
                          <button 
                            onClick={(e) => handleMarkAsRead(conv.otherUserId, e)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                            title="Mark as read"
                          >
                            <FaEnvelopeOpen />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}