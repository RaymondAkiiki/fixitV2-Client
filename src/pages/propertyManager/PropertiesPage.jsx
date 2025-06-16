// frontend/src/pages/pm/PropertiesPage.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal"; // Assuming a generic Modal component
import { Building, PlusCircle, Search } from "lucide-react"; // Icons

// Import updated service functions
import { getAllProperties, deleteProperty } from "../../services/propertyService";

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * PropertiesPage component for Property Managers to view and manage their properties.
 */
function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // For property search
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend's getAllProperties already filters by the logged-in user's associations
      const data = await getAllProperties();
      setProperties(data);
    } catch (err) {
      setError("Failed to load properties. " + (err.response?.data?.message || err.message));
      console.error("Fetch properties error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property? This will also remove all associated units, requests, and tenant/vendor associations linked directly to it. This action cannot be undone.")) {
      try {
        await deleteProperty(propertyId);
        showMessage("Property deleted successfully!", 'success');
        fetchProperties(); // Refresh the list
      } catch (err) {
        showMessage("Failed to delete property: " + (err.response?.data?.message || err.message), 'error');
        console.error("Delete property error:", err);
      }
    }
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <Building className="w-8 h-8 mr-3 text-green-700" />
          Managed Properties
        </h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button
            onClick={() => navigate('/pm/properties/add')}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Add New Property
          </Button>
          <div className="relative flex-grow max-w-sm">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600 italic">
            <p className="text-lg mb-4">No properties found matching your search or criteria.</p>
            <p>Click "Add New Property" to get started!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenants</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((property) => (
                  <tr key={property._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/pm/properties/${property._id}`} className="text-green-600 hover:underline">
                        {property.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {property.address?.street && `${property.address.street}, `}
                      {property.address?.city}, {property.address?.state && `${property.address.state}, `}
                      {property.address?.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {property.units?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {/* You might want to display a count of active tenants */}
                      {property.tenants?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/pm/properties/${property._id}`} className="text-blue-600 hover:text-blue-800 mr-3">View</Link>
                      <Link to={`/pm/properties/edit/${property._id}`} className="text-yellow-600 hover:text-yellow-800 mr-3">Edit</Link>
                      <button
                        onClick={() => handleDeleteProperty(property._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination would go here if you implement server-side pagination */}
      </div>
    </PropertyManagerLayout>
  );
}

export default PropertiesPage;
