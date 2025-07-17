import { Link } from "react-router-dom";

const AccessDeniedPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-5xl font-bold text-red-600 mb-4">403</h1>
      <p className="text-lg text-gray-600 mb-6">Access Denied</p>
      <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Go Home
      </Link>
    </div>
  );
};

export default AccessDeniedPage;
