import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const LandlordNavbar = ({
  brandColor = PRIMARY_COLOR,
  sidebarBg = "#1a3b34",
  activeColor = SECONDARY_COLOR,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0 shadow-sm"
      style={{ background: "#fff", borderBottom: `2px solid ${brandColor}10` }}
    >
      {/* Left: App Brand or blank (for future logo) */}
      <div className="flex items-center">
        <Link to="/landlord/properties" className="mr-4 hidden md:flex items-center">
          <span
            className="font-extrabold text-xl tracking-tight"
            style={{ color: brandColor }}
          >
            Landlord<span style={{ color: activeColor }}>Panel</span>
          </span>
        </Link>
      </div>
      {/* Right: Actions */}
      <div className="flex items-center space-x-5">
        <button
          className="p-2 rounded-full transition"
          style={{
            color: brandColor,
            backgroundColor: "#f0fdfa"
          }}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
        <div style={{ width: 1, height: 32, background: brandColor + "30" }} />
        <div className="flex items-center">
          <div className="text-right mr-3">
            <p
              className="text-sm font-semibold"
              style={{ color: brandColor }}
            >
              {user?.name || 'Landlord'}
            </p>
            <p className="text-xs capitalize" style={{ color: activeColor }}>
              {user?.role}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="p-2 rounded-full transition"
            style={{
              color: "#e64848",
              backgroundColor: "#fde2e5"
            }}
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