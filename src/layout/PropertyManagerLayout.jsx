import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PropertyManagerNavbar from './PropertyManagerNavbar';
import PropertyManagerSidebar from './PropertyManagerSidebar';

function PropertyManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // All authorization and loading logic has been removed.
  // This component now correctly assumes it's only rendered for authorized users
  // by the ProtectedRoute component in App.jsx.

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <PropertyManagerSidebar
        isSidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(prev => !prev)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PropertyManagerNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PropertyManagerLayout;