import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Wrench,
  Users,
  FileText,
  DollarSign,
  MessageSquare,
  Shield,
  Smartphone,
  BarChart2,
} from 'lucide-react';

const ROUTES = {
  REGISTER: '/register',
};

// Reusable component for feature points
const FeaturePoint = ({ icon, children }) => (
  <li className="flex items-start gap-3">
    <CheckCircle className="w-5 h-5 text-[#219377] mt-1 flex-shrink-0" />
    <span className="text-gray-600">{children}</span>
  </li>
);

// Reusable component for the main feature sections
const FeatureSection = ({ title, description, features, imageUrl, imageAlt, reverse = false }) => (
  <div className="container mx-auto px-6 py-12 lg:py-20">
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      <div className={`animate-fade-in-up ${reverse ? 'lg:order-2' : ''}`}>
        <img src={imageUrl} alt={imageAlt} className="rounded-2xl shadow-2xl object-cover w-full h-full" />
      </div>
      <div className={`animate-fade-in-up ${reverse ? 'lg:order-1' : ''}`} style={{ animationDelay: '0.2s' }}>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{title}</h2>
        <p className="mt-4 text-lg text-gray-600">{description}</p>
        <ul className="mt-8 space-y-4">
          {features.map((feature, i) => (
            <FeaturePoint key={i}>{feature}</FeaturePoint>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const FeaturesPage = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* SECTION 1: HERO */}
      <div className="bg-gray-50/70 text-center px-4 py-20 lg:py-28">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#219377] tracking-tight animate-fade-in-up">
          The All-in-One Platform for <span className="text-[#ffbd59]">Effortless Property Management</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-700 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          We've meticulously designed every feature to save you time, reduce stress, and create a seamless experience for everyone involved.
        </p>
      </div>

      {/* SECTION 2: CORE FEATURE - MAINTENANCE */}
      <FeatureSection
        title="Smart Maintenance & Operations"
        description="Transform reactive chaos into proactive control. Our maintenance module streamlines the entire repair lifecycle, from the first report to the final invoice."
        features={[
          "Tenants submit media-rich requests via a dedicated portal.",
          "Automated ticket creation with timestamps and priority tags.",
          "Assign vendors, track their progress, and get real-time status updates.",
          "Schedule recurring tasks like generator servicing or landscaping.",
        ]}
        imageUrl="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1470&auto=format&fit=crop"
        imageAlt="Team collaborating on a maintenance task"
      />

      {/* SECTION 3: CORE FEATURE - TENANT & LEASE MANAGEMENT */}
      <FeatureSection
        title="Complete Tenant & Lease Management"
        description="Go beyond maintenance. Manage the entire tenant journey from onboarding to renewal, all in one place."
        features={[
          "Digital lease creation, signing, and storage.",
          "Automated reminders for lease expiries and rent due dates.",
          "Tenants can upload proof of payment and view their rent history.",
          "Share SOPs and onboarding documents with new tenants automatically.",
        ]}
        imageUrl="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1470&auto=format&fit=crop"
        imageAlt="Person signing a digital document on a tablet"
        reverse={true}
      />

      {/* SECTION 4: BUILT FOR EVERYONE */}
      <div className="bg-gray-50/70 py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              A Tailored Experience for <span className="text-[#219377]">Every Role</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our platform empowers every stakeholder with the specific tools they need to succeed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Wrench, title: "For Landlords & PMs", desc: "Get a 360-degree view of your portfolio. Track performance, manage tasks, and make data-driven decisions from a unified dashboard." },
              { icon: Users, title: "For Tenants", desc: "Enjoy a seamless living experience. Submit requests, track progress, access documents, and communicate easily through a dedicated portal." },
              { icon: MessageSquare, title: "For Vendors", desc: "Receive job assignments, update your status, and communicate on-the-go via a simple, public portal—no login required." },
            ].map((role, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="inline-block p-3 rounded-lg bg-gray-100 mb-4">
                  <role.icon className="w-8 h-8 text-[#219377]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{role.title}</h3>
                <p className="text-gray-600">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* SECTION 5: PLATFORM-WIDE FEATURES */}
       <div className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Platform-Wide Features</h2>
                <p className="mt-4 text-lg text-gray-600">Powerful tools and technologies that underpin the entire experience.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
                {[
                    { icon: Shield, title: "Bank-Grade Security", desc: "Protecting your data with end-to-end encryption and robust access controls." },
                    { icon: Smartphone, title: "Mobile-First Design", desc: "Access all features on any device, perfect for managing properties on the move." },
                    { icon: BarChart2, title: "Advanced Analytics", desc: "Gain deep insights into your operations with our powerful reporting engine." },
                ].map((feature, i) => (
                    <div key={i} className="p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`}}>
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                            <feature.icon className="w-8 h-8 text-[#219377]" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* SECTION 6: FINAL CTA */}
      <div className="bg-white pb-20">
        <div className="container mx-auto px-6">
            <div className="relative text-center bg-gradient-to-r from-[#219377] to-[#1a7c67] text-white p-12 md:p-16 rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#ffbd59]/20 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Modernize Your Management?</h2>
                    <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                        See for yourself how Threalty Fixit can bring efficiency and peace of mind to your work.
                    </p>
                    <Link to={ROUTES.REGISTER} className="inline-block text-center px-10 py-4 text-lg font-bold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 bg-[#ffbd59] text-white hover:bg-[#e0a84e] focus:ring-[#ffbd59]/50">
                        Start Your Free Trial
                    </Link>
                </div>
            </div>
        </div>
      </div>

      {/* CSS ANIMATIONS */}
      <style>
        {`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        `}
      </style>
    </div>
  );
};

export default FeaturesPage;