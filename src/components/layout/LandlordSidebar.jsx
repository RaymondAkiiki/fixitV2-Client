
// frontend/src/components/layout/LandlordSidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart3, Users, Wrench, Send, FileArchive, Package, User } from 'lucide-react';

const LandlordSidebar = () => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex items-center justify-center h-16 border-b">
        <Home className="h-6 w-6 text-emerald-600" />
        <span className="ml-2 text-xl font-bold text-gray-800">My Properties</span>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        <NavLink to="/landlord/dashboard" className={navLinkClass}><BarChart3 className="w-5 h-5 mr-3" />Dashboard</NavLink>
        <NavLink to="/landlord/properties" className={navLinkClass}><Home className="w-5 h-5 mr-3" />Properties</NavLink>
        <NavLink to="/landlord/requests" className={navLinkClass}><Wrench className="w-5 h-5 mr-3" />Requests</NavLink>
        <NavLink to="/landlord/scheduled-maintenance" className={navLinkClass}><FileArchive className="w-5 h-5 mr-3" />Scheduled-works</NavLink>
        <NavLink to="/landlord/vendors" className={navLinkClass}><Package className="w-5 h-5 mr-3" />Vendors</NavLink>
        <NavLink to="/landlord/tenants" className={navLinkClass}><Users className="w-5 h-5 mr-3" />Tenants</NavLink>
        <NavLink to="/landlord/reports" className={navLinkClass}><BarChart3 className="w-5 h-5 mr-3" />Reports</NavLink>
        <NavLink to="/landlord/invites" className={navLinkClass}><Send className="w-5 h-5 mr-3" />Invites</NavLink>
        <NavLink to="/landlord/profile" className={navLinkClass}><User className="w-5 h-5 mr-3" />Profile</NavLink>
      </nav>
    </div>
  );
};

export default LandlordSidebar;
