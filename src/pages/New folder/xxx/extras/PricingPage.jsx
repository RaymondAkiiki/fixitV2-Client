// Shared Imports
import { Link } from "react-router-dom";
import { CheckCircle, HelpCircle, DollarSign, Settings } from "lucide-react";
// Pricing Page
export const PricingPage = () => {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      description: "Ideal for personal use or learning.",
      features: [
        "Up to 1 Property",
        "Basic Maintenance Logging",
        "Limited Document Generation",
        "Community Support",
      ],
    },
    {
      name: "Professional",
      price: "$19/mo",
      description: "For growing landlords and managers.",
      features: [
        "Up to 10 Properties",
        "Full Maintenance Tools",
        "All Document Templates",
        "Email Support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored for agencies and developers.",
      features: [
        "Unlimited Properties",
        "Custom Integrations",
        "Priority Onboarding",
        "Dedicated Support Manager",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white py-16 px-4 text-gray-900">
      <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <p className="text-3xl font-bold text-[#219377] mb-4">{plan.price}</p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  <CheckCircle className="text-[#219377] w-4 h-4 mr-2" />
                  {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-2 bg-[#219377] text-white rounded-xl hover:bg-[#1c7e67]">
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
