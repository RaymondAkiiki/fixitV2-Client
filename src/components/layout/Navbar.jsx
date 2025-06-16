import { useAuth } from "../../context/AuthContext";
import { Menu, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  return (
    <header className="sticky top-0 z-30 bg-[#219377] shadow-md">
      <nav className="flex items-center justify-between px-4 md:px-10 h-16">
        {/* Sidebar Toggle (mobile only) */}
        <button
          onClick={toggleSidebar}
          className="md:hidden text-[#ffbd59] hover:text-white focus:outline-none transition"
          aria-label="Toggle sidebar"
        >
          <Menu size={28} />
        </button>

        {/* App/Page Title */}
        <div className="text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
          {user?.role
            ? user.role.replace("_", " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase()) + " Panel"
            : "Dashboard"}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative text-[#ffbd59] hover:text-white focus:outline-none transition" aria-label="Notifications">
            <Bell size={24} />
            {/* Example badge: */}
            {/* <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">3</span> */}
          </button>

          {/* Profile menu */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 hover:bg-[#ffbd59] transition text-base font-bold text-[#219377] border-2 border-[#219377] shadow-sm"
              onClick={() => setShowMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={showMenu}
            >
              <span className="hidden sm:inline">{user?.name || "User"}</span>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#ffbd59] text-[#219377] font-extrabold uppercase shadow-md">
                {user?.name?.[0] || "U"}
              </span>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#21937722] z-50 animate-fade-in" role="menu">
                <div className="px-4 py-3 border-b">
                  <div className="font-semibold text-base text-[#219377]">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.role?.replace("_", " ")}</div>
                </div>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-base text-rose-600 hover:bg-rose-50"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;