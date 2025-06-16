import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const NotFoundPage = () => {
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
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#219377] transition"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-[#219377] text-white font-semibold rounded-xl hover:bg-[#1c7e67] transition"
        >
          Go Back Home
        </Link>
        <Link
          to="/demo"
          className="inline-block px-6 py-3 border border-[#219377] text-[#219377] font-semibold rounded-xl hover:bg-[#219377] hover:text-white transition"
        >
          Demo
        </Link>
        <button
          className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
          onClick={() => alert("Thanks for reporting!")}
        >
          Report Problem
        </button>
      </div>

      {/* Useful Links */}
      <div className="mt-8 text-left">
        <p className="font-semibold mb-2">Or try these links:</p>
        <ul className="space-y-2">
          <li>
            <Link to="/about" className="text-[#219377] hover:underline">About Us</Link>
          </li>
          <li>
            <Link to="/contact" className="text-[#219377] hover:underline">Contact Support</Link>
          </li>
          <li>
            <Link to="/faq" className="text-[#219377] hover:underline">FAQ</Link>
          </li>
        </ul>
      </div>

      {/* Keyboard Tip */}
      <p className="text-xs text-gray-400 mt-4">
        Tip: Press <kbd className="px-2 py-1 bg-gray-100 rounded">H</kbd> to return home.
      </p>
    </div>
  );
};

export default NotFoundPage;