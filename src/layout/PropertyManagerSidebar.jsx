import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, Building, FileText, DollarSign, Wrench,
  CalendarCheck, Truck, MailPlus, MessageSquare, Bell, ClipboardList,
  BarChart3, UserCircle, LogOut, Building2
} from 'lucide-react';

const navLinks = [
  { to: "/pm/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { to: "/pm/profile", label: "My Profile", icon: <UserCircle size={20} /> },
  { to: "/pm/users", label: "Users", icon: <Users size={20} /> },
  { to: "/pm/properties", label: "Properties", icon: <Building size={20} /> },
  { to: "/pm/leases", label: "Leases", icon: <FileText size={20} /> },
  { to: "/pm/payments", label: "Payments", icon: <DollarSign size={20} /> },
  { to: "/pm/requests", label: "Maintenance", icon: <Wrench size={20} /> },
  { to: "/pm/scheduled-maintenance", label: "Scheduled Tasks", icon: <CalendarCheck size={20} /> },
  { to: "/pm/vendors", label: "Vendors", icon: <Truck size={20} /> },
  { to: "/pm/invites", label: "Invites", icon: <MailPlus size={20} /> },
  { to: "/pm/messages", label: "Messages", icon: <MessageSquare size={20} /> },
  { to: "/pm/notifications", label: "Notifications", icon: <Bell size={20} /> },
  { to: "/pm/onboarding", label: "Onboarding", icon: <ClipboardList size={20} /> },
  { to: "/pm/reports", label: "Reports", icon: <BarChart3 size={20} /> },
];

const PropertyManagerSidebar = ({ open, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 text-sm font-medium ${
      isActive
        ? 'bg-[#ffbd59] text-[#219377] shadow-md'
        : 'text-gray-200 hover:bg-white/20 hover:text-white'
    }`;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-[#219377] text-white flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/20">
          <span className="text-white font-bold text-xl">Fix It Manager</span>
          <button className="md:hidden text-white p-2" onClick={onClose} aria-label="Close sidebar">
            {/* You can add a close icon here if needed */}
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={onClose}>
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold text-center text-[#219377] bg-white rounded-lg hover:bg-[#ffbd59] transition-colors duration-200"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default PropertyManagerSidebar;