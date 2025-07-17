import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import { Package, Phone, Mail, MapPin, Info, Edit, User, Wrench } from "lucide-react";
import { getVendorById } from "../../services/vendorService";
import { getAllRequests } from "../../services/requestService";

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Helper for displaying messages to user
const showMessage = (msg, type = "info") => {
  alert(msg);
};

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

        const requestsData = await getAllRequests({
          assignedToId: vendorId,
          assignedToModel: "Vendor",
        });
        setAssignedRequests(Array.isArray(requestsData.requests) ? requestsData.requests : requestsData);
      } catch (err) {
        setError("Failed to load vendor details. " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchVendorData();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
          Loading vendor details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Vendor not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-7 border-b pb-3"
        style={{ borderColor: PRIMARY_COLOR }}>
        <h1 className="text-3xl font-extrabold flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Package className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
          {vendor.name}
        </h1>
        <Link to={`/landlord/vendors/edit/${vendor._id}`}>
          <Button
            className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold"
            style={{
              backgroundColor: "#2563eb",
              color: "#fff",
            }}
          >
            <Edit className="w-5 h-5 mr-2" /> Edit Vendor
          </Button>
        </Link>
      </div>

      {/* Vendor Overview */}
      <div className="bg-white p-8 rounded-xl shadow-lg border mb-8"
        style={{ borderColor: PRIMARY_COLOR + "14" }}>
        <h2 className="text-2xl font-semibold mb-5 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <Info className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} />
          Vendor Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10 text-gray-700 text-lg">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-gray-500 mr-2" />
            <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>Company Name:</span>&nbsp;{vendor.name}
          </div>
          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-500 mr-2" />
            <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>Contact Person:</span>&nbsp;{vendor.contactPerson || "N/A"}
          </div>
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-gray-500 mr-2" />
            <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>Email:</span>&nbsp;
            <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">{vendor.email}</a>
          </div>
          <div className="flex items-center">
            <Phone className="w-5 h-5 text-gray-500 mr-2" />
            <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>Phone:</span>&nbsp;
            <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline">{vendor.phone}</a>
          </div>
          <div className="flex items-center md:col-span-2">
            <MapPin className="w-5 h-5 text-gray-500 mr-2" />
            <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>Address:</span>&nbsp;{vendor.address || "N/A"}
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center mb-1">
              <Info className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>Description:</span>
            </div>
            <p className="mt-2 text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">{vendor.description || "No description provided."}</p>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center mb-1">
              <Wrench className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>Services Provided:</span>
            </div>
            {(vendor.services && vendor.services.length > 0) ? (
              <ul className="list-disc list-inside ml-2 text-gray-800">
                {vendor.services.map((service, index) => (
                  <li key={index} className="capitalize">{service}</li>
                ))}
              </ul>
            ) : (
              <p className="italic text-gray-600 ml-2">No services listed.</p>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Service Requests Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg border mb-8"
        style={{ borderColor: PRIMARY_COLOR + "14" }}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold flex items-center" style={{ color: PRIMARY_COLOR }}>
            <Wrench className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} />
            Assigned Service Requests ({assignedRequests.length})
          </h2>
          <Link to={`/landlord/requests?assignedToId=${vendor._id}&assignedToModel=Vendor`}>
            <Button
              className="px-4 py-2 rounded-lg shadow-md font-semibold"
              style={{ backgroundColor: PRIMARY_COLOR, color: "#fff" }}
            >
              View All Assigned Requests
            </Button>
          </Link>
        </div>
        {assignedRequests.length === 0 ? (
          <p className="text-gray-600 italic text-center py-6">
            No service requests currently assigned to this vendor.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: PRIMARY_COLOR + "10" }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Title</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Property / Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedRequests.slice(0, 5).map((req) => (
                  <tr key={req._id} className="hover:bg-[#f0fdfa] transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/landlord/requests/${req._id}`} className="text-blue-600 hover:underline">
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {req.property?.name || "N/A"} {req.unit?.unitName ? `(${req.unit.unitName})` : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{req.status.replace(/_/g, " ")}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{req.priority}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/landlord/requests/${req._id}`} className="text-blue-600 hover:text-blue-800">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorDetailsPage;