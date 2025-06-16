// frontend/src/components/layout/PropertyManagerSidebar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building, Users, Wrench, Package, FileText, Settings, UserPlus, FileArchive
} from 'lucide-react'; // Lucide icons for a modern look

/**
 * PropertyManagerSidebar component for PM-specific pages.
 * Provides main navigation links for Property Managers.
 */
function PropertyManagerSidebar() {
  const location = useLocation(); // To highlight active link

  const navLinks = [
    { name: 'Dashboard', path: '/pm/dashboard', icon: LayoutDashboard },
    { name: 'Properties', path: '/pm/properties', icon: Building },
    { name: 'Tenants', path: '/pm/tenants', icon: Users }, // Consolidated user management
    { name: 'Service Requests', path: '/pm/requests', icon: Wrench },
    { name: 'Scheduled Maintenance', path: '/pm/scheduled-maintenance', icon: FileArchive },
    { name: 'Vendors', path: '/pm/vendors', icon: Package },
    { name: 'Reports', path: '/pm/reports', icon: FileText },
    { name: 'Profile & Settings', path: '/pm/profile', icon: Settings }, // PM's own profile and app settings
  ];

  return (
    <div className="w-68 bg-gray-900 text-gray-100 flex flex-col p-6 shadow-2xl">
      <div className="text-3xl font-extrabold mb-10 text-center text-green-400">
        Fix It
        <span className="block text-sm text-gray-400 mt-1">Property Manager</span>
      </div>

      <nav className="flex-1">
        <ul className="space-y-3">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200 ${
                  location.pathname === link.path || (location.pathname.startsWith(link.path) && link.path !== '/pm/dashboard')
                    ? 'bg-green-700 text-white shadow-inner'
                    : 'hover:bg-gray-800 hover:text-green-300 text-gray-300'
                }`}
              >
                <link.icon className="w-6 h-6 mr-3" />
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer or additional info */}
      <div className="mt-auto text-sm text-gray-500 text-center">
        &copy; {new Date().getFullYear()} Fix It by Threalty
      </div>
    </div>
  );
}

export default PropertyManagerSidebar;
