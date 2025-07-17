import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home, FileText, Users, Settings, ClipboardList, UserCircle, X
} from "lucide-react";
import { useEffect, useRef } from "react";

const roleNav = {
  tenant: [
    { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { label: "Requests", path: "/dashboard/requests", icon: <ClipboardList size={20} /> },
    { label: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { label: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }, // <-- Missing comma fixed here
    { label: "My Lease", path: "/dashboard/leases" },
    { label: "Payments", path: "/dashboard/payments" },
    { label: "Onboarding", path: "/dashboard/onboarding" },
    { label: "Notifications", path: "/dashboard/notifications" },
  ],
  property_manager: [
    { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { label: "Requests", path: "/dashboard/requests", icon: <ClipboardList size={20} /> },
    { label: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { label: "Vendors", path: "/dashboard/vendors", icon: <Users size={20} /> },
    { label: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> },
    { label: "Properties", path: "/dashboard/properties" },
    { label: "Leases", path: "/dashboard/leases" },
    { label: "Payments", path: "/dashboard/payments" },
    { label: "Onboarding", path: "/dashboard/onboarding" },
    { label: "Notifications", path: "/dashboard/notifications" },
  ],
 
  landlord: [
    { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { label: "Requests", path: "/dashboard/requests", icon: <ClipboardList size={20} /> },
    { label: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { label: "Vendors", path: "/dashboard/vendors", icon: <Users size={20} /> },
    { label: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }, // <-- Missing comma fixed here
    { label: "Properties", path: "/dashboard/properties" },
    { label: "Leases", path: "/dashboard/leases" },
    { label: "Payments", path: "/dashboard/payments" },
    { label: "Onboarding", path: "/dashboard/onboarding" },
    { label: "Notifications", path: "/dashboard/notifications" },
  ]
};

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const sidebarRef = useRef(null);

  // Fallback to minimal nav if role not set
  const navItems = roleNav[user?.role] || roleNav.tenant;

  // Prevent background scroll and focus sidebar when open
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
      // Focus for accessibility
      sidebarRef.current?.focus();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [isSidebarOpen]);

  // Allow Esc key to close sidebar on mobile
  useEffect(() => {
    const handler = (e) => {
      if (isSidebarOpen && e.key === "Escape") {
        toggleSidebar();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSidebarOpen, toggleSidebar]);

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden animate-fade-in"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
          tabIndex={-1}
          role="button"
        />
      )}

      {/* Sidebar */}
      <nav
        ref={sidebarRef}
        tabIndex={isSidebarOpen ? 0 : -1}
        className={`fixed z-50 inset-y-0 left-0 w-72 bg-gradient-to-b from-[#219377] via-[#219377] to-[#24b388] shadow-xl transform transition-transform duration-300
        flex flex-col
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:z-auto md:shadow-none`}
        aria-label="Sidebar"
        aria-hidden={!(isSidebarOpen || window.innerWidth >= 768)}
        style={{ transitionTimingFunction: "cubic-bezier(.4,0,.2,1)" }}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end px-3 pt-4">
          <button
            className="text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        {/* Brand/Header */}
        <div className="flex items-center gap-2 px-6 pt-6 pb-5 border-b border-[#ffffff22]">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-12 w-12 rounded-full border-4 border-white shadow-md bg-white/90 object-contain animate-pop"
            style={{ boxShadow: "0 0 0 4px #ffbd59, 0 2px 24px #ffbd5977" }}
          />
          <span className="font-extrabold text-2xl text-white drop-shadow-lg tracking-tight">
            FixIt
          </span>
        </div>

        {/* Nav Items */}
        <ul className="flex-1 space-y-0.5 px-2 py-8">
          {navItems.map(({ label, path, icon }) => (
            <li key={path}>
              <Link
                to={path}
                className={`flex items-center gap-3 px-5 py-3 rounded-lg transition-colors duration-300 text-base group 
                ${
                  pathname === path
                    ? "bg-[#ffbd59] text-[#219377] font-bold shadow-lg animate-slide-in"
                    : "text-white hover:bg-[#ffffff17] hover:text-[#ffbd59]"
                }`}
                onClick={() => {
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                aria-current={pathname === path ? "page" : undefined}
              >
                <span
                  className={`transition-transform duration-200 ${
                    pathname === path ? "scale-110 text-[#219377]" : "group-hover:text-[#ffbd59]"
                  }`}
                >
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* User info at the bottom */}
        <div className="px-6 py-5 mt-auto border-t border-[#ffffff22] flex items-center gap-4 bg-white/70 animate-fade-in">
          <UserCircle className="text-[#219377]" size={30} />
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold truncate text-[#219377]">
              {user?.name || "User"}
            </div>
            <div className="text-xs text-[#219377]/70 capitalize truncate">{user?.role?.replace("_", " ")}</div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
