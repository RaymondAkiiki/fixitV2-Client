import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth for logout
import {
  LayoutDashboard, Building, Users, Wrench, FileArchive, Package, User, Send, LogOut, X
} from 'lucide-react';

const NAV_LINKS = [
  { to: "/landlord/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/landlord/properties", label: "Properties", icon: Building },
  { to: "/landlord/requests", label: "Requests", icon: Wrench },
  { to: "/landlord/scheduled-maintenance", label: "Scheduled Works", icon: FileArchive },
  { to: "/landlord/vendors", label: "Vendors", icon: Package },
  { to: "/landlord/tenants", label: "Tenants", icon: Users },
  { to: "/landlord/invites", label: "Invites", icon: Send },
  { to: "/landlord/profile", label: "Profile", icon: User }
];

const LandlordSidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const sidebarRef = useRef(null);
  const { logout } = useAuth(); // Get logout function

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (isSidebarOpen && e.key === "Escape") toggleSidebar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSidebarOpen, toggleSidebar]);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 group ${
      isActive
        ? 'bg-yellow-500 text-gray-900'
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
        className={`fixed z-50 inset-y-0 left-0 w-64 bg-[#1a3b34] text-white flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/20">
            <span className="font-extrabold text-xl tracking-tight text-yellow-500">My Properties</span>
            <button className="md:hidden text-gray-300 hover:text-white" onClick={toggleSidebar} aria-label="Close sidebar">
                <X size={24} />
            </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={handleLinkClick}>
              <link.icon className="w-5 h-5 mr-3" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/20">
            <button onClick={logout} className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-colors">
                <LogOut size={18} />
                <span>Logout</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default LandlordSidebar;