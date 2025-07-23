import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { Home, Save, XCircle } from "lucide-react";
import { getPropertyById } from '../../services/propertyService';
import { getUnitById, createUnit, updateUnit } from '../../services/unitService';
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../utils/constants";

// Brand Colors
const PRIMARY_COLOR = "#219377";
const PRIMARY_DARK = "#197b63";
const SECONDARY_COLOR = "#ffbd59";

function UnitFormPage() {
  const { propertyId, unitId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!unitId;
  const { showSuccess, showError } = useGlobalAlert();
  const { isAdmin, isPropertyManager, isLandlord } = useAuth();

  const [property, setProperty] = useState(null);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Determine the base path for navigation based on user role
  const getBasePath = useCallback(() => {
    if (isAdmin) return ROUTES.ADMIN_BASE;
    if (isPropertyManager) return ROUTES.PM_BASE;
    if (isLandlord) return ROUTES.LANDLORD_BASE;
    return ''; // Fallback
  }, [isAdmin, isPropertyManager, isLandlord]);

  // Fetch property data
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const data = await getPropertyById(propertyId);
        setProperty(data);
      } catch (err) {
        const errMsg = 'Failed to fetch property details: ' + (err.response?.data?.message || err.message);
        setError(errMsg);
        showError(errMsg);
      }
    };

    if (propertyId) {
      fetchPropertyData();
    }
  }, [propertyId, showError]);

  // Fetch unit data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchUnitData = async () => {
        setLoading(true);
        try {
          const data = await getUnitById(propertyId, unitId);
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
          const msg = err.response?.data?.message || err.message;
          setError("Failed to load unit data for editing. " + msg);
          showError("Failed to load unit data for editing. " + msg);
        } finally {
          setLoading(false);
        }
      };
      fetchUnitData();
    }
  }, [propertyId, unitId, isEditMode, showError]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    if (type === 'number') {
      setFormData(f => ({ ...f, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.unitName.trim()) errors.unitName = "Unit name/number is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) {
      showError("Please correct the form errors.");
      return;
    }
    setLoading(true);
    try {
      if (isEditMode) {
        await updateUnit(propertyId, unitId, formData);
        showSuccess("Unit updated successfully!");
      } else {
        await createUnit(propertyId, formData);
        showSuccess("Unit created successfully!");
      }
      navigate(`${getBasePath()}/properties/${propertyId}/units`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to ${isEditMode ? 'update' : 'create'} unit: ${msg}`);
      showError(`Failed to ${isEditMode ? 'update' : 'create'} unit: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`${getBasePath()}/properties/${propertyId}/units/${unitId}`);
    } else {
      navigate(`${getBasePath()}/properties/${propertyId}/units`);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading unit data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        <Home className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
        {isEditMode ? "Edit Unit" : "Add New Unit"} 
        {property && <span className="text-xl ml-2 font-normal text-gray-600">for {property.name}</span>}
      </h1>

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

      <div
        className="p-8 rounded-xl shadow-lg border max-w-3xl mx-auto"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "20" }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="unitName" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Unit Name/Number:
            </label>
            <input
              type="text"
              id="unitName"
              name="unitName"
              value={formData.unitName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${formErrors.unitName ? 'border-red-500' : 'border-[#219377]'}`}
              style={{ color: PRIMARY_COLOR }}
              required
              disabled={loading}
            />
            {formErrors.unitName && <p className="text-red-500 text-xs mt-1">{formErrors.unitName}</p>}
          </div>

          <div>
            <label htmlFor="floor" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Floor (Optional):
            </label>
            <input
              type="text"
              id="floor"
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
              style={{ color: PRIMARY_COLOR }}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="numBedrooms" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Number of Bedrooms:
              </label>
              <input
                type="number"
                id="numBedrooms"
                name="numBedrooms"
                value={formData.numBedrooms}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
                style={{ color: PRIMARY_COLOR }}
                min="0"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="numBathrooms" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Number of Bathrooms:
              </label>
              <input
                type="number"
                id="numBathrooms"
                name="numBathrooms"
                value={formData.numBathrooms}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
                style={{ color: PRIMARY_COLOR }}
                min="0"
                step="0.5"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="squareFootage" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Square Footage:
              </label>
              <input
                type="number"
                id="squareFootage"
                name="squareFootage"
                value={formData.squareFootage}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
                style={{ color: PRIMARY_COLOR }}
                min="0"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="rentAmount" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
                Rent Amount ($):
              </label>
              <input
                type="number"
                id="rentAmount"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
                style={{ color: PRIMARY_COLOR }}
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Unit Status:
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none"
              style={{ color: PRIMARY_COLOR }}
              disabled={loading}
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div>
            <label htmlFor="details" className="block text-sm font-semibold mb-1" style={{ color: PRIMARY_COLOR }}>
              Details (Optional):
            </label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-[#219377] rounded-lg shadow-sm focus:outline-none resize-y"
              style={{ color: PRIMARY_COLOR }}
              disabled={loading}
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={handleCancel}
              className="py-2 px-5 rounded-lg flex items-center"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600
              }}
              disabled={loading}
            >
              <XCircle className="w-5 h-5 mr-2" /> Cancel
            </Button>
            <Button
              type="submit"
              className="py-2 px-5 rounded-lg flex items-center shadow-md"
              style={{
                backgroundColor: PRIMARY_COLOR,
                color: "#fff",
                fontWeight: 600
              }}
              disabled={loading}
            >
              <Save className="w-5 h-5 mr-2" /> {isEditMode ? "Update Unit" : "Create Unit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UnitFormPage;