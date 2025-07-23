import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { name: "Features", to: "/features" },
  { name: "Pricing", to: "/pricing" },
  { name: "Support", to: "/support" },
];

const Header = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-gradient-to-b from-[#219377] to-[#1b755f] text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4 md:px-10 relative">
        {/* Logo + Wordmark */}
        <Link to="/welcome" className="flex items-center space-x-2 group">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-[#ffbd59] transition-transform group-hover:scale-105">
              {/* SVG logo suggestion (replace as needed) */}
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" fill="#219377" />
                <path d="M13 24l7-8 7 8" stroke="#ffbd59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white drop-shadow-lg">
            <span className="text-[#ffbd59]">Fixit</span> by Threalty
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 ml-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative py-1 transition-colors duration-200 ${
                location.pathname === link.to ? "text-[#ffbd59]" : "hover:text-[#ffbd59]"
              }`}
            >
              {link.name}
              <span
                className={`absolute left-0 right-0 -bottom-1 h-0.5 bg-[#ffbd59] transition-all duration-300 ${
                  location.pathname === link.to ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center space-x-3">
          <Link
            to="/register"
            className="px-4 py-2 bg-white text-[#219377] rounded-full font-semibold border-2 border-[#219377] shadow hover:bg-[#ffbd59] hover:text-[#219377] transition-all duration-200"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-[#ffbd59] text-[#219377] rounded-full font-semibold shadow hover:bg-[#ffca7a] transition-all duration-200"
          >
            Login
          </Link>
          {/* Optional: Book Demo */}
          <Link
            to="/demo"
            className="ml-2 px-4 py-2 rounded-full font-semibold text-white bg-[#219377] border-2 border-[#ffbd59] hover:bg-[#ffbd59] hover:text-[#219377] transition-all duration-200 hidden lg:inline-block"
          >
            About Us
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-center h-10 w-10 focus:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Open menu"
        >
          <span className={`block w-7 h-0.5 bg-[#ffbd59] mb-1 transform transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}/>
          <span className={`block w-7 h-0.5 bg-[#ffbd59] mb-1 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`}/>
          <span className={`block w-7 h-0.5 bg-[#ffbd59] transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}/>
        </button>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#219377] shadow-lg md:hidden animate-fade-in">
            <nav className="flex flex-col p-4 space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`py-2 px-2 rounded transition-colors duration-200 font-semibold ${
                    location.pathname === link.to ? "bg-[#ffbd59] text-[#219377]" : "hover:bg-[#ffbd59] hover:text-[#219377]"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/register"
                className="py-2 px-2 rounded bg-white text-[#219377] font-semibold border-2 border-[#219377] mb-1"
                onClick={() => setMobileOpen(false)}
              >
                Register
              </Link>
              <Link
                to="/login"
                className="py-2 px-2 rounded bg-[#ffbd59] text-[#219377] font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/demo"
                className="py-2 px-2 rounded bg-[#219377] border-2 border-[#ffbd59] text-white font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                Book a Demo
              </Link>
            </nav>
          </div>
        )}
      </div>
      {/* Animation styles */}
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px);}
            to { opacity: 1; transform: none;}
          }
          .animate-fade-in { animation: fade-in 0.4s both; }
        `}
      </style>
    </header>
  );
};

export default Header;