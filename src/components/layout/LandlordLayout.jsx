// frontend/src/components/layout/LandlordLayout.jsx

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import LandlordSidebar from './LandlordSidebar';
import LandlordNavbar from './LandlordNavbar';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext is in use

const LandlordLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-600">Initializing...</div>;
  }

  // A landlord's dashboard can often be viewed by an admin or PM as well.
  // The primary check is that the user is not a tenant.
  if (!user || user.role === 'tenant') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // A specific check for the landlord role
  if (user.role !== 'landlord' && user.role !== 'admin') {
     return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <LandlordSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <LandlordNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
};

export default LandlordLayout;