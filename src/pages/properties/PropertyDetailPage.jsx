import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { ROUTES, USER_ROLES } from '../../utils/constants';

// Service imports
import { getPropertyById, updateProperty } from '../../services/propertyService';
import { createUnit, updateUnit, deleteUnit } from '../../services/unitService';

// Icons
import { 
  Edit, Trash2, PlusCircle, Home, Square, Users, 
  ChevronRight, ArrowLeft
} from 'lucide-react';

const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

function PropertyDetailPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isPropertyManager, isLandlord } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingProperty, setIsEditingProperty] = useState(false);
  const [propertyFormData, setPropertyFormData] = useState({
    name: "",
    address: { street: "", city: "", state: "", country: "" },
    details: ""
  });

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unitName: "", floor: "", details: "", numBedrooms: 0, numBathrooms: 0,
    squareFootage: 0, rentAmount: 0, status: "vacant"
  });
  const [addUnitError, setAddUnitError] = useState("");

  const [showEditUnitModal, setShowEditUnitModal] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editUnitForm, setEditUnitForm] = useState({
    unitName: "", floor: "", details: "", numBedrooms: 0, numBathrooms: 0,
    squareFootage: 0, rentAmount: 0, status: ""
  });
  const [editUnitError, setEditUnitError] = useState("");

  // Determine the base path for navigation based on user role
  const getBasePath = useCallback(() => {
    if (isAdmin) return ROUTES.ADMIN_BASE;
    if (isPropertyManager) return ROUTES.PM_BASE;
    if (isLandlord) return ROUTES.LANDLORD_BASE;
    return ''; // Fallback
  }, [isAdmin, isPropertyManager, isLandlord]);

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
      const errMsg = 'Failed to fetch property details: ' + (err.response?.data?.message || err.message);
      setError(errMsg);
      showError(errMsg);
      console.error("Fetch property details error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Property editing
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
      showSuccess("Property updated successfully!");
      setIsEditingProperty(false);
      fetchPropertyDetails();
    } catch (err) {
      const errMsg = "Failed to update property: " + (err.response?.data?.message || err.message);
      setError(errMsg);
      showError(errMsg);
      console.error("Update property error:", err);
    }
  };

  // --- Unit Management ---
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
      await createUnit(propertyId, unitForm);
      showSuccess("Unit added successfully!");
      setShowAddUnitModal(false);
      setUnitForm({ unitName: "", floor: "", details: "", numBedrooms: 0, numBathrooms: 0, squareFootage: 0, rentAmount: 0, status: "vacant" });
      fetchPropertyDetails();
    } catch (err) {
      const errMsg = "Failed to add unit: " + (err.response?.data?.message || err.message);
      setAddUnitError(errMsg);
      showError(errMsg);
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
      showSuccess("Unit updated successfully!");
      setShowEditUnitModal(false);
      setEditingUnitId(null);
      fetchPropertyDetails();
    } catch (err) {
      const errMsg = "Failed to update unit: " + (err.response?.data?.message || err.message);
      setEditUnitError(errMsg);
      showError(errMsg);
      console.error("Update unit error:", err);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (window.confirm("Are you sure you want to delete this unit? This will also remove any tenant associations and related requests. This action cannot be undone.")) {
      try {
        await deleteUnit(propertyId, unitId);
        showSuccess("Unit deleted successfully!");
        fetchPropertyDetails();
      } catch (err) {
        const errMsg = "Failed to delete unit: " + (err.response?.data?.message || err.message);
        showError(errMsg);
        console.error("Delete unit error:", err);
      }
    }
  };

  // Navigate to manage tenants for a unit
  const goToManageTenants = (unitId) => {
    navigate(`${getBasePath()}/properties/${propertyId}/tenants/${unitId}`);
  };

  // Navigate back to properties list
  const goBackToProperties = () => {
    navigate(`${getBasePath()}/properties`);
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
    <div
      className="p-4 md:p-8 min-h-full"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* Header with back button */}
      <div className="flex items-center mb-2">
        <button 
          onClick={goBackToProperties}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back to Properties
        </button>
      </div>
      
      {/* Main Header */}
      <div className="flex justify-between items-center mb-7 border-b pb-3" style={{ borderColor: PRIMARY_COLOR }}>
        <h1 className="text-3xl font-extrabold" style={{ color: PRIMARY_COLOR }}>
          Property: <span className="font-bold">{property.name}</span>
        </h1>
        <Button
          onClick={() => setIsEditingProperty(true)}
          className="flex items-center space-x-2 py-2 px-4 rounded-lg shadow-md"
          style={{
            backgroundColor: PRIMARY_COLOR,
            color: '#fff',
            fontWeight: 600
          }}
        >
          <Edit className="w-5 h-5" /> <span>Edit Property</span>
        </Button>
      </div>

      {/* Property Details Section */}
      <div
        className="p-8 rounded-xl shadow-lg mb-10"
        style={{ background: '#fff', border: `1.5px solid ${PRIMARY_COLOR}30` }}
      >
        <h2 className="text-2xl font-semibold mb-6" style={{ color: PRIMARY_COLOR }}>Details</h2>
        {isEditingProperty ? (
          <form onSubmit={handlePropertySubmit} className="space-y-4">
            <div>
              <label htmlFor="propertyName" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Property Name</label>
              <input type="text" id="propertyName" name="name" value={propertyFormData.name} onChange={handlePropertyFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} required />
            </div>
            <div>
              <label htmlFor="propertyStreet" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Street</label>
              <input type="text" id="propertyStreet" name="address.street" value={propertyFormData.address.street} onChange={handlePropertyFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} />
            </div>
            <div>
              <label htmlFor="propertyCity" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>City</label>
              <input type="text" id="propertyCity" name="address.city" value={propertyFormData.address.city} onChange={handlePropertyFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} required />
            </div>
            <div>
              <label htmlFor="propertyState" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>State</label>
              <input type="text" id="propertyState" name="address.state" value={propertyFormData.address.state} onChange={handlePropertyFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} />
            </div>
            <div>
              <label htmlFor="propertyCountry" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Country</label>
              <input type="text" id="propertyCountry" name="address.country" value={propertyFormData.address.country} onChange={handlePropertyFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2" style={{ borderColor: PRIMARY_COLOR }} required />
            </div>
            <div>
              <label htmlFor="propertyDetails" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Details</label>
              <textarea id="propertyDetails" name="details" value={propertyFormData.details} onChange={handlePropertyFormChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 h-24" style={{ borderColor: PRIMARY_COLOR }} />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" onClick={() => setIsEditingProperty(false)}
                className="py-2 px-4 rounded-lg"
                style={{
                  backgroundColor: '#e4e4e7', color: PRIMARY_COLOR, fontWeight: 600
                }}>
                Cancel
              </Button>
              <Button type="submit"
                className="py-2 px-4 rounded-lg"
                style={{
                  backgroundColor: PRIMARY_COLOR, color: '#fff', fontWeight: 600
                }}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-lg" style={{ color: PRIMARY_COLOR }}>
            <p><strong>Name:</strong> <span style={{ color: "#222" }}>{property.name}</span></p>
            <p><strong>Address:</strong> <span style={{ color: "#222" }}>{property.address?.street}, {property.address?.city}, {property.address?.state}, {property.address?.country}</span></p>
            <p><strong>Details:</strong> <span style={{ color: "#222" }}>{property.details || 'N/A'}</span></p>
            <p><strong>Date Created:</strong> <span style={{ color: "#222" }}>{new Date(property.createdAt).toLocaleDateString()}</span></p>
          </div>
        )}
      </div>

     {/* Units Section */}
      <div
        className="p-8 rounded-xl shadow-lg mb-10"
        style={{ background: '#fff', border: `1.5px solid ${SECONDARY_COLOR}60` }}
      >
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h2 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>
            Units <span className="ml-2 rounded-lg px-2 py-0.5 text-base" style={{
              backgroundColor: SECONDARY_COLOR, color: '#fff', fontWeight: 600
            }}>({property.units?.length || 0})</span>
          </h2>
          <Button
            onClick={() => setShowAddUnitModal(true)}
            className="flex items-center space-x-2 py-2 px-4 rounded-lg shadow-md"
            style={{
              backgroundColor: SECONDARY_COLOR,
              color: '#222',
              fontWeight: 600
            }}
          >
            <PlusCircle className="w-5 h-5" /> <span className="hidden sm:inline">Add New Unit</span>
          </Button>
        </div>
        {property.units?.length === 0 ? (
          <p className="text-gray-600 italic text-center py-6">No units found for this property.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {property.units.map(unit => (
              <div
                key={unit._id}
                className="flex flex-col justify-between p-7 rounded-xl shadow-sm border transition-all"
                style={{
                  background: "#f6fcfa",
                  borderColor: PRIMARY_COLOR + "60",
                  minHeight: "270px"
                }}
              >
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2"
                    style={{ color: PRIMARY_COLOR }}>
                    <Home className="w-6 h-6" style={{ color: SECONDARY_COLOR }} />
                    <span className="truncate max-w-[120px] md:max-w-[220px]">{unit.unitName}</span>
                    <span className="ml-auto px-2 py-1 rounded-full text-xs font-semibold capitalize"
                      style={{
                        backgroundColor:
                          unit.status === 'vacant' ? "#d1fae5" :
                            unit.status === 'occupied' ? "#fef3c7" :
                              "#e5e7eb",
                        color:
                          unit.status === 'vacant' ? PRIMARY_COLOR :
                            unit.status === 'occupied' ? "#a16207" :
                              "#111827"
                      }}>
                      {unit.status.replace(/_/g, ' ')}
                    </span>
                  </h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Floor: {unit.floor || 'N/A'} | Bedrooms: {unit.numBedrooms || '0'} | Bathrooms: {unit.numBathrooms || '0'}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">{unit.details || 'No additional details.'}</p>
                  <p className="font-medium mb-1" style={{ color: PRIMARY_COLOR }}>Rent: ${unit.rentAmount?.toLocaleString() || 'N/A'}</p>
                  <p className="text-gray-600 text-sm flex items-center space-x-1">
                    <Square className="w-4 h-4" /> <span>{unit.squareFootage ? `${unit.squareFootage} sq ft` : 'N/A'}</span>
                  </p>
                </div>
                <div className="mt-5 flex flex-row gap-2 flex-wrap justify-end items-center">
                  <Button
                    onClick={() => goToManageTenants(unit._id)}
                    className="p-2 rounded-full hover:bg-[#d1fae5] transition flex items-center"
                    style={{ color: PRIMARY_COLOR }}
                    title="Manage Tenants for this Unit"
                  >
                    <Users className="w-5 h-5" />
                    <span className="ml-1 text-xs font-medium hidden sm:inline">Tenants</span>
                  </Button>
                  <Button
                    onClick={() => handleOpenEditUnitModal(unit)}
                    className="p-2 rounded-full hover:bg-[#e5e7eb] transition"
                    style={{
                      backgroundColor: "transparent",
                      color: PRIMARY_COLOR
                    }}
                    title="Edit Unit"
                  >
                    <Edit className="w-5 h-5" />
                    <span className="ml-1 text-xs font-medium hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    onClick={() => handleDeleteUnit(unit._id)}
                    className="p-2 rounded-full hover:bg-[#fca5a5] transition"
                    style={{
                      backgroundColor: "transparent",
                      color: '#e64848'
                    }}
                    title="Delete Unit"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="ml-1 text-xs font-medium hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tenants in this Property Section */}
      <div
        className="p-8 rounded-xl shadow-lg mb-10"
        style={{ background: '#fff', border: `1.5px solid ${PRIMARY_COLOR}15` }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>Tenants in {property.name}</h2>
          <Button
            onClick={() => navigate(`${getBasePath()}/tenants?propertyId=${propertyId}`)}
            className="font-medium flex items-center space-x-1 px-3 py-2 rounded-md"
            style={{
              backgroundColor: SECONDARY_COLOR,
              color: '#222',
              fontWeight: 600
            }}
          >
            <span>Manage All Tenants</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {property.tenants?.length === 0 ? (
          <p className="text-gray-600 italic text-center py-6">No tenants currently associated with this property.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {property.tenants.map(tenant => (
              <li key={tenant._id}
                className="p-4 rounded-lg shadow-sm border"
                style={{ background: "#f6fcfa", borderColor: PRIMARY_COLOR + "40" }}
              >
                <div className="font-semibold" style={{ color: PRIMARY_COLOR }}>{tenant.name || tenant.email}</div>
                <div className="text-sm text-gray-700">{tenant.email}</div>
                {tenant.assignedUnit?.unitName && (
                  <div className="text-xs mt-1" style={{ color: PRIMARY_COLOR }}>
                    Assigned Unit: {tenant.assignedUnit.unitName}
                  </div>
                )}
                <Button 
                  onClick={() => navigate(`${getBasePath()}/properties/${propertyId}/tenants/${tenant._id}`)}
                  className="text-sm mt-2 block"
                  style={{ color: SECONDARY_COLOR, fontWeight: 600 }}
                >
                  View/Manage Tenant
                </Button>
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
        title={
          <span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>
            Add New Unit to {property.name}
          </span>
        }
      >
        <form onSubmit={handleAddUnitSubmit} className="p-4 space-y-4">
          {addUnitError && <p className="text-red-500 text-sm mb-3">{addUnitError}</p>}
          <div>
            <label htmlFor="unitName" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Unit Name/Number</label>
            <input type="text" id="unitName" name="unitName" value={unitForm.unitName} onChange={handleUnitFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }} required />
          </div>
          <div>
            <label htmlFor="floor" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Floor (Optional)</label>
            <input type="text" id="floor" name="floor" value={unitForm.floor} onChange={handleUnitFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }} />
          </div>
          <div>
            <label htmlFor="details" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Details (Optional, Max 1000 chars)</label>
            <textarea id="details" name="details" value={unitForm.details} onChange={handleUnitFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 h-24"
              style={{ borderColor: PRIMARY_COLOR }} maxLength={1000}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numBedrooms" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Bedrooms</label>
              <input type="number" id="numBedrooms" name="numBedrooms" value={unitForm.numBedrooms} onChange={handleUnitFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }} min="0" />
            </div>
            <div>
              <label htmlFor="numBathrooms" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Bathrooms</label>
              <input type="number" id="numBathrooms" name="numBathrooms" value={unitForm.numBathrooms} onChange={handleUnitFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }} min="0" />
            </div>
            <div>
              <label htmlFor="squareFootage" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Square Footage</label>
              <input type="number" id="squareFootage" name="squareFootage" value={unitForm.squareFootage} onChange={handleUnitFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }} min="0" />
            </div>
            <div>
              <label htmlFor="rentAmount" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Rent Amount ($)</label>
              <input type="number" id="rentAmount" name="rentAmount" value={unitForm.rentAmount} onChange={handleUnitFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }} min="0" />
            </div>
          </div>
          <div>
            <label htmlFor="unitStatus" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Status</label>
            <select id="unitStatus" name="status" value={unitForm.status} onChange={handleUnitFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowAddUnitModal(false)}
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: "#e4e4e7", color: PRIMARY_COLOR, fontWeight: 600 }}>
              Cancel
            </Button>
            <Button type="submit"
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: SECONDARY_COLOR, color: "#222", fontWeight: 600 }}>
              Add Unit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        isOpen={showEditUnitModal}
        onClose={() => setShowEditUnitModal(false)}
        title={
          <span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>
            Edit Unit: {editUnitForm.unitName}
          </span>
        }
      >
        <form onSubmit={handleEditUnitSubmit} className="p-4 space-y-4">
          {editUnitError && <p className="text-red-500 text-sm mb-3">{editUnitError}</p>}
          <div>
            <label htmlFor="editUnitName" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Unit Name/Number</label>
            <input type="text" id="editUnitName" name="unitName" value={editUnitForm.unitName} onChange={handleEditUnitFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }} required />
          </div>
          <div>
            <label htmlFor="editFloor" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Floor</label>
            <input type="text" id="editFloor" name="floor" value={editUnitForm.floor} onChange={handleEditUnitFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }} />
          </div>
          <div>
            <label htmlFor="editDetails" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Details (Max 1000 chars)</label>
            <textarea id="editDetails" name="details" value={editUnitForm.details} onChange={handleEditUnitFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 h-24"
              style={{ borderColor: PRIMARY_COLOR }} maxLength={1000}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="editNumBedrooms" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Bedrooms</label>
              <input type="number" id="editNumBedrooms" name="numBedrooms" value={editUnitForm.numBedrooms} onChange={handleEditUnitFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }} min="0" />
            </div>
            <div>
              <label htmlFor="editNumBathrooms" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Bathrooms</label>
              <input type="number" id="editNumBathrooms" name="numBathrooms" value={editUnitForm.numBathrooms} onChange={handleEditUnitFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }} min="0" />
            </div>
            <div>
              <label htmlFor="editSquareFootage" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Square Footage</label>
              <input type="number" id="editSquareFootage" name="squareFootage" value={editUnitForm.squareFootage} onChange={handleEditUnitFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }} min="0" />
            </div>
            <div>
              <label htmlFor="editRentAmount" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Rent Amount ($)</label>
              <input type="number" id="editRentAmount" name="rentAmount" value={editUnitForm.rentAmount} onChange={handleEditUnitFormChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2"
                style={{ borderColor: PRIMARY_COLOR }} min="0" />
            </div>
          </div>
          <div>
            <label htmlFor="editUnitStatus" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Status</label>
            <select id="editUnitStatus" name="status" value={editUnitForm.status} onChange={handleEditUnitFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowEditUnitModal(false)}
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: "#e4e4e7", color: PRIMARY_COLOR, fontWeight: 600 }}>
              Cancel
            </Button>
            <Button type="submit"
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: PRIMARY_COLOR, color: '#fff', fontWeight: 600 }}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PropertyDetailPage;