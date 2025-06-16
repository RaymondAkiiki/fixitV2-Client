// frontend/src/pages/landlord/PropertyDetailsPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

// Service imports
import { getPropertyById, updateProperty } from '../../services/propertyService';
import { createUnit, updateUnit, deleteUnit } from '../../services/unitService'; // For unit management
import { getUserById } from '../../services/userService'; // To get tenant details

// Icons
import { Edit, Trash2, PlusCircle, Home, Maximize, Bed, Bath, User, Users, Square, ChevronRight } from 'lucide-react';
// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Keeping alert for now
};

/**
 * PropertyDetailsPage displays detailed information about a single property,
 * allows editing property details, and manages its associated units and tenants.
 */
function PropertyDetailsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingProperty, setIsEditingProperty] = useState(false);
  const [propertyFormData, setPropertyFormData] = useState({ name: "", address: { street: "", city: "", state: "", country: "" }, details: "" });

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [unitForm, setUnitForm] = useState({ unitName: "", floor: "", details: "", numBedrooms: 0, numBathrooms: 0, squareFootage: 0, rentAmount: 0, status: "vacant" });
  const [addUnitError, setAddUnitError] = useState("");

  const [showEditUnitModal, setShowEditUnitModal] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editUnitForm, setEditUnitForm] = useState({ unitName: "", floor: "", details: "", numBedrooms: 0, numBathrooms: 0, squareFootage: 0, rentAmount: 0, status: "" });
  const [editUnitError, setEditUnitError] = useState("");


  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPropertyById(propertyId);
      setProperty(data);
      setPropertyFormData({
        name: data.name || "",
        address: data.address || { street: "", city: "", state: "", country: "" },
        details: data.details || ""
      });
    } catch (err) {
      setError('Failed to fetch property details: ' + (err.response?.data?.message || err.message));
      console.error("Fetch property details error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Property Editing Handlers ---
  const handlePropertyFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPropertyFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setPropertyFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await updateProperty(propertyId, propertyFormData);
      showMessage("Property updated successfully!", 'success');
      setIsEditingProperty(false);
      fetchPropertyDetails(); // Re-fetch to update UI
    } catch (err) {
      setError("Failed to update property: " + (err.response?.data?.message || err.message));
      console.error("Update property error:", err);
    }
  };

  // --- Unit Management Handlers ---
  const handleUnitFormChange = (e) => {
    const { name, value, type } = e.target;
    setUnitForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleAddUnitSubmit = async (e) => {
    e.preventDefault();
    setAddUnitError("");
    try {
      await createUnit(propertyId, unitForm); // Use propertyId from URL
      showMessage("Unit added successfully!", 'success');
      setShowAddUnitModal(false);
      setUnitForm({ unitName: "", floor: "", details: "", numBedrooms: 0, numBathrooms: 0, squareFootage: 0, rentAmount: 0, status: "vacant" }); // Reset form
      fetchPropertyDetails(); // Re-fetch property to update units list
    } catch (err) {
      setAddUnitError("Failed to add unit: " + (err.response?.data?.message || err.message));
      console.error("Add unit error:", err);
    }
  };

  const handleEditUnitFormChange = (e) => {
    const { name, value, type } = e.target;
    setEditUnitForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleOpenEditUnitModal = (unit) => {
    setEditingUnitId(unit._id);
    setEditUnitForm({
      unitName: unit.unitName || "",
      floor: unit.floor || "",
      details: unit.details || "",
      numBedrooms: unit.numBedrooms || 0,
      numBathrooms: unit.numBathrooms || 0,
      squareFootage: unit.squareFootage || 0,
      rentAmount: unit.rentAmount || 0,
      status: unit.status || "vacant"
    });
    setShowEditUnitModal(true);
  };

  const handleEditUnitSubmit = async (e) => {
    e.preventDefault();
    setEditUnitError("");
    try {
      await updateUnit(propertyId, editingUnitId, editUnitForm);
      showMessage("Unit updated successfully!", 'success');
      setShowEditUnitModal(false);
      setEditingUnitId(null);
      fetchPropertyDetails(); // Re-fetch property to update units list
    } catch (err) {
      setEditUnitError("Failed to update unit: " + (err.response?.data?.message || err.message));
      console.error("Update unit error:", err);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (window.confirm("Are you sure you want to delete this unit? This will also remove any tenant associations and related requests. This action cannot be undone.")) {
      try {
        await deleteUnit(propertyId, unitId);
        showMessage("Unit deleted successfully!", 'success');
        fetchPropertyDetails(); // Re-fetch property to update units list
      } catch (err) {
        showMessage("Failed to delete unit: " + (err.response?.data?.message || err.message), 'error');
        console.error("Delete unit error:", err);
      }
    }
  };

  if (loading) {
    return (
    
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <p className="text-xl text-gray-600">Loading property details...</p>
      </div>
      
    );
  }

  if (error) {
    return (
      
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    
    );
  }

  if (!property) {
    return (
      
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <p className="text-xl text-gray-600">Property not found.</p>
      </div>
    
    );
  }

  return (
  
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Property: {property.name}
        </h1>
        <Button
          onClick={() => setIsEditingProperty(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-md flex items-center space-x-2"
        >
          <Edit className="w-5 h-5" /> <span>Edit Property</span>
        </Button>
      </div>

      {/* Property Details Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Details</h2>
        {isEditingProperty ? (
          <form onSubmit={handlePropertySubmit} className="space-y-4">
            <div>
              <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700">Property Name</label>
              <input type="text" id="propertyName" name="name" value={propertyFormData.name} onChange={handlePropertyFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="propertyStreet" className="block text-sm font-medium text-gray-700">Street</label>
              <input type="text" id="propertyStreet" name="address.street" value={propertyFormData.address.street} onChange={handlePropertyFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="propertyCity" className="block text-sm font-medium text-gray-700">City</label>
              <input type="text" id="propertyCity" name="address.city" value={propertyFormData.address.city} onChange={handlePropertyFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="propertyState" className="block text-sm font-medium text-gray-700">State</label>
              <input type="text" id="propertyState" name="address.state" value={propertyFormData.address.state} onChange={handlePropertyFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="propertyCountry" className="block text-sm font-medium text-gray-700">Country</label>
              <input type="text" id="propertyCountry" name="address.country" value={propertyFormData.address.country} onChange={handlePropertyFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="propertyDetails" className="block text-sm font-medium text-gray-700">Details</label>
              <textarea id="propertyDetails" name="details" value={propertyFormData.details} onChange={handlePropertyFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"></textarea>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" onClick={() => setIsEditingProperty(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg">Save Changes</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-gray-700 text-lg">
            <p><strong>Name:</strong> {property.name}</p>
            <p><strong>Address:</strong> {property.address?.street}, {property.address?.city}, {property.address?.state}, {property.address?.country}</p>
            <p><strong>Details:</strong> {property.details || 'N/A'}</p>
            <p><strong>Date Created:</strong> {new Date(property.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Units Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Units ({property.units?.length || 0})</h2>
          <Button
            onClick={() => setShowAddUnitModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-md flex items-center space-x-2"
          >
            <PlusCircle className="w-5 h-5" /> <span>Add New Unit</span>
          </Button>
        </div>

        {property.units?.length === 0 ? (
          <p className="text-gray-600 italic text-center py-6">No units found for this property.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {property.units.map(unit => (
              <div key={unit._id} className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    <Home className="w-6 h-6 text-indigo-500" />
                    <span>{unit.unitName}</span>
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                      unit.status === 'vacant' ? 'bg-green-100 text-green-800' :
                      unit.status === 'occupied' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {unit.status.replace(/_/g, ' ')}
                    </span>
                  </h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Floor: {unit.floor || 'N/A'} | Bedrooms: {unit.numBedrooms || '0'} | Bathrooms: {unit.numBathrooms || '0'}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">{unit.details || 'No additional details.'}</p>
                  <p className="text-gray-800 font-medium">Rent: ${unit.rentAmount?.toLocaleString() || 'N/A'}</p>
                  <p className="text-gray-600 text-sm flex items-center space-x-1 mt-2">
                      <Square className="w-4 h-4" /> <span>{unit.squareFootage ? `${unit.squareFootage} sq ft` : 'N/A'}</span>
                  </p>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Link to={`/landlord/properties/${propertyId}/tenants/${unit._id}`} className="text-sm text-blue-600 hover:underline flex items-center space-x-1" title="Manage Tenants for this Unit">
                      <Users className="w-4 h-4" /> <span>Tenants</span>
                  </Link>
                  <Button
                    onClick={() => handleOpenEditUnitModal(unit)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                  >
                    <Edit className="w-4 h-4" /> <span>Edit</span>
                  </Button>
                  <Button
                    onClick={() => handleDeleteUnit(unit._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" /> <span>Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tenants in this Property Section (Summary) */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Tenants in {property.name}</h2>
          <Link to={`/landlord/tenants?propertyId=${propertyId}`} className="text-blue-600 hover:underline font-medium flex items-center space-x-1">
            <span>Manage All Tenants</span> <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {property.tenants?.length === 0 ? (
          <p className="text-gray-600 italic text-center py-6">No tenants currently associated with this property.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {property.tenants.map(tenant => (
              <li key={tenant._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="font-semibold text-gray-900">{tenant.name || tenant.email}</div>
                <div className="text-sm text-gray-700">{tenant.email}</div>
                {tenant.assignedUnit?.unitName && (
                    <div className="text-xs text-gray-600 mt-1">Assigned Unit: {tenant.assignedUnit.unitName}</div>
                )}
                <Link to={`/landlord/properties/${propertyId}/tenants/${tenant._id}`} className="text-indigo-600 hover:underline text-sm mt-2 block">
                  View/Manage Tenant
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>


      {/* Modals */}
      {/* Add New Unit Modal */}
      <Modal
        isOpen={showAddUnitModal}
        onClose={() => setShowAddUnitModal(false)}
        title={`Add New Unit to ${property.name}`}
      >
        <form onSubmit={handleAddUnitSubmit} className="p-4 space-y-4">
          {addUnitError && <p className="text-red-500 text-sm mb-3">{addUnitError}</p>}
          <div>
            <label htmlFor="unitName" className="block text-sm font-medium text-gray-700">Unit Name/Number</label>
            <input type="text" id="unitName" name="unitName" value={unitForm.unitName} onChange={handleUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="floor" className="block text-sm font-medium text-gray-700">Floor (Optional)</label>
            <input type="text" id="floor" name="floor" value={unitForm.floor} onChange={handleUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-700">Details (Optional, Max 1000 chars)</label>
            <textarea id="details" name="details" value={unitForm.details} onChange={handleUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24" maxLength={1000}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numBedrooms" className="block text-sm font-medium text-gray-700">Bedrooms</label>
              <input type="number" id="numBedrooms" name="numBedrooms" value={unitForm.numBedrooms} onChange={handleUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
            <div>
              <label htmlFor="numBathrooms" className="block text-sm font-medium text-gray-700">Bathrooms</label>
              <input type="number" id="numBathrooms" name="numBathrooms" value={unitForm.numBathrooms} onChange={handleUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
            <div>
              <label htmlFor="squareFootage" className="block text-sm font-medium text-gray-700">Square Footage</label>
              <input type="number" id="squareFootage" name="squareFootage" value={unitForm.squareFootage} onChange={handleUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
            <div>
              <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700">Rent Amount ($)</label>
              <input type="number" id="rentAmount" name="rentAmount" value={unitForm.rentAmount} onChange={handleUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
          </div>
          <div>
            <label htmlFor="unitStatus" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="unitStatus" name="status" value={unitForm.status} onChange={handleUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddUnitModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg">Add Unit</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        isOpen={showEditUnitModal}
        onClose={() => setShowEditUnitModal(false)}
        title={`Edit Unit: ${editUnitForm.unitName}`}
      >
        <form onSubmit={handleEditUnitSubmit} className="p-4 space-y-4">
          {editUnitError && <p className="text-red-500 text-sm mb-3">{editUnitError}</p>}
          <div>
            <label htmlFor="editUnitName" className="block text-sm font-medium text-gray-700">Unit Name/Number</label>
            <input type="text" id="editUnitName" name="unitName" value={editUnitForm.unitName} onChange={handleEditUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="editFloor" className="block text-sm font-medium text-gray-700">Floor</label>
            <input type="text" id="editFloor" name="floor" value={editUnitForm.floor} onChange={handleEditUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="editDetails" className="block text-sm font-medium text-gray-700">Details (Max 1000 chars)</label>
            <textarea id="editDetails" name="details" value={editUnitForm.details} onChange={handleEditUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24" maxLength={1000}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="editNumBedrooms" className="block text-sm font-medium text-gray-700">Bedrooms</label>
              <input type="number" id="editNumBedrooms" name="numBedrooms" value={editUnitForm.numBedrooms} onChange={handleEditUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
            <div>
              <label htmlFor="editNumBathrooms" className="block text-sm font-medium text-gray-700">Bathrooms</label>
              <input type="number" id="editNumBathrooms" name="numBathrooms" value={editUnitForm.numBathrooms} onChange={handleEditUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
            <div>
              <label htmlFor="editSquareFootage" className="block text-sm font-medium text-gray-700">Square Footage</label>
              <input type="number" id="editSquareFootage" name="squareFootage" value={editUnitForm.squareFootage} onChange={handleEditUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
            <div>
              <label htmlFor="editRentAmount" className="block text-sm font-medium text-gray-700">Rent Amount ($)</label>
              <input type="number" id="editRentAmount" name="rentAmount" value={editUnitForm.rentAmount} onChange={handleEditUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
          </div>
          <div>
            <label htmlFor="editUnitStatus" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="editUnitStatus" name="status" value={editUnitForm.status} onChange={handleEditUnitFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowEditUnitModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
    
  );
}

export default PropertyDetailsPage;
