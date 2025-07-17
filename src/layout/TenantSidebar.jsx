import React, { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Wrench,
  Bell,
  ClipboardList,
  User,
  Building,
  LogOut,
  X,
} from "lucide-react";

const navLinks = [
  { name: "Dashboard", path: "/tenant/dashboard", icon: Home },
  { name: "My Requests", path: "/tenant/requests", icon: Wrench },
  { name: "My Unit", path: "/tenant/my-unit", icon: Building },
  { name: "Notifications", path: "/tenant/notifications", icon: Bell },
  { name: "Scheduled Works", path: "/tenant/scheduled-maintenance", icon: ClipboardList },
  { name: "My Profile", path: "/tenant/profile", icon: User },
];

function TenantSidebar({ isSidebarOpen, toggleSidebar }) {
  const sidebarRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (isSidebarOpen && e.key === "Escape") toggleSidebar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSidebarOpen, toggleSidebar]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-white text-green-700 shadow-sm'
        : 'text-gray-200 hover:bg-white/20 hover:text-white'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />
      
      <aside
        ref={sidebarRef}
        className={`fixed z-50 inset-y-0 left-0 w-64 bg-green-700 text-white flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/20">
            <span className="font-extrabold text-xl tracking-tight text-white">Tenant Portal</span>
            <button className="md:hidden text-gray-300 hover:text-white" onClick={toggleSidebar} aria-label="Close sidebar">
                <X size={24} />
            </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink key={link.name} to={link.path} className={navLinkClass} onClick={handleLinkClick}>
              <link.icon className="w-5 h-5 mr-3" />
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/20">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default TenantSidebar;