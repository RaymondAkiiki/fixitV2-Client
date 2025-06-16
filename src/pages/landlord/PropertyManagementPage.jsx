// frontend/src/pages/landlord/PropertyManagementPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination'; // Assuming this exists

// Service imports
import { getAllProperties, createProperty, deleteProperty } from '../../services/propertyService';

// Icons
import { PlusCircle, Edit, Trash2, Eye, Search } from 'lucide-react';

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Keeping alert for now
};

/**
 * PropertyManagementPage allows Property Managers/Landlords to list, add, edit, and delete properties.
 */
function PropertyManagementPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [propertyForm, setPropertyForm] = useState({ name: "", address: { street: "", city: "", state: "", country: "" }, details: "" });
  const [addPropertyError, setAddPropertyError] = useState("");
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []); // Initial fetch

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      // getAllProperties already filters by user's association on the backend
      const params = searchQuery ? { search: searchQuery } : {};
      const data = await getAllProperties(params);
      setProperties(data);
    } catch (err) {
      setError('Failed to fetch properties: ' + (err.response?.data?.message || err.message));
      console.error("Fetch properties error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) { // Handle nested address fields
      const [parent, child] = name.split('.');
      setPropertyForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setPropertyForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    setAddPropertyError("");
    try {
      await createProperty(propertyForm);
      showMessage("Property added successfully!", 'success');
      setShowAddPropertyModal(false);
      setPropertyForm({ name: "", address: { street: "", city: "", state: "", country: "" }, details: "" }); // Reset form
      fetchProperties(); // Re-fetch list
    } catch (err) {
      setAddPropertyError("Failed to add property: " + (err.response?.data?.message || err.message));
      console.error("Add property error:", err);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property? This will also remove all associated units, requests, and tenant associations. This action cannot be undone.")) {
      try {
        await deleteProperty(propertyId);
        showMessage("Property deleted successfully!", 'success');
        fetchProperties(); // Re-fetch list
      } catch (err) {
        showMessage("Failed to delete property: " + (err.response?.data?.message || err.message), 'error');
        console.error("Delete property error:", err);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties(); // Trigger re-fetch with new search query
  };


  return (
   
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">Property Management</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>}

      {/* Controls and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <Button
          onClick={() => setShowAddPropertyModal(true)}
          className="bg-#219377 hover:bg-[#ffbd59] text-white py-2 px-5 rounded-lg shadow-md flex items-center space-x-2"
        >
          <PlusCircle className="w-5 h-5" /> <span>Add New Property</span>
        </Button>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search properties by name/address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <Button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg">
            <Search className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* Properties Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">No properties found. Add your first property!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((prop) => (
                  <tr key={prop._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prop.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {prop.address?.street ? `${prop.address.street}, ` : ''}
                      {prop.address?.city}, {prop.address?.state}, {prop.address?.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{prop.units?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link to={`/landlord/properties/${prop._id}`} className="text-blue-600 hover:text-blue-900" title="View Details">
                          <Eye className="w-5 h-5" />
                        </Link>
                        <Link to={`/landlord/properties/edit/${prop._id}`} className="text-indigo-600 hover:text-indigo-900" title="Edit Property">
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProperty(prop._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Property"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination component (adjust props as per your actual component) */}
        <Pagination totalItems={properties.length} itemsPerPage={10} currentPage={1} onPageChange={() => {}} />
      </div>

      {/* Add New Property Modal (same as in dashboard but for standalone use) */}
      <Modal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        title="Add New Property"
      >
        <form onSubmit={handleAddPropertySubmit} className="p-4 space-y-4">
          {addPropertyError && <p className="text-red-500 text-sm mb-3">{addPropertyError}</p>}
          <div>
            <label htmlFor="modalPropertyName" className="block text-sm font-medium text-gray-700">Property Name</label>
            <input
              type="text"
              id="modalPropertyName"
              name="name"
              value={propertyForm.name}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyStreet" className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              type="text"
              id="modalPropertyStreet"
              name="address.street"
              value={propertyForm.address.street}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="modalPropertyCity" className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              id="modalPropertyCity"
              name="address.city"
              value={propertyForm.address.city}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyState" className="block text-sm font-medium text-gray-700">State / Province</label>
            <input
              type="text"
              id="modalPropertyState"
              name="address.state"
              value={propertyForm.address.state}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="modalPropertyCountry" className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              id="modalPropertyCountry"
              name="address.country"
              value={propertyForm.address.country}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyDetails" className="block text-sm font-medium text-gray-700">Details (Max 1000 chars)</label>
            <textarea
              id="modalPropertyDetails"
              name="details"
              value={propertyForm.details}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"
              maxLength={1000}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddPropertyModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-#219377 hover:bg-[#ffbd59] text-white py-2 px-4 rounded-lg">Add Property</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PropertyManagementPage;