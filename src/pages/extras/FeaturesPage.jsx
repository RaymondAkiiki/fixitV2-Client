// Shared Imports
import { Link } from "react-router-dom";
import { CheckCircle, HelpCircle, DollarSign, Settings } from "lucide-react";

// Features Page
const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-white py-16 px-4 text-gray-900">
      <h1 className="text-4xl font-bold text-center mb-12">What Makes Us Different</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            title: "Smart Maintenance Automation",
            description:
              "Auto-ticketing, task assignments, and media-rich issue tracking that saves you hours each week.",
          },
          {
            title: "AI Document Generator",
            description:
              "Create leases, handovers, and notices in minutes with chat-guided AI document builders.",
          },
          {
            title: "Full Lease & Rent Management",
            description:
              "Track rent, lease expiry, onboarding, and store tenant history all in one place.",
          },
          {
            title: "Real-Time Updates",
            description:
              "Every task, comment, and update is instantly visible to all involved – stay informed, always.",
          },
          {
            title: "Mobile-First Experience",
            description:
              "Optimized for phones and tablets. Perfect for property managers on the move.",
          },
          {
            title: "Integrations That Work",
            description:
              "Connect with CRMs, tenant portals, and accounting tools to sync operations end-to-end.",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition"
          >
            <CheckCircle className="text-[#219377] w-6 h-6 mb-3" />
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-700 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default FeaturesPage;
