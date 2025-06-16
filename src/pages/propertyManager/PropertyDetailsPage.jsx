// frontend/src/pages/pm/PropertyDetailsPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import {
  Building, Home, Users, Wrench, FileArchive, PlusCircle, PenSquare
} from "lucide-react";

// Import updated service functions
import { getPropertyById } from "../../services/propertyService";
import { listUnits } from "../../services/unitService"; // For units related to this property
import { getAllRequests } from "../../services/requestService"; // For requests related to this property
import { getAllScheduledMaintenance } from "../../services/scheduledMaintenanceService"; // For scheduled maintenance related to this property

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

/**
 * PropertyDetailsPage displays comprehensive details about a specific property,
 * including its units, associated tenants, service requests, and scheduled maintenance.
 */
function PropertyDetailsPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [requests, setRequests] = useState([]);
  const [scheduledMaintenance, setScheduledMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPropertyData = async () => {
      setLoading(true);
      setError(null);
      try {
        const propertyData = await getPropertyById(propertyId);
        setProperty(propertyData);

        const [unitsData, requestsData, maintenanceData] = await Promise.all([
          listUnits(propertyId), // Fetch units for this property
          getAllRequests({ propertyId: propertyId }), // Fetch requests for this property
          getAllScheduledMaintenance({ propertyId: propertyId }) // Fetch maintenance for this property
        ]);

        setUnits(unitsData);
        setRequests(requestsData);
        setScheduledMaintenance(maintenanceData.tasks || []); // Access 'tasks' property

      } catch (err) {
        setError("Failed to load property details. " + (err.response?.data?.message || err.message));
        console.error("Fetch property details error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyData();
  }, [propertyId]);


  if (loading) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Loading property details...</p>
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

  if (!property) {
    return (
      <PropertyManagerLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-xl text-gray-600">Property not found.</p>
        </div>
      </PropertyManagerLayout>
    );
  }

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <Building className="w-8 h-8 mr-3 text-green-700" />
            {property.name}
          </h1>
          <Link to={`/pm/properties/edit/${property._id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center">
              <PenSquare className="w-5 h-5 mr-2" /> Edit Property
            </Button>
          </Link>
        </div>

        {/* Property Overview */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5">Property Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-lg">
            <div>
              <p><strong>Address:</strong></p>
              <p>{property.address?.street || ''}</p>
              <p>{property.address?.city}, {property.address?.state}</p>
              <p>{property.address?.country}</p>
            </div>
            <div>
              <p><strong>Details:</strong> {property.details || 'N/A'}</p>
              <p><strong>Managed By:</strong> {property.propertyManager?.name || property.propertyManager?.email || 'N/A'}</p>
              <p><strong>Owner:</strong> {property.owner?.name || property.owner?.email || 'N/A'}</p>
              <p><strong>Units:</strong> {units.length}</p>
              <p><strong>Active Requests:</strong> {requests.filter(req => req.status !== 'completed' && req.status !== 'archived').length}</p>
            </div>
          </div>
        </div>

        {/* Units Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Home className="w-6 h-6 mr-2 text-green-700" /> Units ({units.length})
            </h2>
            <Link to={`/pm/properties/${property._id}/units/add`}>
              <Button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-md flex items-center">
                <PlusCircle className="w-5 h-5 mr-2" /> Add Unit
              </Button>
            </Link>
          </div>
          {units.length === 0 ? (
            <p className="text-gray-600 italic text-center py-6">No units found for this property.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenants</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {units.map(unit => (
                    <tr key={unit._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={`/pm/properties/${property._id}/units/${unit._id}`} className="text-blue-600 hover:underline">
                          {unit.unitName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{unit.floor || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{unit.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {(unit.tenants && unit.tenants.length > 0) ? unit.tenants.map(t => t.name || t.email).join(', ') : 'Vacant'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/pm/properties/${property._id}/units/${unit._id}`} className="text-blue-600 hover:text-blue-800 mr-3">View</Link>
                        <Link to={`/pm/properties/${property._id}/units/edit/${unit._id}`} className="text-yellow-600 hover:text-yellow-800">Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Service Requests Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Wrench className="w-6 h-6 mr-2 text-green-700" /> Service Requests ({requests.length})
            </h2>
            <Link to={`/pm/requests/add?propertyId=${property._id}`}>
                <Button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-md flex items-center">
                    <PlusCircle className="w-5 h-5 mr-2" /> Add Request
                </Button>
            </Link>
          </div>
          {requests.length === 0 ? (
            <p className="text-gray-600 italic text-center py-6">No service requests for this property.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.slice(0, 5).map(req => ( // Show top 5
                    <tr key={req._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={`/pm/requests/${req._id}`} className="text-blue-600 hover:underline">
                          {req.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{req.unit?.unitName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{req.status.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{req.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/pm/requests/${req._id}`} className="text-blue-600 hover:text-blue-800">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link to={`/pm/requests?propertyId=${property._id}`} className="text-blue-600 hover:underline font-medium">View All Requests for {property.name} &rarr;</Link>
          </div>
        </div>

        {/* Scheduled Maintenance Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <FileArchive className="w-6 h-6 mr-2 text-green-700" /> Scheduled Maintenance ({scheduledMaintenance.length})
            </h2>
            <Link to={`/pm/scheduled-maintenance/add?propertyId=${property._id}`}>
                <Button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-md flex items-center">
                    <PlusCircle className="w-5 h-5 mr-2" /> Schedule Task
                </Button>
            </Link>
          </div>
          {scheduledMaintenance.length === 0 ? (
            <p className="text-gray-600 italic text-center py-6">No scheduled maintenance tasks for this property.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduledMaintenance.slice(0, 5).map(task => ( // Show top 5
                    <tr key={task._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={`/pm/scheduled-maintenance/${task._id}`} className="text-blue-600 hover:underline">
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.unit?.unitName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(task.scheduledDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{task.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/pm/scheduled-maintenance/${task._id}`} className="text-blue-600 hover:text-blue-800">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link to={`/pm/scheduled-maintenance?propertyId=${property._id}`} className="text-blue-600 hover:underline font-medium">View All Maintenance for {property.name} &rarr;</Link>
          </div>
        </div>

        {/* Associated Tenants Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Users className="w-6 h-6 mr-2 text-green-700" /> Associated Tenants ({property.tenants?.length || 0})
            </h2>
            <Link to={`/pm/users?role=tenant&propertyId=${property._id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md">
                    Manage Tenants
                </Button>
            </Link>
          </div>
          {property.tenants?.length === 0 ? (
            <p className="text-gray-600 italic text-center py-6">No tenants currently associated with this property.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Unit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {property.tenants.map(tenant => (
                    <tr key={tenant._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={`/pm/properties/${property._id}/tenants/${tenant._id}`} className="text-blue-600 hover:underline">
                          {tenant.name || tenant.email}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tenant.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {/* Find the specific tenancy within this property to get the unit name */}
                          {tenant.associations?.tenancies?.find(t => t.property?._id === property._id)?.unit?.unitName || 'N/A'}
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

export default PropertyDetailsPage;
