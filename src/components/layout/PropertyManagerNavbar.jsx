// frontend/src/components/layout/PropertyManagerNavbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext for logout and user info
import { Bell, UserCircle, LogOut } from 'lucide-react'; // Icons

/**
 * PropertyManagerNavbar component for PM-specific pages.
 * Displays a top navigation with user info, notifications, and logout.
 */
function PropertyManagerNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-md">
      {/* Logo/Brand Name */}
      <div className="text-2xl font-bold text-green-700">
        <Link to="/pm/dashboard">Manager Portal</Link>
      </div>

      {/* Right side: Icons and User Info */}
      <div className="flex items-center space-x-6">
        {/* Notifications Icon (Example) */}
        <Link to="/pm/notifications" className="relative text-gray-600 hover:text-blue-600 transition duration-150">
          <Bell className="w-6 h-6" />
          {/* You might add a notification count badge here */}
          {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span> */}
        </Link>

        {/* User Profile Dropdown/Link */}
        <div className="flex items-center space-x-2 text-gray-700 font-medium">
          <UserCircle className="w-6 h-6 text-gray-500" />
          <span>{user?.name || user?.email || 'Property Manager'}</span>
          <Link to="/pm/profile" className="text-sm text-blue-600 hover:underline ml-2">View Profile</Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out shadow-md"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
}

export default PropertyManagerNavbar;
