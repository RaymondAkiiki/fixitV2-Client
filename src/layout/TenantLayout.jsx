import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TenantNavbar from './TenantNavbar';
import TenantSidebar from './TenantSidebar';

function TenantLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authorization logic is now handled by ProtectedRoute in App.jsx.
  // This component's only responsibility is the layout structure.

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <TenantSidebar
        isSidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(prev => !prev)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TenantNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default TenantLayout;