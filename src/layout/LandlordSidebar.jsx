import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  BarChart3,
  Users,
  Wrench,
  Send,
  FileArchive,
  Package,
  User,
  X
} from 'lucide-react';

const PRIMARY_COLOR = '#219377';
const PRIMARY_BG = '#1a3b34';
const SECONDARY_COLOR = '#ffbd59';

const NAV_LINKS = [
  { to: "/landlord/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/landlord/properties", label: "Properties", icon: Home },
  { to: "/landlord/requests", label: "Requests", icon: Wrench },
  { to: "/landlord/scheduled-maintenance", label: "Scheduled-works", icon: FileArchive },
  { to: "/landlord/vendors", label: "Vendors", icon: Package },
  { to: "/landlord/tenants", label: "Tenants", icon: Users },
  { to: "/landlord/reports", label: "Reports", icon: BarChart3 },
  { to: "/landlord/invites", label: "Invites", icon: Send },
  { to: "/landlord/profile", label: "Profile", icon: User }
];

const LandlordSidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const sidebarRef = useRef(null);

  // Prevent background scroll and focus for accessibility when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
      sidebarRef.current?.focus();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isSidebarOpen]);

  // Close with Esc key
  useEffect(() => {
    const handler = (e) => {
      if (isSidebarOpen && e.key === "Escape") toggleSidebar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isSidebarOpen, toggleSidebar]);

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 group
      ${
        isActive
          ? 'sidebar-link-active'
          : 'sidebar-link-inactive'
      }
    `;

  return (
    <>
      {/* Mobile overlay */}
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
        className={`
          fixed z-50 inset-y-0 left-0 w-64 transition-transform duration-300 flex flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:z-auto md:shadow-none md:flex
        `}
        aria-label="Sidebar"
        aria-hidden={!(isSidebarOpen || window.innerWidth >= 768)}
        style={{
          background: PRIMARY_BG,
          borderRight: `2px solid ${PRIMARY_COLOR}22`,
          transitionTimingFunction: "cubic-bezier(.4,0,.2,1)"
        }}
      >
        {/* Mobile close button */}
        <div className="md:hidden flex justify-end px-3 pt-4">
          <button
            className="text-white rounded-full p-2 focus:outline-none focus:ring-2"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
            style={{
              background: "#143027"
            }}
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex items-center justify-center h-16 border-b"
          style={{ borderColor: PRIMARY_COLOR + "33" }}>
          <Home className="h-7 w-7" style={{ color: SECONDARY_COLOR }} />
          <span className="ml-2 text-xl font-extrabold tracking-tight"
                style={{ color: SECONDARY_COLOR }}>
            My Properties
          </span>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={navLinkClass}
              style={{
                marginBottom: 2
              }}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
            >
              <Icon className="w-5 h-5 mr-3 group-hover:text-[#ffbd59] transition-colors duration-200"
                style={{ color: SECONDARY_COLOR }} />
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        {/* Minimal footer brand */}
        <div className="p-3 text-xs font-medium text-center" style={{ color: SECONDARY_COLOR + "cc" }}>
          © {new Date().getFullYear()} Landlord
        </div>
      </nav>
      <style>
        {`
          .sidebar-link-active {
            background: linear-gradient(90deg, ${PRIMARY_COLOR} 80%, ${SECONDARY_COLOR} 100%);
            color: #fff !important;
            box-shadow: 0 2px 8px 0 ${PRIMARY_COLOR}22;
          }
          .sidebar-link-inactive {
            color: #e3e3e3;
            background: transparent;
          }
          .sidebar-link-inactive:hover {
            background: ${PRIMARY_COLOR}33;
            color: ${SECONDARY_COLOR};
          }
          .sidebar-link-label {
            letter-spacing: 0.02em;
          }
        `}
      </style>
    </>
  );
};

export default LandlordSidebar;