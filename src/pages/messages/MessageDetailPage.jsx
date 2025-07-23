import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as messageService from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import Spinner from '../../components/common/Spinner';
import { FaArrowLeft, FaPaperPlane, FaTrash, FaDownload } from 'react-icons/fa';

export default function MessageDetailPage() {
  const { userId } = useParams(); // userId of the other user in the conversation
  const { user } = useAuth();
  const { showError, showSuccess } = useGlobalAlert();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [propertyContext, setPropertyContext] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Fetch messages between current user and the selected user
  const fetchConversation = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch messages where the other user is either sender or recipient
      const inboxResponse = await messageService.getMessages({ 
        otherUserId: userId,
        type: 'inbox',
        limit: 100
      });
      
      const sentResponse = await messageService.getMessages({ 
        otherUserId: userId,
        type: 'sent',
        limit: 100
      });
      
      // Combine and sort messages by creation date
      const allMessages = [...inboxResponse.data, ...sentResponse.data].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setMessages(allMessages);
      
      // Set the other user's details
      if (allMessages.length > 0) {
        const messageWithOtherUser = allMessages.find(m => 
          (m.sender && m.sender._id === userId) || 
          (m.recipient && m.recipient._id === userId)
        );
        
        if (messageWithOtherUser) {
          setOtherUser(
            messageWithOtherUser.sender?._id === userId 
              ? messageWithOtherUser.sender 
              : messageWithOtherUser.recipient
          );
          
          // Set property context if present
          if (messageWithOtherUser.property) {
            setPropertyContext({
              property: messageWithOtherUser.property,
              unit: messageWithOtherUser.unit || null
            });
          }
        }
      }
      
      // Mark conversation as read
      if (allMessages.some(m => !m.isRead && m.sender?._id === userId)) {
        await messageService.markConversationAsRead({ otherUserId: userId });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      showError('Could not load the conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, showError]);
  
  useEffect(() => {
    fetchConversation();
    
    // Poll for new messages every 15 seconds
    const intervalId = setInterval(fetchConversation, 15000);
    
    return () => clearInterval(intervalId);
  }, [fetchConversation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);
  
  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const messageData = {
        recipientId: userId,
        content: newMessage,
      };
      
      // Add property context if available
      if (propertyContext?.property) {
        messageData.propertyId = propertyContext.property._id;
        if (propertyContext.unit) {
          messageData.unitId = propertyContext.unit._id;
        }
      }
      
      const response = await messageService.sendMessage(messageData);
      
      if (response.success && response.data) {
        // Add the new message to the conversation
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        showSuccess('Message sent successfully');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  // Delete a message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    try {
      await messageService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      showSuccess('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      showError('Failed to delete message. Please try again.');
    }
  };
  
  if (!userId) {
    return <div className="text-center p-8">Invalid conversation.</div>;
  }
  
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Link to="/messages" className="mr-4 text-blue-600">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-xl font-bold">
              {otherUser ? (
                `${otherUser.firstName || ''} ${otherUser.lastName || ''}`
              ) : (
                'Loading...'
              )}
            </h1>
            {propertyContext?.property && (
              <p className="text-sm text-blue-600">
                {propertyContext.property.name}
                {propertyContext.unit && ` - Unit ${propertyContext.unit.unitName}`}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
            <span className="ml-2">Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet.</p>
            <p className="mt-2">Send a message to start the conversation.</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="mb-6">
              <div className="flex justify-center mb-3">
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {date}
                </span>
              </div>
              
              {dateMessages.map((message) => {
                const isSentByMe = message.sender?._id === user._id;
                
                return (
                  <div 
                    key={message._id} 
                    className={`flex mb-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-3/4 rounded-lg p-3 ${
                        isSentByMe 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white border rounded-tl-none'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs opacity-70">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isSentByMe && (
                          <button 
                            onClick={() => handleDeleteMessage(message._id)}
                            className="text-xs ml-2 opacity-70 hover:opacity-100"
                            title="Delete message"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Display attachments if any */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2">
                          {message.attachments.map((attachment, idx) => (
                            <div key={idx} className="flex items-center mt-1">
                              <FaDownload className="mr-1" />
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`text-sm ${isSentByMe ? 'text-blue-100' : 'text-blue-600'}`}
                              >
                                {attachment.name || `Attachment ${idx + 1}`}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.isRead && isSentByMe && (
                        <div className="text-xs opacity-70 mt-1">
                          Read {message.readAt ? `at ${formatMessageTime(message.readAt)}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <form onSubmit={handleSendMessage} className="flex items-end">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 p-3 border rounded-lg resize-none min-h-[60px] max-h-[200px]"
            rows={1}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className={`ml-3 px-4 py-3 rounded-lg ${
              sending || !newMessage.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sending ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}