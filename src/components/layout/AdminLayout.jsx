import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext'; // Assuming you have an AuthContext

const AdminLayout = () => {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext

  // If still loading user data, show a loader/spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  // Ensure user is present and is admin
  const isAdmin = user && user.role && user.role.toLowerCase() === 'admin';

  if (!isAdmin) {
    // Redirect to login or a 'not authorized' page if not an admin
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">       
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;