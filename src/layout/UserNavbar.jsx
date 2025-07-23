import React, { useState, useEffect } from 'react';
import { Bell, LogOut, Menu, User, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

const Navbar = ({ 
  onMenuClick, 
  portalName, 
  portalAccent,
  dashboardPath,
  portalColor = "green", // Default color theme
  showNotifications = true 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState('');
  
  // Safely access notifications with error handling
  const notificationsContext = useNotifications();
  const unreadCount = notificationsContext?.unreadCount || 0;

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
      setCurrentTime(formatted);
    };
    
    updateTime();
    const timer = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Format user display name with priority for different fields
  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.name || user?.username || user?.email || 'User';

  // Format role display
  const roleDisplay = user?.role?.replace(/_/g, ' ') || '';
  
  // Determine color theme class based on portal
  const colorTheme = {
    green: {
      brand: "text-green-700",
      accent: "text-yellow-500",
      notification: "text-green-700 bg-green-50 hover:bg-green-100",
      username: "text-green-700"
    },
    blue: {
      brand: "text-blue-700",
      accent: "text-blue-400", 
      notification: "text-blue-700 bg-blue-50 hover:bg-blue-100",
      username: "text-blue-700"
    },
    purple: {
      brand: "text-purple-700",
      accent: "text-purple-400",
      notification: "text-purple-700 bg-purple-50 hover:bg-purple-100",
      username: "text-purple-700"
    }
  }[portalColor] || colorTheme.green;

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
      {/* Left side: Hamburger for mobile and Brand for desktop */}
      <div className="flex items-center">
        <button
          className="md:hidden text-gray-600 mr-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link 
          to={dashboardPath} 
          className="hidden md:flex items-center"
          aria-label={`${portalName}${portalAccent} Dashboard`}
        >
          <span className={`font-extrabold text-xl tracking-tight ${colorTheme.brand}`}>
            {portalName}<span className={colorTheme.accent}>{portalAccent}</span>
          </span>
        </Link>
      </div>

      {/* Center: Current date and time on larger screens */}
      <div className="hidden lg:flex items-center">
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {showNotifications && (
          <Link
            to={`${dashboardPath.split('/')[1]}/notifications`}
            className={`relative p-2 rounded-full transition-colors ${colorTheme.notification}`}
            title="Notifications"
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        )}
        <div className="w-px h-8 bg-gray-200 hidden sm:block" aria-hidden="true" />
        <div className="flex items-center">
          <div className="text-right mr-2 sm:mr-3 hidden xs:block">
            <p className={`text-sm font-semibold ${colorTheme.username} truncate max-w-[120px] sm:max-w-[160px]`}>
              {displayName}
            </p>
            <p className="text-xs capitalize text-gray-600">
              {roleDisplay}
            </p>
          </div>
          <div className="hidden xs:flex h-8 w-8 rounded-full bg-gray-200 items-center justify-center mr-2">
            <User className="h-5 w-5 text-gray-500" />
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full text-red-600 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;