import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building, Users, Wrench, Package, FileText, Settings, FileArchive, X
} from 'lucide-react';

// Brand colors
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';
const ACTIVE_BG = '#e6f7f2'; // very light emerald

const navLinks = [
  { name: 'Dashboard', path: '/pm/dashboard', icon: LayoutDashboard },
  { name: 'Properties', path: '/pm/properties', icon: Building },
  { name: 'Tenants', path: '/pm/tenants', icon: Users },
  { name: 'Service Requests', path: '/pm/requests', icon: Wrench },
  { name: 'Scheduled Maintenance', path: '/pm/scheduled-maintenance', icon: FileArchive },
  { name: 'Vendors', path: '/pm/vendors', icon: Package },
  { name: 'Reports', path: '/pm/reports', icon: FileText },
  { name: 'Profile & Settings', path: '/pm/profile', icon: Settings },
];

function PropertyManagerSidebar({ isSidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
      sidebarRef.current?.focus();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isSidebarOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (isSidebarOpen && e.key === "Escape") toggleSidebar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSidebarOpen, toggleSidebar]);

  return (
    <>
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
          fixed z-50 inset-y-0 left-0 w-68 bg-[#219377] text-white flex flex-col p-6 shadow-2xl transform transition-transform duration-300
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
        <div className="text-3xl font-extrabold mb-10 text-center tracking-tight text-white select-none drop-shadow">
          Fix It
          <span className="block text-sm font-semibold mt-1" style={{ color: SECONDARY_COLOR, letterSpacing: '0.03em' }}>
            Property Manager
          </span>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {navLinks.map((link) => {
              // Active if exact match or startsWith for sub pages (except dashboard)
              const isActive = (
                location.pathname === link.path ||
                (location.pathname.startsWith(link.path) && link.path !== '/pm/dashboard')
              );
              return (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200
                      ${isActive
                        ? ""
                        : "hover:bg-[#e6f7f2] hover:text-[#219377]"
                      }
                    `}
                    style={
                      isActive
                        ? {
                            background: ACTIVE_BG,
                            color: PRIMARY_COLOR,
                            fontWeight: 600,
                            boxShadow: "0 1px 4px 0 #00000014",
                          }
                        : { color: "#fff", opacity: 0.95 }
                    }
                    onClick={() => {
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                  >
                    <link.icon
                      className="w-6 h-6 mr-3"
                      style={{
                        color: isActive ? PRIMARY_COLOR : SECONDARY_COLOR,
                        opacity: isActive ? 1 : 0.9,
                        transition: "color 0.2s"
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

export default PropertyManagerSidebar;