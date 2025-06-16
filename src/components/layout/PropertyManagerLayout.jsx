import React, { useEffect } from 'react';
import PropertyManagerNavbar from './PropertyManagerNavbar'; // PM-specific Navbar
import PropertyManagerSidebar from './PropertyManagerSidebar'; // PM-specific Sidebar
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';

/**
 * PropertyManagerLayout component provides a consistent layout for all Property Manager-facing pages.
 * It includes a PM-specific navigation bar, a sidebar, and renders its children
 * within the main content area.
 */
function PropertyManagerLayout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const authorizedRoles = ['propertymanager', 'landlord', 'admin'];

  // Only navigate after the auth loading is complete, and only from within an effect
  useEffect(() => {
    if (!authLoading && (!user || !authorizedRoles.includes(user.role))) {
      console.warn('Unauthorized access attempt to PM layout. User role:', user?.role);
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

  // While redirecting, render nothing for unauthorized users
  if (!user || !authorizedRoles.includes(user.role)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-inter antialiased">
      {/* Sidebar */}
      <PropertyManagerSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <PropertyManagerNavbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PropertyManagerLayout;