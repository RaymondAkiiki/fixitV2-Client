import React from 'react';
import TenantNavbar from './TenantNavbar'; // Tenant-specific Navbar
import TenantSidebar from './TenantSidebar'; // Tenant-specific Sidebar
import { useAuth } from '../../context/AuthContext';
import { Outlet } from 'react-router-dom'; // Import Outlet

/**
 * TenantLayout component provides a consistent layout for all tenant-facing pages.
 * It includes a tenant-specific navigation bar, a sidebar, and renders child routes
 * within the main content area.
 */
function TenantLayout() {
  const { user } = useAuth(); // Get user details from AuthContext if needed for personalization

  // Optionally add loading state if you have loading logic in your AuthContext
  if (!user || user.role !== 'tenant') {
    // Optionally redirect or show a 'Not Authorized' message
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-red-600">You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-inter">
      {/* Sidebar */}
      <TenantSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <TenantNavbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet /> {/* <-- This renders the nested route content */}
        </main>
      </div>
    </div>
  );
}

export default TenantLayout;