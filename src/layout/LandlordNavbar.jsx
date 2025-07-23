import React from 'react';
import Navbar from './UserNavbar';

const LandlordNavbar = ({ onMenuClick }) => {
  return (
    <Navbar
      onMenuClick={onMenuClick}
      portalName="Landlord"
      portalAccent="Panel"
      dashboardPath="/landlord/dashboard"
      showNotifications={true}
    />
  );
};

export default LandlordNavbar;