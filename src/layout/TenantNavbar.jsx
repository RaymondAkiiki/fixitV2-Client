import React from 'react';
import Navbar from './UserNavbar';

const TenantNavbar = ({ onMenuClick }) => {
  return (
    <Navbar
      onMenuClick={onMenuClick}
      portalName="Tenant"
      portalAccent="Portal"
      dashboardPath="/tenant/dashboard"
      showNotifications={true}
    />
  );
};

export default TenantNavbar;