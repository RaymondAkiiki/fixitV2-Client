import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { ROUTES } from '../../utils/constants';

// Service imports
import { getPropertyById } from '../../services/propertyService';
import { getUnitsForProperty, createUnit, deleteUnit } from '../../services/unitService';

// Icons
import { 
  PlusCircle, Edit, Trash2, Eye, Search, 
  Home, ArrowLeft, Bed, Bath, DollarSign, Square
} from 'lucide-react';

const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

function UnitListPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isPropertyManager, isLandlord } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Add Unit Modal
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unitName: "", 
    floor: "", 
    details: "", 
    numBedrooms: 0, 
    numBathrooms: 0,
    squareFootage: 0, 
    rentAmount: 0, 
    status: "vacant"
  });
  const [addUnitError, setAddUnitError] = useState("");

  // Determine the base path for navigation based on user role
  const getBasePath = useCallback(() => {
    if (isAdmin) return ROUTES.ADMIN_BASE;
    if (isPropertyManager) return ROUTES.PM_BASE;
    if (isLandlord) return ROUTES.LANDLORD_BASE;
    return ''; // Fallback
  }, [isAdmin, isPropertyManager, isLandlord]);

  // Effect to fetch property details
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const data = await getPropertyById(propertyId);
        setProperty(data);
      } catch (err) {
        const errMsg = 'Failed to fetch property details: ' + (err.response?.data?.message || err.message);
        setError(errMsg);
        showError(errMsg);
        console.error("Fetch property details error:", err);
      }
    };

    if (propertyId) {
      fetchPropertyData();
    }
  }, [propertyId, showError]);

  // Effect to load units on initial render and when search/pagination changes
  useEffect(() => {
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, currentPage, searchQuery]);

  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage
      };
      const response = await getUnitsForProperty(propertyId, params);
      
      setUnits(response.units || []);
      setTotalItems(response.total || 0);
      setTotalPages(response.pages || 1);
    } catch (err) {
      const errMsg = 'Failed to fetch units: ' + (err.response?.data?.message || err.message);
      setError(errMsg);
      showError(errMsg);
      console.error("Fetch units error:", err);
    } finally {
      setLoading(false);
    }
  };

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
      setUnitForm({ 
        unitName: "", 
        floor: "", 
        details: "", 
        numBedrooms: 0, 
        numBathrooms: 0, 
        squareFootage: 0, 
        rentAmount: 0, 
        status: "vacant" 
      });
      fetchUnits();
    } catch (err) {
      const errMsg = "Failed to add unit: " + (err.response?.data?.message || err.message);
      setAddUnitError(errMsg);
      showError(errMsg);
      console.error("Add unit error:", err);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (window.confirm("Are you sure you want to delete this unit? This will also remove any tenant associations and related requests. This action cannot be undone.")) {
      try {
        await deleteUnit(propertyId, unitId);
        showSuccess("Unit deleted successfully!");
        fetchUnits();
      } catch (err) {
        const errMsg = "Failed to delete unit: " + (err.response?.data?.message || err.message);
        showError(errMsg);
        console.error("Delete unit error:", err);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchUnits();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // fetchUnits will be called by the useEffect that depends on currentPage
  };

  // Navigate to unit details page
  const goToUnitDetails = (unitId) => {
    navigate(`${getBasePath()}/properties/${propertyId}/units/${unitId}`);
  };

  // Navigate to unit edit page
  const goToUnitEdit = (unitId) => {
    navigate(`${getBasePath()}/properties/${propertyId}/units/edit/${unitId}`);
  };

  // Navigate back to property details
  const goBackToProperty = () => {
    navigate(`${getBasePath()}/properties/${propertyId}`);
  };

  if (loading && !property) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <p className="text-xl text-gray-600">Loading property details...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      {/* Header with back button */}
      <div className="flex items-center mb-2">
        <button 
          onClick={goBackToProperty}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back to Property
        </button>
      </div>
      
      {/* Main Header */}
      <div className="flex justify-between items-center mb-7 border-b pb-3" style={{ borderColor: PRIMARY_COLOR }}>
        <h1 className="text-3xl font-extrabold" style={{ color: PRIMARY_COLOR }}>
          Units for: <span className="font-bold">{property?.name || 'Loading...'}</span>
        </h1>
        <Button
          onClick={() => setShowAddUnitModal(true)}
          className="flex items-center space-x-2 py-2 px-4 rounded-lg shadow-md"
          style={{
            backgroundColor: SECONDARY_COLOR,
            color: '#222',
            fontWeight: 600
          }}
        >
          <PlusCircle className="w-5 h-5" /> <span>Add New Unit</span>
        </Button>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded relative mb-4 flex items-center"
          style={{
            backgroundColor: "#fed7d7",
            border: "1.5px solid #f56565",
            color: "#9b2c2c"
          }}
          role="alert"
        >
          <strong className="font-bold mr-2">Error!</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Search Controls */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 rounded-lg shadow-sm border"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "10" }}
      >
        <div className="text-gray-700">
          <span className="font-medium">Property Address:</span> {property?.address?.street}, {property?.address?.city}, {property?.address?.state}, {property?.address?.country}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search units by name/number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none"
            style={{
              borderColor: PRIMARY_COLOR,
              color: PRIMARY_COLOR,
              background: "#f6fcfa"
            }}
          />
          <Button
            type="submit"
            className="py-2 px-4 rounded-lg"
            style={{
              backgroundColor: SECONDARY_COLOR,
              color: "#222",
              fontWeight: 600
            }}
          >
            <Search className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* Units Grid */}
      <div
        className="p-6 rounded-xl shadow-lg border mb-8"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "10" }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading units...</p>
          </div>
        ) : units.length === 0 ? (
          <p className="italic text-center py-8" style={{ color: PRIMARY_COLOR + "99" }}>
            No units found for this property. {searchQuery ? 'Try a different search term or ' : ''} 
            Add your first unit!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map(unit => (
              <div
                key={unit._id}
                className="flex flex-col justify-between p-6 rounded-xl shadow-sm border transition-all hover:shadow-md"
                style={{
                  background: "#f6fcfa",
                  borderColor: PRIMARY_COLOR + "40",
                  minHeight: "250px"
                }}
              >
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center justify-between"
                    style={{ color: PRIMARY_COLOR }}>
                    <div className="flex items-center">
                      <Home className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} />
                      <span>{unit.unitName}</span>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
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

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center text-gray-700 text-sm">
                      <Bed className="w-4 h-4 mr-1" />
                      <span>Bedrooms: {unit.numBedrooms || '0'}</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-sm">
                      <Bath className="w-4 h-4 mr-1" />
                      <span>Bathrooms: {unit.numBathrooms || '0'}</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-sm">
                      <Square className="w-4 h-4 mr-1" />
                      <span>{unit.squareFootage ? `${unit.squareFootage} sq ft` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-sm">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>${unit.rentAmount?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>

                  {unit.floor && (
                    <p className="text-gray-700 text-sm mb-2">
                      Floor: {unit.floor}
                    </p>
                  )}
                  
                  {unit.details && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {unit.details}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    onClick={() => goToUnitDetails(unit._id)}
                    className="p-2 rounded-lg bg-[#e6f9f4] hover:bg-[#d1fae5] transition flex items-center"
                    style={{ color: PRIMARY_COLOR }}
                    title="View Unit Details"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="ml-1 text-xs font-medium">View</span>
                  </Button>
                  <Button
                    onClick={() => goToUnitEdit(unit._id)}
                    className="p-2 rounded-lg bg-[#fff8e6] hover:bg-[#fef3c7] transition flex items-center"
                    style={{ color: PRIMARY_COLOR }}
                    title="Edit Unit"
                  >
                    <Edit className="w-5 h-5" />
                    <span className="ml-1 text-xs font-medium">Edit</span>
                  </Button>
                  <Button
                    onClick={() => handleDeleteUnit(unit._id)}
                    className="p-2 rounded-lg bg-[#fee2e2] hover:bg-[#fecaca] transition flex items-center"
                    style={{ color: '#e64848' }}
                    title="Delete Unit"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="ml-1 text-xs font-medium">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {units.length > 0 && (
          <div className="mt-6">
            <Pagination 
              totalItems={totalItems} 
              itemsPerPage={itemsPerPage} 
              currentPage={currentPage} 
              onPageChange={handlePageChange}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>

      {/* Add New Unit Modal */}
      <Modal
        isOpen={showAddUnitModal}
        onClose={() => setShowAddUnitModal(false)}
        title={
          <span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>
            Add New Unit to {property?.name || 'Property'}
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
    </div>
  );
}

export default UnitListPage;