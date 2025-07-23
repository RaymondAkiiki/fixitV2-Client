import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { ROUTES } from '../../utils/constants';

// Service imports
import { getPropertyById } from '../../services/propertyService';
import { getUnitById, updateUnit } from '../../services/unitService';

// Icons
import { 
  Edit, ArrowLeft, Bed, Bath, DollarSign, 
  Home, Square, Users, ChevronRight
} from 'lucide-react';

const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

function UnitDetailPage() {
  const { propertyId, unitId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isPropertyManager, isLandlord } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();

  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    unitName: "",
    floor: "",
    details: "",
    numBedrooms: 0,
    numBathrooms: 0,
    squareFootage: 0,
    rentAmount: 0,
    status: "vacant"
  });

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

  // Effect to fetch unit details
  useEffect(() => {
    const fetchUnitData = async () => {
      setLoading(true);
      try {
        const data = await getUnitById(propertyId, unitId);
        setUnit(data);
        setFormData({
          unitName: data.unitName || "",
          floor: data.floor || "",
          details: data.details || "",
          numBedrooms: data.numBedrooms || 0,
          numBathrooms: data.numBathrooms || 0,
          squareFootage: data.squareFootage || 0,
          rentAmount: data.rentAmount || 0,
          status: data.status || "vacant"
        });
      } catch (err) {
        const errMsg = 'Failed to fetch unit details: ' + (err.response?.data?.message || err.message);
        setError(errMsg);
        showError(errMsg);
        console.error("Fetch unit details error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && unitId) {
      fetchUnitData();
    }
  }, [propertyId, unitId, showError]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUnit(propertyId, unitId, formData);
      showSuccess("Unit updated successfully!");
      setIsEditing(false);
      // Refresh unit data
      const updatedUnit = await getUnitById(propertyId, unitId);
      setUnit(updatedUnit);
    } catch (err) {
      const errMsg = 'Failed to update unit: ' + (err.response?.data?.message || err.message);
      setError(errMsg);
      showError(errMsg);
      console.error("Update unit error:", err);
    }
  };

  // Navigate back to unit list
  const goBackToUnitList = () => {
    navigate(`${getBasePath()}/properties/${propertyId}/units`);
  };

  // Navigate to unit edit page
  const goToUnitEdit = () => {
    navigate(`${getBasePath()}/properties/${propertyId}/units/edit/${unitId}`);
  };

  // Navigate to manage tenants for this unit
  const goToManageTenants = () => {
    navigate(`${getBasePath()}/properties/${propertyId}/tenants/${unitId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <p className="text-xl text-gray-600">Loading unit details...</p>
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

  if (!unit || !property) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)]">
        <p className="text-xl text-gray-600">Unit or property not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      {/* Header with back button */}
      <div className="flex items-center mb-2">
        <button 
          onClick={goBackToUnitList}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back to Units
        </button>
      </div>
      
      {/* Main Header */}
      <div className="flex justify-between items-center mb-7 border-b pb-3" style={{ borderColor: PRIMARY_COLOR }}>
        <h1 className="text-3xl font-extrabold" style={{ color: PRIMARY_COLOR }}>
          <span className="font-bold">Unit {unit.unitName}</span> at {property.name}
        </h1>
        <Button
          onClick={goToUnitEdit}
          className="flex items-center space-x-2 py-2 px-4 rounded-lg shadow-md"
          style={{
            backgroundColor: PRIMARY_COLOR,
            color: '#fff',
            fontWeight: 600
          }}
        >
          <Edit className="w-5 h-5" /> <span>Edit Unit</span>
        </Button>
      </div>

      {/* Unit Details Section */}
      <div
        className="p-8 rounded-xl shadow-lg mb-10"
        style={{ background: '#fff', border: `1.5px solid ${PRIMARY_COLOR}30` }}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>Unit Details</h2>
          <div className="px-3 py-1 rounded-full text-sm font-semibold capitalize"
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex items-center space-x-2">
              <Bed className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
              <div>
                <p className="text-sm text-gray-500">Bedrooms</p>
                <p className="font-medium text-gray-800">{unit.numBedrooms || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Bath className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
              <div>
                <p className="text-sm text-gray-500">Bathrooms</p>
                <p className="font-medium text-gray-800">{unit.numBathrooms || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Square className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
              <div>
                <p className="text-sm text-gray-500">Square Footage</p>
                <p className="font-medium text-gray-800">{unit.squareFootage ? `${unit.squareFootage} sq ft` : 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="font-medium text-gray-800">${unit.rentAmount?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Floor</p>
                <p className="font-medium text-gray-800">{unit.floor || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Property</p>
                <p className="font-medium text-gray-800">{property.name}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Unit Description</p>
              <p className="text-gray-800 mt-1">{unit.details || 'No additional details provided.'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Property Address</h3>
            <p className="text-gray-800">
              {property.address?.street}<br />
              {property.address?.city}, {property.address?.state} {property.address?.zipCode}<br />
              {property.address?.country}
            </p>
          </div>
        </div>
      </div>

      {/* Current Tenant Section */}
      <div
        className="p-8 rounded-xl shadow-lg mb-10"
        style={{ background: '#fff', border: `1.5px solid ${SECONDARY_COLOR}40` }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>Current Tenant</h2>
          <Button
            onClick={goToManageTenants}
            className="font-medium flex items-center space-x-1 px-3 py-2 rounded-md"
            style={{
              backgroundColor: SECONDARY_COLOR,
              color: '#222',
              fontWeight: 600
            }}
          >
            <Users className="w-5 h-5 mr-1" />
            <span>Manage Tenants</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {unit.tenant ? (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{unit.tenant.firstName} {unit.tenant.lastName}</h3>
                <p className="text-gray-600">{unit.tenant.email}</p>
                {unit.tenant.phone && <p className="text-gray-600">{unit.tenant.phone}</p>}
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(`${getBasePath()}/users/${unit.tenant._id}`)}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: '#e6f9f4',
                    color: PRIMARY_COLOR,
                    fontWeight: 600
                  }}
                >
                  View Profile
                </Button>
                
                {(unit.lease && unit.lease._id) && (
                  <Button
                    onClick={() => navigate(`${getBasePath()}/leases/${unit.lease._id}`)}
                    className="px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: '#fff8e6',
                      color: '#a16207',
                      fontWeight: 600
                    }}
                  >
                    View Lease
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600 italic">No tenant is currently assigned to this unit.</p>
            <Button
              onClick={goToManageTenants}
              className="mt-4 px-4 py-2 rounded-lg inline-flex items-center"
              style={{
                backgroundColor: SECONDARY_COLOR,
                color: '#222',
                fontWeight: 600
              }}
            >
              <Users className="w-5 h-5 mr-2" />
              Assign Tenant
            </Button>
          </div>
        )}
      </div>

      {/* Lease Information Section */}
      {unit.lease && (
        <div
          className="p-8 rounded-xl shadow-lg mb-10"
          style={{ background: '#fff', border: `1.5px solid ${PRIMARY_COLOR}15` }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>Lease Information</h2>
            <Button
              onClick={() => navigate(`${getBasePath()}/leases/${unit.lease._id}`)}
              className="font-medium flex items-center space-x-1 px-3 py-2 rounded-md"
              style={{
                backgroundColor: PRIMARY_COLOR,
                color: '#fff',
                fontWeight: 600
              }}
            >
              <span>View Lease Details</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Lease Period</p>
              <p className="font-medium text-gray-800">
                {new Date(unit.lease.leaseStartDate).toLocaleDateString()} to {new Date(unit.lease.leaseEndDate).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Monthly Rent</p>
              <p className="font-medium text-gray-800">${unit.lease.monthlyRent?.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Security Deposit</p>
              <p className="font-medium text-gray-800">${unit.lease.securityDeposit?.toLocaleString() || 'Not specified'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Lease Status</p>
              <p className={`font-medium capitalize ${
                unit.lease.status === 'active' ? 'text-green-600' : 
                unit.lease.status === 'pending_renewal' ? 'text-yellow-600' :
                unit.lease.status === 'expired' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {unit.lease.status.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnitDetailPage;