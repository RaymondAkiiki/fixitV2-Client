import React from "react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-gradient-to-b from-[#219377] to-[#1b755f] text-white pt-14 pb-8 px-6 md:px-20 mt-10">
    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
      {/* Brand */}
      <div>
        <Link to="/welcome" className="flex items-center mb-3 group">
          <div className="relative flex items-center justify-center mr-2">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-[#ffbd59]">
              {/* SVG logo suggestion, update as needed */}
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" fill="#219377" />
                <path d="M13 24l7-8 7 8" stroke="#ffbd59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#ffbd59] transition">
            <span className="text-[#ffbd59]">Fixit</span> by Threalty
          </span>
        </Link>
        <p className="text-base leading-relaxed mt-2 text-white/90">
          Your intelligent home repair assistant. Log issues, assign tasks, and track resolutions in real-time.<br />
          Designed for property managers, landlords, and tenants.
        </p>
      </div>
      {/* Apps */}
      <div>
        <h3 className="text-lg font-semibold text-[#ffbd59] mb-3">Our Other Apps</h3>
        <ul className="space-y-3 text-base">
          <li>
            <Link to="/coming-soon" className="hover:underline">Lease and Tenant Manager</Link>
          </li>
          <li>
            <Link to="/coming-soon" className="hover:underline">Real Estate Genie</Link>
          </li>
          <li>
            <Link to="/coming-soon" className="hover:underline">Real Estate AI Chatbot</Link>
          </li>
        </ul>
      </div>
      {/* Contact */}
      <div>
        <h3 className="text-lg font-semibold text-[#ffbd59] mb-3">Contact</h3>
        <ul className="text-base space-y-1">
          <li>Email: <a href="mailto:support@threalty.ug" className="hover:underline">support@threalty.ug</a></li>
          <li>Phone: <a href="tel:+256758445298" className="hover:underline">+256 758 445298</a></li>
          <li>Office: <span className="font-semibold">Kireka, Profla Road</span></li>
        </ul>
      </div>
      {/* Social / Legal */}
      <div>
        <h3 className="text-lg font-semibold text-[#ffbd59] mb-3">Stay Connected</h3>
        <div className="flex space-x-4 mb-3">
          <a href="#" className="hover:text-[#ffbd59]" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
          <a href="#" className="hover:text-[#ffbd59]" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
          <a href="#" className="hover:text-[#ffbd59]" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
          <a href="#" className="hover:text-[#ffbd59]" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
        </div>
        <ul className="text-base space-y-1">
          <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
          <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
          <li><Link to="/feedback" className="hover:underline">Give Feedback</Link></li>
        </ul>
      </div>
    </div>
    <div className="mt-10 border-t border-white/20 pt-4 text-center text-sm text-white/80">
      <p>© {new Date().getFullYear()} Threalty Services Limited. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;