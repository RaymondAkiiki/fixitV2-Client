import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LandlordSidebar from './LandlordSidebar';
import LandlordNavbar from './LandlordNavbar';

const LandlordLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The authorization logic has been removed from here.
  // ProtectedRoute in App.jsx now handles all access control before this layout is rendered.

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <LandlordSidebar
        isSidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(prev => !prev)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <LandlordNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LandlordLayout;