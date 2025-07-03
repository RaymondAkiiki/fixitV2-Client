import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/properties", label: "Properties" },
  { to: "/admin/units", label: "Units" },
  { to: "/admin/requests", label: "Maintenance Requests" },
  { to: "/admin/vendors", label: "Vendors" },
  { to: "/admin/invites", label: "Invites" },
  { to: "/admin/audit-logs", label: "Audit Logs" },
  { to: "/admin/media", label: "Media Management" },
  { to: "/admin/system", label: "System & Notifications" },
];

const AdminSidebar = ({ open, onClose }) => {
  // open: boolean for sidebar visibility (on mobile)
  // onClose: function to close sidebar (on mobile)

  const navLinkClass = ({ isActive }) =>
    isActive
      ? 'block px-4 py-2 mt-2 text-sm font-semibold text-white bg-[#1e7f66] rounded-lg'
      : 'block px-4 py-2 mt-2 text-sm font-semibold text-gray-200 rounded-lg hover:bg-[#1e7f66] hover:text-white';

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-full w-64 bg-[#219377] text-gray-100 transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:block
        `}
        tabIndex={open ? 0 : -1}
        aria-label="Admin sidebar"
      >
        <div className="flex items-center justify-between h-16 border-b border-[#1e7f66] px-4">
          <span className="text-white font-bold text-xl">Fix It Admin</span>
          {/* Close button for mobile */}
          <button
            className="md:hidden text-gray-200 p-2 focus:outline-none"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={onClose}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[#1e7f66]">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="w-full px-4 py-2 text-sm font-semibold text-center text-white bg-[#ffbd59] rounded-lg hover:bg-[#219377]"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;