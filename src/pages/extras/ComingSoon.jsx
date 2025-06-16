import React from "react";

// Animated SVG icons for each project
const icons = [
  // Genie
  (
    <svg className="w-10 h-10 text-teal-500 animate-bounce" fill="none" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="#E6F8F3"/>
      <path d="M24 12a8 8 0 018 8c0 4-2.5 7.5-8 12C18.5 27.5 16 24 16 20a8 8 0 018-8z" fill="#219377"/>
      <circle cx="24" cy="20" r="3" fill="#fff"/>
    </svg>
  ),
  // Manager
  (
    <svg className="w-10 h-10 text-blue-400 animate-spin-slow" fill="none" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="#E3EDFB"/>
      <rect x="16" y="16" width="16" height="16" rx="4" fill="#3B82F6"/>
      <rect x="20" y="20" width="8" height="8" rx="2" fill="#fff"/>
    </svg>
  ),
  // Chatbot
  (
    <svg className="w-10 h-10 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="#EDEBFA"/>
      <ellipse cx="24" cy="24" rx="10" ry="7" fill="#6366F1"/>
      <ellipse cx="20" cy="24" rx="1.5" ry="2" fill="#fff"/>
      <ellipse cx="28" cy="24" rx="1.5" ry="2" fill="#fff"/>
    </svg>
  )
];

const projects = [
  {
    name: "Real Estate Genie by Threalty",
    description:
      "An AI-powered document generator for leases, notices, and personalized communication, helping you draft legally sound real estate documents faster.",
    features: [
      "Generate contracts, notices, reminders with guided prompts",
      "Template Library tailored for real estate",
      "Chat-based AI form assistance",
      "Multi-format export (PDF, DOCX, PNG)",
      "Version Control and History",
      "Planned: E-signature and secure sharing",
      "CRM and portal integration ready"
    ],
    color: "from-teal-200 via-white to-teal-50"
  },
  {
    name: "Lease and Tenant Manager by Threalty",
    description:
      "A platform to manage leases and rent tracking, helping you stay on top of payments, expiries, and communication with tenants and landlords.",
    features: [
      "Automated Lease Expiry Reminders",
      "Rent Tracking and Overdue Alerts",
      "Digital Tenant Onboarding and Welcome Packs",
      "Role-Based Access (Tenant, Landlord, Manager)",
      "Payment History & Cashflow Analytics",
      "Secure Cloud Document Storage",
      "Accounting and portal integrations"
    ],
    color: "from-blue-100 via-white to-blue-50"
  },
  {
    name: "Real Estate AI Chatbot by Threalty",
    description:
      "An intelligent assistant to help clients find property, ask questions, and negotiate deals – 24/7 support with real-time property data.",
    features: [
      "Tailored Property Matching based on preferences",
      "Streamlined Property Search via chat",
      "Assisted Negotiation with smart prompts",
      "24/7 Real-Time Answers & Market Insights",
      "Faster Deal Closures through smart automation"
    ],
    color: "from-indigo-100 via-white to-indigo-50"
  },
];

// Custom slow spin animation for one icon
const style = `
@keyframes spin-slow { to { transform: rotate(360deg); } }
.animate-spin-slow { animation: spin-slow 6s linear infinite; }
`;

// Custom fade-in and pop keyframes
const extraStyles = `
@keyframes fade-in { to { opacity: 1; transform: none; } }
.animate-fade-in { opacity: 0; transform: translateY(16px); animation: fade-in 0.7s ease forwards; }
@keyframes pop { 0% { transform: scale(1); } 60% { transform: scale(1.4); } 100% { transform: scale(1); } }
.animate-pop { animation: pop 0.5s cubic-bezier(.8,2,.5,1.8) both; }
`;

const AnimatedFeature = ({ text, delay }) => (
  <li
    className={`flex items-center gap-2 opacity-0 animate-fade-in`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
  >
    <span className="text-green-600 animate-pop">✅</span>
    <span>{text}</span>
  </li>
);

const ComingSoon = () => {
  // For "Return Home" navigation, use your router or a simple redirect
  const handleHome = () => {
    window.location.href = "/"; // Change this if you use react-router-dom by using `useNavigate`
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-gray-50 to-[#e9fdf7] px-4 py-12 flex flex-col items-center">
      <style>{style + extraStyles}</style>
      <div className="absolute top-0 left-0 w-full h-60 bg-gradient-to-br from-[#219377]/20 to-transparent pointer-events-none blur-2xl -z-10" />
      <div className="max-w-4xl w-full">
        <h1
          className="text-5xl font-extrabold text-center text-[#219377] drop-shadow mb-6 tracking-tight animate-fade-in"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          🚀 Coming&nbsp;
          <span className="text-yellow-400 drop-shadow font-extrabold">Soon</span>
        </h1>
        <p
          className="text-center text-xl text-gray-700 mb-10 animate-fade-in"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
        >
          We’re building <span className="font-semibold text-[#219377]">smart tools</span> to make real estate easier, faster, and more professional.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
          <div className="flex flex-col gap-2 items-center">
            <span className="inline-flex h-3 w-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-700 font-semibold">Live Demos Coming</span>
          </div>
          <div className="flex gap-3 text-lg items-center text-yellow-400 font-bold">
            <span>✨</span>
            <span>Stay tuned for beta invites</span>
            <span>✨</span>
          </div>
        </div>

        <h2
          className="text-2xl font-bold text-gray-800 mb-8 text-center animate-fade-in"
          style={{ animationDelay: "600ms", animationFillMode: "forwards" }}
        >
          Here’s What to Expect
        </h2>

        {/* Column block layout: left-to-right, then wrap to next row */}
        <div className="flex flex-wrap justify-between gap-y-8 gap-x-6">
          {projects.map((project, idx) => (
            <div
              key={idx}
              className={`group relative flex-1 min-w-[320px] max-w-[380px] bg-gradient-to-br ${project.color} p-6 rounded-3xl shadow-xl border border-gray-100 hover:scale-105 transition-transform duration-300 hover:shadow-2xl hover:border-[#219377]/30`}
              style={{
                // For consistent height across blocks
                minHeight: 390,
                marginRight: (idx % 3 !== 2) ? '16px' : 0
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="drop-shadow">{icons[idx]}</div>
                <h3 className="text-lg font-bold text-[#219377]">{project.name}</h3>
              </div>
              <p className="text-gray-700 mb-4 min-h-[60px]">{project.description}</p>
              <ul className="list-none space-y-2 pl-0 mt-2">
                {project.features.map((feature, index) => (
                  <AnimatedFeature text={feature} key={index} delay={200 + index * 120} />
                ))}
              </ul>
              <div className="absolute right-5 top-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="bg-[#219377]/90 text-white text-xs px-3 py-1 rounded-full shadow font-semibold">
                  {idx === 0
                    ? "AI Inside"
                    : idx === 1
                    ? "Manager Tools"
                    : "Conversational AI"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-16 text-center animate-fade-in"
          style={{ animationDelay: "1200ms", animationFillMode: "forwards" }}
        >
          <button
            onClick={handleHome}
            className="inline-block bg-[#219377]/90 text-white px-6 py-3 rounded-full shadow-md font-bold text-lg hover:bg-[#facc15] hover:text-[#219377] hover:scale-105 transition-all cursor-pointer"
          >
            ← Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;