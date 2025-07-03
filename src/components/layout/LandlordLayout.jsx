import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import LandlordSidebar from './LandlordSidebar';
import LandlordNavbar from './LandlordNavbar';
import { useAuth } from '../../context/AuthContext';

const PRIMARY_COLOR = '#219377';
const SIDEBAR_BG = '#1a3b34';
const SIDEBAR_ACTIVE = '#ffbd59';

const LandlordLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600" style={{ color: PRIMARY_COLOR + "cc" }}>
        Initializing...
      </div>
    );
  }

  if (!user || user.role === 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }
  if (user.role !== 'landlord' && user.role !== 'admin') {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <div
      className="flex h-screen font-sans"
      style={{ background: "#f9fafb" }}
    >
      <LandlordSidebar
        isSidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(v => !v)}
        brandColor={PRIMARY_COLOR}
        sidebarBg={SIDEBAR_BG}
        activeColor={SIDEBAR_ACTIVE}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hamburger for mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full shadow-lg"
          style={{
            backgroundColor: PRIMARY_COLOR,
            color: "#fff",
            boxShadow: "0 2px 8px 0 rgba(33,147,119,0.15)"
          }}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <LandlordNavbar
          brandColor={PRIMARY_COLOR}
          sidebarBg={SIDEBAR_BG}
          activeColor={SIDEBAR_ACTIVE}
        />
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{
            background: "#f4f6f8",
            padding: "1.5rem 2rem",
            minHeight: "100vh"
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LandlordLayout;