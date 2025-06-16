import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home, FileText, Users, Settings, ClipboardList, UserCircle
} from "lucide-react";
import { useEffect } from "react";

const roleNav = {
  tenant: [
    { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { label: "Requests", path: "/dashboard/requests", icon: <ClipboardList size={20} /> },
    { label: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { label: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ],
  property_manager: [
    { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { label: "Requests", path: "/dashboard/requests", icon: <ClipboardList size={20} /> },
    { label: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { label: "Vendors", path: "/dashboard/vendors", icon: <Users size={20} /> },
    { label: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ],
  landlord: [
    { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { label: "Requests", path: "/dashboard/requests", icon: <ClipboardList size={20} /> },
    { label: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { label: "Vendors", path: "/dashboard/vendors", icon: <Users size={20} /> },
    { label: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> }
  ]
};

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Fallback to minimal nav if role not set
  const navItems = roleNav[user?.role] || roleNav.tenant;

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [isSidebarOpen]);

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden animate-fade-in"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed z-50 inset-y-0 left-0 w-72 bg-gradient-to-b from-[#219377] via-[#219377] to-[#24b388] shadow-xl transform transition-transform duration-300
        flex flex-col
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:z-auto md:shadow-none`}
        aria-label="Sidebar"
        style={{ transitionTimingFunction: "cubic-bezier(.4,0,.2,1)" }}
      >
        {/* Brand/Header */}
        <div className="flex items-center gap-2 px-6 pt-8 pb-5 border-b border-[#ffffff22]">
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






// import React from "react";
// import { NavLink } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// const Sidebar = () => {
//   const { user } = useAuth();

//   // Role-based links if needed
//   const navLinks = [
//     { to: "/dashboard", label: "Dashboard" },
//     { to: "/properties", label: "Properties" },
//     { to: "/units", label: "Units" },
//     { to: "/requests", label: "Requests" },
//     { to: "/maintenance", label: "Maintenance" },
//     { to: "/vendors", label: "Vendors" },
//     { to: "/tenants", label: "Tenants" },
//     { to: "/notifications", label: "Notifications" },
//     { to: "/reports", label: "Reports" },
//     { to: "/profile", label: "My Profile" },
//   ];

//   // Add admin links if user is admin
//   if (user?.role === "admin") {
//     navLinks.push({ to: "/admin/audit-log", label: "Audit Log" });
//     navLinks.push({ to: "/admin/users", label: "All Users" });
//   }

//   return (
//     <aside className="w-60 bg-white shadow-md flex flex-col min-h-screen px-2 py-4">
//       <div className="font-bold text-2xl mb-6 text-blue-700 px-2">Fixit App</div>
//       <nav className="flex-1">
//         {navLinks.map((link) => (
//           <NavLink
//             key={link.to}
//             to={link.to}
//             className={({ isActive }) =>
//               `block px-4 py-2 rounded hover:bg-blue-100 ${isActive ? "bg-blue-200 font-semibold" : ""}`
//             }
//           >
//             {link.label}
//           </NavLink>
//         ))}
//       </nav>
//     </aside>
//   );
// };

// export default Sidebar;