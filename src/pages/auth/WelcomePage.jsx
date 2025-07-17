// frontend/src/pages/auth/WelcomePage.jsx

import React from "react";
import { Link } from "react-router-dom";
import { ROUTES, APP_NAME } from "../../utils/constants.js"; // Import ROUTES and APP_NAME

// Unified app names/descriptions/links for other Threalty products
const otherThrealtyApps = [
  {
    name: "Real Estate Genie",
    desc: "Draft real estate documents faster with AI-powered templates.",
    link: ROUTES.COMING_SOON, // Use constant for link
    icon: "📄", // Explicit icon for clarity
  },
  {
    name: "Real Estate AI Chatbot",
    desc: "Get instant answers and property matches 24/7 with our smart assistant.",
    link: ROUTES.COMING_SOON, // Use constant for link
    icon: "🤖", // Explicit icon for clarity
  },
];

const WelcomePage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-[#e4faf3] via-white to-[#fff7ea] text-center px-4 overflow-hidden">
        {/* Decorative animated shapes */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
          <div className="absolute left-10 top-12 w-24 h-24 bg-[#219377]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute right-10 bottom-16 w-32 h-32 bg-[#ffbd59]/20 rounded-full blur-2xl animate-pulse-slow" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#219377] mb-4 drop-shadow-lg animate-fade-in">
            Welcome to <span className="text-[#ffbd59]">{APP_NAME.split(' ')[0]}</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-gray-700 mb-8 animate-fade-in delay-150">
            The smartest way to handle property maintenance, leases, and tenants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in delay-200">
            <Link to={ROUTES.REGISTER}>
              <button className="bg-[#ffbd59] text-white text-lg font-bold px-8 py-3 rounded-xl shadow-md hover:bg-[#e0a84e] transition">
                Get Started Free
              </button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <button className="bg-white text-[#219377] border-2 border-[#219377] text-lg font-bold px-8 py-3 rounded-xl shadow-md hover:bg-[#219377] hover:text-white transition">
                Login
              </button>
            </Link>
          </div>
          <p className="text-base text-[#219377] font-semibold uppercase tracking-wider animate-bounce">
            No credit card needed – try it risk-free!
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 px-6 md:px-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-[#219377] mb-10 animate-fade-in">
            Everything you need, <span className="text-[#ffbd59]">in one place</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div className="p-8 rounded-2xl shadow-lg border border-[#e4faf3] hover:scale-105 transform transition duration-300 bg-[#f7faf9] animate-fade-in delay-75">
              <div className="text-5xl mb-4">🛠️</div>
              <h3 className="text-2xl font-semibold text-[#219377] mb-2">Automated Issue Tracking</h3>
              <p className="text-gray-600">Log, assign and monitor repairs. Stay ahead with instant notifications for every update.</p>
            </div>
            <div className="p-8 rounded-2xl shadow-lg border border-[#ffe8c0] hover:scale-105 transform transition duration-300 bg-[#fff7ea] animate-fade-in delay-150">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-2xl font-semibold text-[#ffbd59] mb-2">Tenant & Vendor Portal</h3>
              <p className="text-gray-600">Empower tenants to report issues and vendors to respond instantly through their own dashboards.</p>
            </div>
            <div className="p-8 rounded-2xl shadow-lg border border-[#e4faf3] hover:scale-105 transform transition duration-300 bg-[#f7faf9] animate-fade-in delay-200">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold text-[#219377] mb-2">Smart Analytics</h3>
              <p className="text-gray-600">Visualize trends, costs, and response times. Make data-driven decisions to grow your business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Every Role Section */}
      <section className="bg-gray-50 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in">Built for Every Role</h2>
        <div className="grid md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto">
          {[
            {
              title: "Property Managers",
              desc: "Handle dozens of properties effortlessly. Track issues, vendors, and leases from one dashboard.",
              icon: "🏢",
            },
            {
              title: "Landlords",
              desc: "Stay informed without the micromanaging. Get auto-updates and performance logs anytime.",
              icon: "👔",
            },
            {
              title: "Tenants",
              desc: "Request repairs in seconds. Get real-time progress without chasing anyone.",
              icon: "🙋",
            },
          ].map((role, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-md text-center animate-fade-in delay-100 hover:scale-105 transition">
              <div className="text-4xl mb-3">{role.icon}</div>
              <h4 className="text-xl font-semibold mb-2 text-[#219377]">{role.title}</h4>
              <p className="text-gray-600">{role.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Callout Section */}
      <section className="relative py-16 px-6 md:px-20 bg-gradient-to-r from-[#219377]/10 via-white to-[#ffbd59]/10 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#ffbd59] mb-4 animate-fade-in">Why Fixit?</h2>
          <p className="text-lg md:text-xl text-gray-700 mb-6 animate-fade-in delay-100">
            <span className="font-semibold text-[#219377]">Time saved, tenants happy, and properties in top shape.</span>
            <br />With Fixit, you automate tedious tasks and unlock peace of mind.
          </p>
          <div className="mt-10 flex flex-col md:flex-row gap-6 justify-center text-left">
            <div className="flex-1 rounded-xl border-l-4 border-[#219377] bg-white p-6 shadow-md animate-fade-in delay-200">
              <div className="text-3xl mb-2">💡</div>
              <div className="mb-1 text-lg font-bold text-[#219377]">AI Powered Suggestions</div>
              <div className="text-gray-600">Let our system recommend the best vendors and solutions for every maintenance request.</div>
            </div>
            <div className="flex-1 rounded-xl border-l-4 border-[#ffbd59] bg-white p-6 shadow-md animate-fade-in delay-250">
              <div className="text-3xl mb-2">⚡</div>
              <div className="mb-1 text-lg font-bold text-[#ffbd59]">Lightning Fast Communication</div>
              <div className="text-gray-600">Keep everyone in the loop with real-time updates and messaging.</div>
            </div>
          </div>
        </div>
      </section>

      {/* More from Threalty Section - Restyled with Icons */}
      <section className="bg-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-8 animate-fade-in">More from Threalty</h2>
        <p className="text-gray-700 mb-10 animate-fade-in delay-100">
          Explore our growing suite of AI-powered real estate tools.
        </p>
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2"> {/* Changed to md:grid-cols-2 as there are now only 2 apps */}
          {otherThrealtyApps.map((app, i) => (
            <Link
              to={app.link}
              key={app.name}
              className={`
                flex flex-col items-start p-6 bg-gray-50 rounded-xl shadow hover:shadow-lg
                transition transform hover:scale-105 animate-fade-in
              `}
              style={{
                animationDelay: `${0.1 * i}s`, // Dynamic delay for animation
                minHeight: "190px",
              }}
            >
              <div className="mb-3 text-4xl">
                {app.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#219377]">{app.name}</h3>
              <p className="text-gray-600">{app.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-16 px-6 md:px-20 bg-gradient-to-r from-[#ffbd59]/20 via-white to-[#219377]/10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#219377] mb-4 animate-fade-in">Simple Pricing, Unlimited Value</h2>
          <p className="text-lg md:text-xl text-gray-700 mb-8 animate-fade-in delay-100">
            Pay as you grow. Flexible plans for landlords, managers and enterprises.<br />
            <span className="font-semibold text-[#ffbd59]">Start free, no setup fees, cancel anytime.</span>
          </p>
          <Link to={ROUTES.PRICING}>
            <button className="bg-[#219377] text-white text-lg font-bold px-10 py-3 rounded-xl shadow-md hover:bg-[#1a7c67] transition animate-fade-in delay-200">
              View Pricing
            </button>
          </Link>
        </div>
      </section>

      {/* Animations (kept as inline style for simplicity as they are specific to this page) */}
      <style>
        {`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(40px);}
          100% { opacity: 1; transform: none;}
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        .animate-fade-in.delay-75 { animation-delay: .075s; }
        .animate-fade-in.delay-100 { animation-delay: .1s; }
        .animate-fade-in.delay-150 { animation-delay: .15s; }
        .animate-fade-in.delay-200 { animation-delay: .2s; }
        .animate-fade-in.delay-250 { animation-delay: .25s; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4;}
          50% { opacity: 1;}
        }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        `}
      </style>
    </div>
  );
};

export default WelcomePage;
