// frontend/src/pages/pm/VendorsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import DashboardFilters from "../../components/common/DashboardFilters"; // Assuming this exists
import { Package, PlusCircle, Search } from "lucide-react";

// Import updated service functions
import { getAllVendors, deleteVendor } from "../../services/vendorService";

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * VendorsPage component for Property Managers to view and manage their vendors.
 * Includes filtering and quick actions.
 */
function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    service: "", // Filter by service provided
  });

  const navigate = useNavigate();

  // Fetch vendors based on filters
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: filters.search,
        services: filters.service === "all" ? undefined : filters.service, // Assuming backend can filter by services array
      };
      // Backend's getAllVendors should filter by PM's property associations
      const data = await getAllVendors(params);
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load vendors. " + (err.response?.data?.message || err.message));
      console.error("Fetch vendors error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Memoize based on filters

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]); // Call memoized function

  const handleDeleteVendor = async (vendorId) => {
    if (window.confirm("Are you sure you want to delete this vendor? This action cannot be undone and will remove all their associations.")) {
      try {
        await deleteVendor(vendorId);
        showMessage("Vendor deleted successfully!", 'success');
        fetchVendors(); // Refresh the list
      } catch (err) {
        showMessage("Failed to delete vendor: " + (err.response?.data?.message || err.message), 'error');
        console.error("Delete vendor error:", err);
      }
    }
  };

  const uniqueServices = Array.from(new Set(vendors.flatMap(vendor => vendor.services || [])))
    .filter(Boolean) // Remove any null/undefined/empty string services
    .sort();

  if (loading && vendors.length === 0) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-xl text-gray-600">Loading vendors...</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <Package className="w-8 h-8 mr-3 text-green-700" />
          Vendors
        </h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button
            onClick={() => navigate('/pm/vendors/add')}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Add New Vendor
          </Button>
        </div>

        {/* Filters */}
        <DashboardFilters
          filters={filters}
          setFilters={setFilters}
          showSearch={true}
          showServiceFilter={true} // New filter for services
          serviceOptions={uniqueServices.map(service => ({ value: service, label: service.charAt(0).toUpperCase() + service.slice(1) }))}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600 italic">
            <p className="text-lg mb-4">No vendors found matching your criteria.</p>
            <p>Click "Add New Vendor" to get started!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/pm/vendors/${vendor._id}`} className="text-green-600 hover:underline">
                        {vendor.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendor.contactPerson || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendor.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {(vendor.services && vendor.services.length > 0) ?
                        vendor.services.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/pm/vendors/${vendor._id}`} className="text-blue-600 hover:text-blue-800 mr-3">View</Link>
                      <Link to={`/pm/vendors/edit/${vendor._id}`} className="text-yellow-600 hover:text-yellow-800 mr-3">Edit</Link>
                      <button
                        onClick={() => handleDeleteVendor(vendor._id)}
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
      </div>
    </PropertyManagerLayout>
  );
}

export default VendorsPage;
