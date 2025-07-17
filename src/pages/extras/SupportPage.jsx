// Shared Imports
import { Link } from "react-router-dom";
import { CheckCircle, HelpCircle, DollarSign, Settings } from "lucide-react";

// Support Page
const SupportPage = () => {
  return (
    <div className="min-h-screen bg-white py-16 px-4 text-gray-900 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-6">Need Help?</h1>
      <p className="text-center text-gray-700 mb-8">
        Our team is here to make sure you get the most out of our tools. Check our resources or reach out directly.
      </p>
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions</h2>
          <p className="text-sm text-gray-600">
            Browse common questions around setup, usage, and billing. Still stuck? Email us!
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Live Support</h2>
          <p className="text-sm text-gray-600">
            Use our live chat from the dashboard (9AM - 6PM EAT) or email
            <a href="mailto:support@threalty.app" className="text-[#219377] ml-1">
              support@threalty.app
            </a>
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Video Tutorials</h2>
          <p className="text-sm text-gray-600">
            Step-by-step videos showing how to use Fixit, Genie, and LTM. Access inside the Help Center.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;