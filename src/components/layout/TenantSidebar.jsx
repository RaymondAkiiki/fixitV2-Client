import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaTools,
  FaBell,
  FaClipboardList,
  FaUserCircle,
  FaBuilding,
} from "react-icons/fa";
import { X } from "lucide-react";

/**
 * TenantSidebar – clean, modern, and branded for tenant experience.
 * Emerald (#219377) base, lighter highlight (#e6f7f2) and secondary (#ffbd59) for accent.
 */
function TenantSidebar({ isSidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const sidebarRef = useRef(null);

  const navLinks = [
    { name: "Dashboard", path: "/tenant/dashboard", icon: FaHome },
    { name: "My Requests", path: "/tenant/requests", icon: FaTools },
    { name: "My Unit", path: "/tenant/my-unit", icon: FaBuilding },
    { name: "Notifications", path: "/tenant/notifications", icon: FaBell },
    { name: "Scheduled Works", path: "/tenant/scheduled-maintenance", icon: FaClipboardList },
    { name: "My Profile", path: "/tenant/profile", icon: FaUserCircle },
  ];

  // Prevent background scroll when sidebar is open (on mobile)
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
      sidebarRef.current?.focus();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isSidebarOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (isSidebarOpen && e.key === "Escape") toggleSidebar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSidebarOpen, toggleSidebar]);

  // Lighter highlight for active nav: #e6f7f2 (very light emerald)
  const ACTIVE_BG = "#e6f7f2";
  const ACTIVE_TEXT = "#219377";
  const ICON_ACTIVE = "#219377";

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden animate-fade-in"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
          tabIndex={-1}
          role="button"
        />
      )}
      <nav
        ref={sidebarRef}
        tabIndex={isSidebarOpen ? 0 : -1}
        className={`
          fixed z-50 inset-y-0 left-0 w-64 bg-[#219377] text-white flex flex-col p-6 shadow-xl transform transition-transform duration-300
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:z-auto md:shadow-none
        `}
        aria-label="Sidebar"
        aria-hidden={!(isSidebarOpen || window.innerWidth >= 768)}
        style={{ transitionTimingFunction: "cubic-bezier(.4,0,.2,1)" }}
      >
        {/* Mobile close button */}
        <div className="md:hidden flex justify-end mb-2">
          <button
            className="text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        <div className="text-3xl font-extrabold mb-8 text-center text-[#ffbd59] select-none tracking-tight drop-shadow">
          Tenant Portal
        </div>
        <nav className="flex-1">
          <ul className="space-y-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200 
                      ${
                        isActive
                          ? ""
                          : "hover:bg-[#e6f7f2] hover:text-[#219377]"
                      }
                    `}
                    style={
                      isActive
                        ? {
                            background: ACTIVE_BG,
                            color: ACTIVE_TEXT,
                            fontWeight: 600,
                            boxShadow: "0 1px 4px 0 #00000014",
                          }
                        : {}
                    }
                    onClick={() => {
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                  >
                    <link.icon
                      className="mr-3 text-xl"
                      style={{
                        color: isActive ? ICON_ACTIVE : "#fff",
                        opacity: isActive ? 1 : 0.9,
                        transition: "color 0.2s",
                      }}
                    />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-8 text-sm text-[#ffbd59] text-center tracking-tight font-semibold drop-shadow">
          &copy; {new Date().getFullYear()} Fix It by Threalty
        </div>
      </nav>
    </>
  );
}

export default TenantSidebar;