import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as messageService from '../../services/messageService';
import * as userService from '../../services/userService';
import * as propertyService from '../../services/propertyService';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { USER_ROLES } from '../../utils/constants';
import Spinner from '../../components/common/Spinner';
import { FaArrowLeft, FaPaperPlane, FaTimes, FaHome, FaBuilding } from 'react-icons/fa';

export default function MessageComposePage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useGlobalAlert();
  const navigate = useNavigate();
  
  // Form state
  const [recipient, setRecipient] = useState('');
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState(1); // 1: select recipient, 2: compose message
  
  const textareaRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Load properties for context selection
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyService.getAllProperties();
        setProperties(response.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    
    fetchProperties();
  }, []);
  
  // Load units when property is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedProperty) {
        setUnits([]);
        setSelectedUnit('');
        return;
      }
      
      try {
        const response = await propertyService.getPropertyById(selectedProperty);
        if (response && response.units) {
          setUnits(response.units);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };
    
    fetchUnits();
  }, [selectedProperty]);
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  // Search for users as potential recipients
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setRecipientOptions([]);
      return;
    }
    
    setSearchLoading(true);
    
    try {
      // Clear previous timeout if it exists
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Add a small delay to prevent too many requests
      searchTimeoutRef.current = setTimeout(async () => {
        const response = await userService.getAllUsers({ 
          search: query,
          limit: 10
        });
        
        // Filter out current user from results
        const filteredUsers = response.data.filter(u => u._id !== user._id);
        setRecipientOptions(filteredUsers);
        setSearchLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchLoading(false);
    }
  };
  
  // Handle recipient selection
  const handleSelectRecipient = (selectedUser) => {
    setRecipient(selectedUser);
    setRecipientOptions([]);
    setStep(2);
  };
  
  // Send the message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!recipient || !message.trim()) {
      showError('Please select a recipient and enter a message');
      return;
    }
    
    setSending(true);
    
    try {
      const messageData = {
        recipientId: recipient._id,
        content: message.trim(),
      };
      
      // Add property context if selected
      if (selectedProperty) {
        messageData.propertyId = selectedProperty;
        
        if (selectedUnit) {
          messageData.unitId = selectedUnit;
        }
      }
      
      const response = await messageService.sendMessage(messageData);
      
      if (response.success) {
        showSuccess('Message sent successfully');
        // Navigate to the conversation with this user
        navigate(`/messages/${recipient._id}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/messages" className="mr-4 text-blue-600">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">New Message</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {step === 1 ? (
            // Step 1: Select recipient
            <div>
              <h2 className="text-lg font-medium mb-4">Select a recipient</h2>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="w-full p-3 border rounded-lg mb-4"
                  onChange={(e) => {
                    searchUsers(e.target.value);
                  }}
                />
                
                {searchLoading && (
                  <div className="absolute right-3 top-3">
                    <Spinner size="sm" />
                  </div>
                )}
                
                {recipientOptions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {recipientOptions.map((user) => (
                      <li 
                        key={user._id} 
                        className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectRecipient(user)}
                      >
                        <div className="flex items-center">
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={user.firstName || 'User'} 
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3">
                              {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {user.firstName 
                                ? `${user.firstName} ${user.lastName || ''}`
                                : user.email}
                            </div>
                            {user.role && (
                              <div className="text-xs text-gray-500 capitalize">
                                {user.role.replace('_', ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Recent contacts for quick selection */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Contacts</h3>
                <p className="text-sm text-gray-500">
                  Your recent contacts will appear here.
                </p>
                {/* This would be populated from recent conversations */}
              </div>
              
              <div className="mt-8 flex justify-center">
                <button
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                  onClick={() => navigate('/messages')}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Compose message
            <form onSubmit={handleSendMessage}>
              {/* Recipient display */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To:
                </label>
                <div className="flex items-center p-2 border rounded-lg">
                  <div className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                    <span>
                      {recipient.firstName 
                        ? `${recipient.firstName} ${recipient.lastName || ''}`
                        : recipient.email}
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setRecipient('');
                        setStep(1);
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Property context */}
              {(user.role === USER_ROLES.ADMIN || 
                user.role === USER_ROLES.LANDLORD || 
                user.role === USER_ROLES.PROPERTY_MANAGER) && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <FaHome className="mr-1" />
                      <span>Property Context (Optional)</span>
                    </div>
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                  >
                    <option value="">No property (general message)</option>
                    {properties.map((property) => (
                      <option key={property._id} value={property._id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Unit selection if property selected */}
              {selectedProperty && units.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <FaBuilding className="mr-1" />
                      <span>Unit (Optional)</span>
                    </div>
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                  >
                    <option value="">No specific unit</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.unitName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Message content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message:
                </label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 border rounded-lg resize-none min-h-[150px]"
                  rows={6}
                  required
                />
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    sending || !message.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {sending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}