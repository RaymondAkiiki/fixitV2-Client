// frontend/src/pages/auth/WelcomePage.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  ChartPieIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  ArrowRightIcon,
  SparklesIcon,
  BoltIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

// Using provided constants
const ROUTES = {
  REGISTER: "/register",
  LOGIN: "/login",
  COMING_SOON: "/coming-soon",
  PRICING: "/pricing",
};
const APP_NAME = "Threalty Fixit";

// Reusable, styled components for consistency and clean code
const ActionButton = ({ to, children, variant = "primary", className = "" }) => {
  const baseStyles = "inline-block text-center px-8 py-3 text-lg font-bold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4";
  const variants = {
    primary: "bg-[#ffbd59] text-white hover:bg-[#e0a84e] focus:ring-[#ffbd59]/50", // Secondary color as primary CTA
    secondary: "bg-transparent text-[#219377] border-2 border-[#219377] hover:bg-[#219377] hover:text-white focus:ring-[#219377]/30",
  };
  return (
    <Link to={to} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
};

// --- WELCOME PAGE CONTENT ---

const WelcomePage = () => {
  const [activeTab, setActiveTab] = useState("maintenance");

  const featureTabs = {
    maintenance: [
      { icon: ShieldCheckIcon, title: "Automated Issue Tracking", desc: "Log, assign, and monitor repairs with a transparent, real-time ticket system that keeps everyone informed." },
      { icon: UserGroupIcon, title: "Unified Vendor Portals", desc: "Empower vendors with dedicated dashboards to receive jobs, update progress, and communicate instantly." },
      { icon: ChartPieIcon, title: "Smart Maintenance Analytics", desc: "Visualize trends, costs, and response times. Make data-driven decisions to optimize your operations." },
    ],
    tenant: [
      { icon: DocumentTextIcon, title: "Digital Lease Management", desc: "Go paperless with digital lease agreements. Automate renewal reminders and track key dates effortlessly." },
      { icon: CurrencyDollarIcon, title: "Streamlined Rent Collection", desc: "Monitor payment statuses, send automated reminders, and allow tenants to upload proof of payment with ease." },
      { icon: UserPlusIcon, title: "Effortless Tenant Onboarding", desc: "Automate the welcome process by sharing SOPs, guides, and essential documents with new tenants." },
    ],
  };

  return (
    // The component now assumes it's within a larger layout, as requested.
    <div className="bg-white">
      {/* 
        SECTION 1: HERO
        This is the hero section you approved.
      */}
      <section className="relative text-center px-4 py-24 md:py-32 overflow-hidden bg-gradient-to-b from-white to-[#e4faf3]/50">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[-5%] top-1/4 w-48 h-48 bg-[#219377]/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute right-[-5%] bottom-1/4 w-48 h-48 bg-[#ffbd59]/10 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#219377] mb-4 tracking-tight">
            The Future of Property <span className="text-[#ffbd59]">Maintenance</span> is Here.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-10">
            Ditch the spreadsheets and chaotic texts. A smart, centralized platform for landlords, managers, and tenants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ActionButton to={ROUTES.REGISTER} variant="primary">
              Get Started Free
            </ActionButton>
            <ActionButton to={ROUTES.LOGIN} variant="secondary">
              Login
            </ActionButton>
          </div>
          <p className="mt-8 text-sm text-gray-500 font-medium">
            No credit card needed – try it risk-free!
          </p>
        </div>
      </section>

      {/* 
        SECTION 2: FEATURES (WITH TABS)
        This is the tabbed features section you liked.
      */}
      <section className="py-20 lg:py-28 bg-gray-50/70">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              A Feature for Every Challenge
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              One platform to manage your entire property lifecycle.
            </p>
          </div>

          <div className="flex justify-center mb-10 border-b border-gray-200">
            <button onClick={() => setActiveTab('maintenance')} className={`px-6 py-3 font-semibold text-lg transition-colors duration-300 ${activeTab === 'maintenance' ? 'text-[#219377] border-b-2 border-[#219377]' : 'text-gray-500'}`}>
              Maintenance
            </button>
            <button onClick={() => setActiveTab('tenant')} className={`px-6 py-3 font-semibold text-lg transition-colors duration-300 ${activeTab === 'tenant' ? 'text-[#219377] border-b-2 border-[#219377]' : 'text-gray-500'}`}>
              Tenant & Leases
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureTabs[activeTab].map((feature, i) => (
              <div key={feature.title} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`}}>
                <div className={`inline-block p-3 rounded-lg bg-gray-100 mb-4`}>
                    <feature.icon className="w-8 h-8 text={activeTab === 'maintenance' ? '#219377' : '#ffbd59'}" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* 
        SECTION 3: BUILT FOR EVERY ROLE
        This is the "Built for Every Role" section you wanted to bring back.
      */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                Built for <span className="text-[#219377]">Every Role</span> in Real Estate
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-[#219377]/10 p-3 rounded-lg"><BuildingOffice2Icon className="w-7 h-7 text-[#219377]" /></div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">Property Managers</h4>
                    <p className="text-gray-600 mt-1">Handle dozens of properties effortlessly from a single, powerful dashboard.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-[#219377]/10 p-3 rounded-lg"><HomeModernIcon className="w-7 h-7 text-[#219377]" /></div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">Landlords</h4>
                    <p className="text-gray-600 mt-1">Stay informed with auto-updates and performance logs, without the micromanagement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-[#219377]/10 p-3 rounded-lg"><UserGroupIcon className="w-7 h-7 text-[#219377]" /></div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">Tenants</h4>
                    <p className="text-gray-600 mt-1">Request repairs in seconds and get real-time progress without chasing anyone.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1470&auto=format&fit=crop" alt="Modern apartment" className="rounded-2xl shadow-xl object-cover w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 
        SECTION 4: CALLOUT & MORE FROM THREALTY
        This is the "Why Choose Us" section, modified to remove the two feature cards as requested.
      */}
      <section className="py-20 lg:py-28 bg-[#219377]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Why <span className="text-[#ffbd59]">Choose Us?</span>
            </h2>
            <p className="mt-4 text-lg text-white/80">
              We build tools that save you time, reduce stress, and create happier tenants. It's that simple.
            </p>
          </div>

          <div className="text-center">
             <h3 className="text-2xl font-bold text-white mb-8">Explore our growing suite of AI-powered tools</h3>
             <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Link to={ROUTES.COMING_SOON} className="group bg-white p-6 rounded-xl text-left transition hover:bg-gray-100">
                    <h4 className="font-bold text-xl text-gray-800">Real Estate Genie</h4>
                    <p className="text-gray-600 mt-1">Draft real estate documents faster with AI-powered templates.</p>
                    <span className="flex items-center gap-2 mt-4 font-semibold text-[#219377] group-hover:gap-3 transition-all">
                        Learn More <ArrowRightIcon className="w-4 h-4" />
                    </span>
                </Link>
                <Link to={ROUTES.COMING_SOON} className="group bg-white p-6 rounded-xl text-left transition hover:bg-gray-100">
                    <h4 className="font-bold text-xl text-gray-800">Real Estate AI Chatbot</h4>
                    <p className="text-gray-600 mt-1">Get instant answers and property matches 24/7 with our smart assistant.</p>
                    <span className="flex items-center gap-2 mt-4 font-semibold text-[#219377] group-hover:gap-3 transition-all">
                        Learn More <ArrowRightIcon className="w-4 h-4" />
                    </span>
                </Link>
             </div>
          </div>
        </div>
      </section>

      {/* 
        SECTION 5: HOW IT WORKS
        This is the 3-step "How It Works" section.
      */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Get Started in 3 Simple Steps
            </h2>
          </div>
          <div className="relative grid md:grid-cols-3 gap-8 md:gap-16">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gray-200 -translate-y-1/2"></div>
            <div className="relative text-center p-4 animate-fade-in-up" style={{ animationDelay: '0.1s'}}>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white border-2 border-gray-200 rounded-full text-2xl font-bold text-[#219377]">1</div>
              <h3 className="text-xl font-bold mb-2">Submit Request</h3>
              <p className="text-gray-600">Tenants or managers create a ticket with details and photos in seconds.</p>
            </div>
            <div className="relative text-center p-4 animate-fade-in-up" style={{ animationDelay: '0.2s'}}>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white border-2 border-gray-200 rounded-full text-2xl font-bold text-[#219377]">2</div>
              <h3 className="text-xl font-bold mb-2">Assign & Track</h3>
              <p className="text-gray-600">Assign to a vendor and track progress with real-time status updates for everyone.</p>
            </div>
            <div className="relative text-center p-4 animate-fade-in-up" style={{ animationDelay: '0.3s'}}>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white border-2 border-gray-200 rounded-full text-2xl font-bold text-[#219377]">3</div>
              <h3 className="text-xl font-bold mb-2">Resolve & Verify</h3>
              <p className="text-gray-600">Get notified upon completion, verify the work, and close the ticket. All logged.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 
        SECTION 6: FINAL CTA
        This is the final call-to-action section.
      */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-6">
            <div className="relative text-center bg-gradient-to-r from-[#219377] to-[#1a7c67] text-white p-12 md:p-16 rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#ffbd59]/20 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                        Ready to Transform Your Properties?
                    </h2>
                    <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                        Join hundreds of landlords and managers who trust Threalty Fixit to bring efficiency and peace of mind to their work.
                    </p>
                    <ActionButton to={ROUTES.PRICING} variant="primary" className="text-lg">
                        View Plans & Pricing
                    </ActionButton>
                </div>
            </div>
        </div>
      </section>

      {/* 
        CSS ANIMATIONS
        Consolidated styles for all animations.
      */}
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        `}
      </style>
    </div>
  );
};

export default WelcomePage;