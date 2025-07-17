// frontend/src/pages/errors/NotFoundPage.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { AlertCircle } from "lucide-react";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx"; // Import useGlobalAlert
import { ROUTES } from "../../utils/constants.js"; // Import ROUTES

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { showInfo } = useGlobalAlert(); // Destructure showInfo from useGlobalAlert
  const [searchTerm, setSearchTerm] = useState(""); // State for the search input

  // Handle reporting a problem
  const handleReportProblem = () => {
    showInfo("Thanks for reporting! We'll look into it.");
    // In a real application, you would send this report to your backend
    // e.g., reportService.sendErrorLog({ path: window.location.pathname, message: "404 encountered" });
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // In a real application, you might debounce this and suggest pages,
    // or trigger a search on Enter key press.
  };

  // Keyboard shortcut to return home
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'h' || event.key === 'H') {
        navigate(ROUTES.HOME);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]); // Dependency array includes navigate to ensure it's up-to-date

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#e0f7fa] to-[#ffffff] px-4 text-center animate-fadeIn">
      <AlertCircle className="w-16 h-16 text-[#219377] mb-4 animate-bounce" />
      <div className="text-6xl mb-2">🚧</div>
      <h1 className="text-5xl font-extrabold text-gray-900 mb-2 animate-pulse">404</h1>
      <p className="text-lg text-gray-700 mb-2">
        Oops! The page you're looking for doesn't exist.
      </p>
      <p className="text-sm text-gray-500 italic mb-4">
        "Even the best explorers get lost sometimes."
      </p>

      {/* Search Bar */}
      <div className="mb-6 w-full max-w-md">
        <input
          type="text"
          placeholder="Search for a page..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#219377] transition"
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4"> {/* Added flex-wrap for responsiveness */}
        <Link
          to={ROUTES.HOME}
          className="inline-block px-6 py-3 bg-[#219377] text-white font-semibold rounded-xl hover:bg-[#1c7e67] transition"
        >
          Go Back Home
        </Link>
        <Link
          to={ROUTES.DEMO}
          className="inline-block px-6 py-3 border border-[#219377] text-[#219377] font-semibold rounded-xl hover:bg-[#219377] hover:text-white transition"
        >
          Demo
        </Link>
        <button
          className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
          onClick={handleReportProblem}
        >
          Report Problem
        </button>
      </div>

      {/* Useful Links */}
      <div className="mt-8 text-left">
        <p className="font-semibold mb-2">Or try these links:</p>
        <ul className="space-y-2">
          <li>
            <Link to={ROUTES.FEATURES} className="text-[#219377] hover:underline">Features</Link> {/* Changed to a more relevant link */}
          </li>
          <li>
            <Link to={ROUTES.SUPPORT} className="text-[#219377] hover:underline">Contact Support</Link> {/* Changed to a more relevant link */}
          </li>
          <li>
            <Link to={ROUTES.PRICING} className="text-[#219377] hover:underline">Pricing</Link> {/* Changed to a more relevant link */}
          </li>
        </ul>
      </div>

      {/* Keyboard Tip */}
      <p className="text-xs text-gray-400 mt-4">
        Tip: Press <kbd className="px-2 py-1 bg-gray-100 rounded">H</kbd> to return home.
      </p>

      {/* Animations (kept as inline style for simplicity as they are specific to this page) */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        `}
      </style>
    </div>
  );
};

export default NotFoundPage;
