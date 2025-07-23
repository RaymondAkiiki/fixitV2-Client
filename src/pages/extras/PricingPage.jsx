import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Plus, Minus } from 'lucide-react';

const ROUTES = {
  REGISTER: '/register',
  CONTACT_SALES: '/contact-sales',
};

// --- Reusable Components ---

// Pricing Card Component
const PricingCard = ({ plan, isAnnual, isPopular }) => {
  const price = isAnnual ? plan.price.annual : plan.price.monthly;
  return (
    <div className={`relative border rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-2 ${isPopular ? 'bg-[#219377] text-white shadow-2xl border-transparent' : 'bg-white shadow-lg border-gray-200'}`}>
      {isPopular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <span className="bg-[#ffbd59] text-white text-xs font-bold px-4 py-1 rounded-full uppercase">Most Popular</span>
        </div>
      )}
      <h3 className={`text-2xl font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
      <p className={`mt-2 text-sm ${isPopular ? 'text-white/80' : 'text-gray-600'}`}>{plan.description}</p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className={`text-4xl font-extrabold tracking-tight ${isPopular ? 'text-white' : 'text-gray-900'}`}>{price}</span>
        <span className={`text-sm font-medium ${isPopular ? 'text-white/70' : 'text-gray-500'}`}>{plan.price.unit}</span>
      </div>
      <p className={`mt-1 text-xs ${isPopular ? 'text-white/70' : 'text-gray-500'}`}>{plan.price.billing}</p>
      <Link to={plan.cta.href} className={`w-full inline-block text-center mt-8 px-6 py-3 font-bold rounded-lg transition-colors ${isPopular ? 'bg-white text-[#219377] hover:bg-gray-100' : 'bg-[#219377] text-white hover:bg-[#1a7c67]'}`}>
        {plan.cta.text}
      </Link>
      <ul className="mt-8 space-y-4 text-sm">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <Check className={`w-5 h-5 flex-shrink-0 ${isPopular ? 'text-[#ffbd59]' : 'text-[#219377]'}`} />
            <span className={isPopular ? 'text-white/90' : 'text-gray-700'}>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// FAQ Item Component
const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-6">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
        <span className="text-lg font-medium text-gray-900">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-[#219377]" /> : <Plus className="w-5 h-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="mt-4 text-gray-600 animate-fade-in-up">
          {answer}
        </div>
      )}
    </div>
  );
};

// --- Pricing Page ---

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      price: { monthly: "$0", annual: "$0", unit: "", billing: "Forever free" },
      description: "For individuals or small landlords just getting started.",
      features: [
        "1 Property",
        "5 Maintenance Tickets/mo",
        "Basic Tenant Onboarding",
        "Community Support",
      ],
      cta: { text: "Get Started", href: ROUTES.REGISTER },
    },
    {
      name: "Professional",
      price: { monthly: "$29", annual: "$24", unit: "/mo", billing: isAnnual ? "Billed annually" : "Billed monthly" },
      description: "For growing landlords and property managers.",
      features: [
        "Up to 10 Properties",
        "Unlimited Maintenance Tickets",
        "Full Tenant & Lease Management",
        "Standard Reporting & Analytics",
        "Email & Chat Support",
      ],
      cta: { text: "Start Free Trial", href: ROUTES.REGISTER },
      isPopular: true,
    },
    {
      name: "Enterprise",
      price: { monthly: "Custom", annual: "Custom", unit: "", billing: "Contact us for a quote" },
      description: "For large agencies, developers, and portfolios.",
      features: [
        "Unlimited Properties & Users",
        "Advanced Security & Auditing",
        "Custom Integrations (API Access)",
        "Priority Onboarding & Training",
        "Dedicated Support Manager",
      ],
      cta: { text: "Contact Sales", href: ROUTES.CONTACT_SALES },
    },
  ];

  const faqs = [
    { question: "Can I change my plan later?", answer: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time from your account settings. Changes will be prorated." },
    { question: "Is there a free trial for the Professional plan?", answer: "Yes, we offer a 14-day free trial on our Professional plan. No credit card is required to get started." },
    { question: "What counts as a 'property'?", answer: "A property is typically a single building or complex at one address. The number of units (e.g., apartments) within a property is unlimited." },
    { question: "What kind of support is included?", answer: "All plans include access to our extensive knowledge base. The Professional plan adds email and live chat support, while the Enterprise plan includes a dedicated account manager." },
  ];

  return (
    <div className="bg-white">
      {/* SECTION 1: HERO & PRICING TOGGLE */}
      <div className="bg-gray-50/70 text-center px-4 py-20 lg:py-28">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight animate-fade-in-up">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-700 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Choose the plan that fits your needs today. Scale up as your portfolio grows. No hidden fees, ever.
        </p>
        <div className="mt-10 flex justify-center items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <span className={`font-medium ${!isAnnual ? 'text-[#219377]' : 'text-gray-500'}`}>Monthly</span>
          <button onClick={() => setIsAnnual(!isAnnual)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? 'bg-[#219377]' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`font-medium ${isAnnual ? 'text-[#219377]' : 'text-gray-500'}`}>
            Annual <span className="text-xs text-[#ffbd59] font-bold">(Save 15%)</span>
          </span>
        </div>
      </div>

      {/* SECTION 2: PRICING CARDS */}
      <div className="container mx-auto px-6 py-20 lg:py-24">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <div key={plan.name} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <PricingCard plan={plan} isAnnual={isAnnual} isPopular={plan.isPopular || false} />
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: FAQ */}
      <div className="bg-gray-50/70 py-20 lg:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>

      {/* CSS ANIMATIONS */}
      <style>
        {`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        `}
      </style>
    </div>
  );
};

export default PricingPage;