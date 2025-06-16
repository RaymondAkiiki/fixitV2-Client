// frontend/src/components/layout/TenantNavbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext for logout

/**
 * TenantNavbar component for tenant-specific pages.
 * Displays a minimal top navigation with user info and logout.
 */
function TenantNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Logo/Brand Name */}
      <div className="text-2xl font-bold text-green-700">
        <Link to="/tenant/dashboard">Fix It by Threalty</Link>
      </div>

      {/* User Info & Logout */}
      <div className="flex items-center space-x-4">
        {user && (
          <span className="text-gray-700 font-medium">Hello, {user.name || user.email}!</span>
        )}
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out shadow-md"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default TenantNavbar;
