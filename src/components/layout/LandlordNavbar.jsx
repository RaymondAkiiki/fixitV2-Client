import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const LandlordNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-end px-6 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <Bell className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center">
          <div className="text-right mr-3">
              <p className="text-sm font-semibold text-gray-800">{user?.name || 'Landlord'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }} 
            className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default LandlordNavbar;