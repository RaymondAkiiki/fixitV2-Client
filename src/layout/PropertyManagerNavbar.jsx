import React from 'react';
import Navbar from './UserNavbar';

const PropertyManagerNavbar = ({ onMenuClick }) => {
  return (
    <Navbar
      onMenuClick={onMenuClick}
      portalName="Manager"
      portalAccent="Portal"
      dashboardPath="/pm/dashboard"
      showNotifications={true}
    />
  );
};

export default PropertyManagerNavbar;