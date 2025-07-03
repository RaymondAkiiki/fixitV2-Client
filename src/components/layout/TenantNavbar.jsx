import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGlobalAlert } from "../../context/GlobalAlertContext";

/**
 * TenantNavbar – clean, branded, and modern for tenant pages.
 * Uses #219377 (emerald) and #ffbd59 (secondary) for highlights.
 */
function TenantNavbar() {
  const { user, manualLogout } = useAuth();
  const { showSuccess } = useGlobalAlert();
  const navigate = useNavigate();

  const handleLogout = () => {
    manualLogout();
    showSuccess("You have been logged out.");
    navigate("/", { replace: true });
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#219377] shadow-sm relative z-20">
      {/* Brand/Logo */}
      <div className="flex items-center gap-2">
        <Link
          to="/tenant/dashboard"
          className="text-2xl font-extrabold tracking-tight text-[#219377] hover:text-[#ffbd59] transition"
        >
          Fix It by Threalty
        </Link>
      </div>

      {/* User Info & Logout Button */}
      <div className="flex items-center space-x-4">
        {user && (
          <span className="text-gray-700 font-medium whitespace-nowrap">
            Hello, <span className="text-[#219377]">{user.name || user.email}</span>!
          </span>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-[#ff6b6b] hover:bg-red-700 text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-opacity-60 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default TenantNavbar;