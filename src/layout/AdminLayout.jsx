import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Menu } from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar Component */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header bar for mobile to show a hamburger menu icon */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
            <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 focus:outline-none"
                aria-label="Open sidebar"
            >
                <Menu size={24} />
            </button>
            <span className="text-xl font-semibold text-gray-800 dark:text-white">Admin Panel</span>
        </div>

        {/* Main content where nested routes will be rendered */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;