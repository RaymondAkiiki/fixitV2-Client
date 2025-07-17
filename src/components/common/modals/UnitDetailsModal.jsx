// frontend/src/components/common/modals/UnitDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import LoadingSpinner from '../LoadingSpinner.jsx'; // Ensure correct path
import { Home, Bed, Bath, Ruler, DollarSign, FileText } from 'lucide-react'; // Icons

import { getUnitById } from '../../services/unitService.js'; // Assuming a service to fetch unit details
import { getLeaseByUnitId } from '../../services/leaseService.js'; // Assuming a service to get lease by unit ID

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for displaying detailed unit information.
 * Fetches unit details if unitId is provided, otherwise displays provided unit object.
 * Also attempts to fetch the active lease associated with the unit.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} [props.unitId] - The ID of the unit to fetch and display.
 * @param {object} [props.unit] - Optional: A unit object to display directly (if already fetched).
 * @param {string} [props.title="Unit Details"] - The title of the modal.
 */
const UnitDetailsModal = ({ isOpen, onClose, unitId, unit: initialUnit, title = "Unit Details" }) => {
  const [unit, setUnit] = useState(initialUnit);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!unitId && !initialUnit) {
        setError("No unit ID or unit object provided.");
        setLoading(false);
        return;
      }

      let currentUnit = initialUnit;
      if (unitId && !initialUnit) {
        setLoading(true);
        setError('');
        try {
          currentUnit = await getUnitById(unitId);
          setUnit(currentUnit);
        } catch (err) {
          setError("Failed to load unit details: " + (err.response?.data?.message || err.message));
          setLoading(false);
          return;
        }
      } else if (initialUnit) {
        setUnit(initialUnit);
      }

      // Fetch active lease for the unit if unit is available
      if (currentUnit?._id) {
        try {
          // Assuming getLeaseByUnitId returns the active lease for that unit
          const fetchedLease = await getLeaseByUnitId(currentUnit._id);
          setLease(fetchedLease);
        } catch (err) {
          console.warn("Failed to load lease for unit:", err);
          setLease(null); // Clear lease if fetch fails or no active lease
        }
      } else {
        setLease(null);
      }
      setLoading(false);
    };

    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, unitId, initialUnit]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-xl">
      {loading ? (
        <div className="p-8 flex justify-center items-center">
          <LoadingSpinner size="md" color={PRIMARY_COLOR} />
          <p className="ml-4 text-gray-700">Loading unit data...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-red-700 bg-red-100 border border-red-300 rounded-lg">
          <p>{error}</p>
        </div>
      ) : unit ? (
        <div className="p-6 space-y-5 text-gray-700">
          <div className="flex items-center space-x-3">
            <Home className="w-6 h-6 text-blue-500" />
            <p className="text-xl font-semibold">{unit.unitName || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Bed className="w-5 h-5 text-gray-500" />
              <p><strong>Bedrooms:</strong> {unit.bedrooms || 'N/A'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Bath className="w-5 h-5 text-gray-500" />
              <p><strong>Bathrooms:</strong> {unit.bathrooms || 'N/A'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Ruler className="w-5 h-5 text-gray-500" />
              <p><strong>Sq. Footage:</strong> {unit.squareFootage || 'N/A'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <p><strong>Rent:</strong> ${unit.rentAmount?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-gray-500 mt-1" />
            <p className="text-sm"><strong>Description:</strong> {unit.description || 'No description provided.'}</p>
          </div>

          {lease ? (
            <div className="mt-6 border-t pt-4 border-gray-200">
              <h4 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <FileText className="w-5 h-5 mr-2 text-purple-600" /> Active Lease
              </h4>
              <p><strong>Tenant:</strong> {lease.tenant?.name || lease.tenant?.email || 'N/A'}</p>
              <p><strong>Lease Term:</strong> {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}</p>
              <p><strong>Rent Amount:</strong> ${lease.rentAmount?.toFixed(2) || '0.00'} / {lease.rentFrequency || 'N/A'}</p>
              <p><strong>Status:</strong> <span className="capitalize">{lease.status}</span></p>
              {/* Add a link to full lease details if available */}
              {/* <Link to={`/leases/${lease._id}`} className="text-blue-600 hover:underline text-sm mt-2 block">View Full Lease</Link> */}
            </div>
          ) : (
            <div className="mt-6 border-t pt-4 border-gray-200">
              <p className="text-gray-600 italic">No active lease found for this unit.</p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={onClose} className={`bg-[${PRIMARY_COLOR}] hover:bg-[#1a7b64] text-white py-2 px-4 rounded-lg`}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-gray-600 text-center">No unit data available.</div>
      )}
    </Modal>
  );
};

export default UnitDetailsModal;
