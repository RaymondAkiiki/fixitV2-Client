import React from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

function PropertyManagerNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
      {/* Left side: Hamburger for mobile and Brand for desktop */}
      <div className="flex items-center">
        <button
          className="md:hidden text-gray-600 mr-4"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/pm/dashboard" className="hidden md:flex items-center">
          <span className="font-extrabold text-xl tracking-tight text-green-700">
            Manager<span className="text-yellow-500">Portal</span>
          </span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <Link
          to="/pm/notifications"
          className="p-2 rounded-full text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </Link>
        <div className="w-px h-8 bg-gray-200" />
        <div className="flex items-center">
          <div className="text-right mr-3">
            <p className="text-sm font-semibold text-green-700">
              {user?.name || 'Property Manager'}
            </p>
            <p className="text-xs capitalize text-yellow-600">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default PropertyManagerNavbar;