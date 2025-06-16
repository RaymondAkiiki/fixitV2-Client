// frontend/src/components/layout/TenantSidebar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaTools, FaBell, FaClipboardList, FaUserCircle, FaBuilding } from 'react-icons/fa'; // Icons for navigation

/**
 * TenantSidebar component for tenant-specific pages.
 * Provides main navigation links for tenants.
 */
function TenantSidebar() {
  const location = useLocation(); // To highlight active link

  const navLinks = [
    { name: 'Dashboard', path: '/tenant/dashboard', icon: FaHome },
    { name: 'My Requests', path: '/tenant/requests', icon: FaTools },
    { name: 'My Unit', path: '/tenant/my-unit', icon: FaBuilding }, // New page to view current unit details
    { name: 'Notifications', path: '/tenant/notifications', icon: FaBell },
    { name: 'My Profile', path: '/tenant/profile', icon: FaUserCircle }, // Consolidated profile page
    { name: 'Scheduled Works.', path: '/tenant/scheduled-maintenance', icon: FaClipboardList },
  ];

  return (
    <div className="w-64 bg-[#219377] text-white flex flex-col p-6 shadow-lg">
      <div className="text-3xl font-extrabold mb-8 text-center text-green-200">Tenant Portal</div>

      <nav className="flex-1">
        <ul className="space-y-4">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                to={link.path}
                className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-green-700 text-green-100 shadow-inner'
                    : 'hover:bg-green-700 hover:text-green-100'
                }`}
              >
                <link.icon className="mr-3 text-xl" />
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer or additional info */}
      <div className="mt-auto text-sm text-green-300 text-center">
        &copy; {new Date().getFullYear()} Fix It by Threalty
      </div>
    </div>
  );
}

export default TenantSidebar;
