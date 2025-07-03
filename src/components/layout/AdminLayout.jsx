import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  const isAdmin = user && user.role && user.role.toLowerCase() === 'admin';
  if (!isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Hamburger for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-[#219377] text-white"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">       
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;