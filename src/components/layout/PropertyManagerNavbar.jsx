import React from 'react';
import { Bell, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobalAlert } from '../../context/GlobalAlertContext';

const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

function PropertyManagerNavbar() {
  const { user, logout } = useAuth();
  const { showSuccess } = useGlobalAlert();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showSuccess('You have been logged out.');
    navigate('/');
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0 shadow-sm"
      style={{ background: "#fff", borderBottom: `2px solid ${PRIMARY_COLOR}10` }}
    >
      {/* Left: App Brand */}
      <div className="flex items-center">
        <Link to="/pm/dashboard" className="mr-4 flex items-center">
          <span
            className="font-extrabold text-xl tracking-tight"
            style={{ color: PRIMARY_COLOR }}
          >
            Manager<span style={{ color: SECONDARY_COLOR }}>Portal</span>
          </span>
        </Link>
      </div>
      {/* Right: Actions */}
      <div className="flex items-center space-x-5">
        <Link
          to="/pm/notifications"
          className="p-2 rounded-full transition"
          style={{
            color: PRIMARY_COLOR,
            backgroundColor: "#f0fdfa"
          }}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </Link>
        <div style={{ width: 1, height: 32, background: PRIMARY_COLOR + "30" }} />
        <div className="flex items-center">
          <div className="text-right mr-3">
            <p
              className="text-sm font-semibold"
              style={{ color: PRIMARY_COLOR }}
            >
              {user?.name || user?.email || 'Property Manager'}
            </p>
            <p className="text-xs capitalize" style={{ color: SECONDARY_COLOR }}>
              {user?.role || "Manager"}
            </p>
        
          </div>
          <button
            onClick={handleLogout}
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
}

export default PropertyManagerNavbar;