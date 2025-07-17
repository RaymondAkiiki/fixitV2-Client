import React, { useState } from 'react';
import TenantNavbar from './TenantNavbar';
import TenantSidebar from './TenantSidebar';
import { useAuth } from '../contexts/AuthContext';
import { Outlet } from 'react-router-dom';

function TenantLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== 'tenant') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-red-600">You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-inter">
      <TenantSidebar isSidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hamburger for mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-green-700 text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <TenantNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default TenantLayout;