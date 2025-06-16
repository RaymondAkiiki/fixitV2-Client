import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
  const navLinkClass = ({ isActive }) =>
    isActive
      ? 'block px-4 py-2 mt-2 text-sm font-semibold text-white bg-[#1e7f66] rounded-lg'
      : 'block px-4 py-2 mt-2 text-sm font-semibold text-gray-200 rounded-lg hover:bg-[#1e7f66] hover:text-white';

  return (
    <div className="flex flex-col w-64 bg-[#219377] text-gray-100">
      <div className="flex items-center justify-center h-16 border-b border-[#1e7f66]">
        <span className="text-white font-bold text-xl">Fix It Admin</span>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        <NavLink to="/admin/dashboard" className={navLinkClass}>Dashboard</NavLink>
        <NavLink to="/admin/users" className={navLinkClass}>User Management</NavLink>
        <NavLink to="/admin/properties" className={navLinkClass}>Properties</NavLink>
        <NavLink to="/admin/units" className={navLinkClass}>Units</NavLink>
        <NavLink to="/admin/requests" className={navLinkClass}>Maintenance Requests</NavLink>
        <NavLink to="/admin/vendors" className={navLinkClass}>Vendors</NavLink>
        <NavLink to="/admin/invites" className={navLinkClass}>Invites</NavLink>
        <NavLink to="/admin/audit-logs" className={navLinkClass}>Audit Logs</NavLink>
        <NavLink to="/admin/media" className={navLinkClass}>Media Management</NavLink>
        <NavLink to="/admin/system" className={navLinkClass}>System & Notifications</NavLink>
      </nav>
      <div className="p-4 border-t border-[#1e7f66]">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="w-full px-4 py-2 text-sm font-semibold text-center text-white bg-[#ffbd59] rounded-lg hover:[#219377]"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
