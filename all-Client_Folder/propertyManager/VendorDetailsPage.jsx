// frontend/src/pages/pm/VendorDetailsPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import { Package, Phone, Mail, MapPin, Info, Edit } from "lucide-react";

// Import updated service functions
import { getVendorById } from "../../services/vendorService";
import { getAllRequests } from "../../services/requestService"; // To get requests assigned to this vendor

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * VendorDetailsPage displays comprehensive details about a specific vendor,
 * including their contact info, services, and associated service requests.
 */
function VendorDetailsPage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const vendorData = await getVendorById(vendorId);
        setVendor(vendorData);

        // Fetch requests assigned to this vendor
        // Assuming getAllRequests supports filtering by assignedToId and assignedToModel
        const requestsData = await getAllRequests({
            assignedToId: vendorId,
            assignedToModel: 'Vendor'
        });
        setAssignedRequests(requestsData);

      } catch (err) {
        setError("Failed to load vendor details. " + (err.response?.data?.message || err.message));
        console.error("Fetch vendor details error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorData();
  }, [vendorId]);


  if (loading) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Loading vendor details...</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  if (error) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  if (!vendor) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Vendor not found.</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3 text-green-700" />
            {vendor.name}
          </h1>
          <Link to={`/pm/vendors/edit/${vendor._id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center">
              <Edit className="w-5 h-5 mr-2" /> Edit Vendor
            </Button>
          </Link>
        </div>

        {/* Vendor Overview */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5">Vendor Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-700 text-lg">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-gray-500 mr-2" />
              <strong>Company Name:</strong> {vendor.name}
            </div>
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-500 mr-2" />
              <strong>Contact Person:</strong> {vendor.contactPerson || 'N/A'}
            </div>
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-500 mr-2" />
              <strong>Email:</strong> <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">{vendor.email}</a>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-500 mr-2" />
              <strong>Phone:</strong> <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline">{vendor.phone}</a>
            </div>
            <div className="flex items-center md:col-span-2">
              <MapPin className="w-5 h-5 text-gray-500 mr-2" />
              <strong>Address:</strong> {vendor.address || 'N/A'}
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center mb-1">
                <Info className="w-5 h-5 text-gray-500 mr-2" />
                <strong>Description:</strong>
              </div>
              <p className="mt-2 text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">{vendor.description || 'No description provided.'}</p>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center mb-1">
                <Wrench className="w-5 h-5 text-gray-500 mr-2" />
                <strong>Services Provided:</strong>
              </div>
              <ul className="list-disc list-inside ml-2 text-gray-800">
                {(vendor.services && vendor.services.length > 0) ? (
                  vendor.services.map((service, index) => (
                    <li key={index} className="capitalize">{service}</li>
                  ))
                ) : (
                  <p className="italic text-gray-600">No services listed.</p>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Assigned Service Requests Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Wrench className="w-6 h-6 mr-2 text-green-700" /> Assigned Service Requests ({assignedRequests.length})
            </h2>
            <Link to={`/pm/requests?assignedToId=${vendor._id}&assignedToModel=Vendor`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md">
                View All Assigned Requests
              </Button>
            </Link>
          </div>
          {assignedRequests.length === 0 ? (
            <p className="text-gray-600 italic text-center py-6">No service requests currently assigned to this vendor.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignedRequests.slice(0, 5).map(req => ( // Show top 5
                    <tr key={req._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={`/pm/requests/${req._id}`} className="text-blue-600 hover:underline">
                          {req.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {req.property?.name || 'N/A'} {req.unit?.unitName ? `(${req.unit.unitName})` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{req.status.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{req.priority}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/pm/requests/${req._id}`} className="text-blue-600 hover:text-blue-800">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PropertyManagerLayout>
  );
}

export default VendorDetailsPage;
