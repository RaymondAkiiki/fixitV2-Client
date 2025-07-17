import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Menu, LogOut } from 'lucide-react';

function TenantNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Use the correct logout function from context
    navigate("/", { replace: true });
  };

  return (
    <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      {/* Left side: Hamburger for mobile and Brand for desktop */}
      <div className="flex items-center">
        <button
          className="md:hidden text-gray-600 mr-4"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link
          to="/tenant/dashboard"
          className="text-2xl font-extrabold tracking-tight text-green-700 hover:text-green-600 transition"
        >
          Fix It
        </Link>
      </div>

      {/* User Info & Logout Button */}
      <div className="flex items-center space-x-4">
        <div className="text-right">
            <span className="text-gray-800 font-semibold text-sm">
                {user?.name || user?.email}
            </span>
            <p className="text-xs text-gray-500 capitalize">Tenant</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

export default TenantNavbar;