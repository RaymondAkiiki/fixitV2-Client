import React, { useState, useEffect } from 'react';
import PropertyManagerNavbar from './PropertyManagerNavbar';
import PropertyManagerSidebar from './PropertyManagerSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';

function PropertyManagerLayout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const authorizedRoles = ['propertymanager', 'landlord', 'admin'];

  useEffect(() => {
    if (!authLoading && (!user || !authorizedRoles.includes(user.role))) {
      navigate('/login', { replace: true, state: { unauthorized: true } });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Loading user session...</p>
      </div>
    );
  }

  if (!user || !authorizedRoles.includes(user.role)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-inter antialiased">
      <PropertyManagerSidebar isSidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((v) => !v)} />
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
        <PropertyManagerNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PropertyManagerLayout;