import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const LandlordNavbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
      {/* Hamburger Menu for Mobile */}
      <button
        className="md:hidden text-gray-600"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Left: App Brand (hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <Link to="/landlord/dashboard" className="flex items-center">
          <span className="font-extrabold text-xl tracking-tight text-green-700">
            Landlord<span className="text-yellow-500">Panel</span>
          </span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <button
          className="p-2 rounded-full text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-px h-8 bg-gray-200" />
        <div className="flex items-center">
          <div className="text-right mr-3">
            <p className="text-sm font-semibold text-green-700">{user?.name || 'Landlord'}</p>
            <p className="text-xs capitalize text-yellow-600">{user?.role}</p>
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
};

export default LandlordNavbar;