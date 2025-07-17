// frontend/src/components/common/modals/PropertyDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import LoadingSpinner from '../LoadingSpinner.jsx'; // Ensure correct path
import { Building, MapPin, Info, Home, User } from 'lucide-react'; // Icons

import { getPropertyById } from '../../services/propertyService.js'; // Service to fetch property details
import { getUserById } from '../../services/userService.js'; // Service to fetch user details (for owner)

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for displaying detailed property information.
 * Fetches property details if propertyId is provided, otherwise displays provided property object.
 * Also fetches owner details if owner ID is available.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} [props.propertyId] - The ID of the property to fetch and display.
 * @param {object} [props.property] - Optional: A property object to display directly (if already fetched).
 * @param {string} [props.title="Property Details"] - The title of the modal.
 */
const PropertyDetailsModal = ({ isOpen, onClose, propertyId, property: initialProperty, title = "Property Details" }) => {
  const [property, setProperty] = useState(initialProperty);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!propertyId && !initialProperty) {
        setError("No property ID or property object provided.");
        setLoading(false);
        return;
      }

      let currentProperty = initialProperty;
      if (propertyId && !initialProperty) {
        setLoading(true);
        setError('');
        try {
          currentProperty = await getPropertyById(propertyId);
          setProperty(currentProperty);
        } catch (err) {
          setError("Failed to load property details: " + (err.response?.data?.message || err.message));
          setLoading(false);
          return;
        }
      } else if (initialProperty) {
        setProperty(initialProperty);
      }

      // Fetch owner details if available
      if (currentProperty?.owner) {
        try {
          const fetchedOwner = await getUserById(currentProperty.owner);
          setOwner(fetchedOwner);
        } catch (err) {
          console.warn("Failed to load property owner details:", err);
          setOwner(null); // Clear owner if fetch fails
        }
      } else {
        setOwner(null);
      }
      setLoading(false);
    };

    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, propertyId, initialProperty]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-2xl">
      {loading ? (
        <div className="p-8 flex justify-center items-center">
          <LoadingSpinner size="md" color={PRIMARY_COLOR} />
          <p className="ml-4 text-gray-700">Loading property data...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-red-700 bg-red-100 border border-red-300 rounded-lg">
          <p>{error}</p>
        </div>
      ) : property ? (
        <div className="p-6 space-y-5 text-gray-700">
          <div className="flex items-center space-x-3">
            <Building className="w-6 h-6 text-blue-500" />
            <p className="text-xl font-semibold">{property.name || 'N/A'}</p>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-500 mt-1" />
            <p>
              {property.address?.street || ''} {property.address?.city || ''}, {property.address?.state || ''} {property.address?.zip || ''} {property.address?.country || 'N/A'}
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-gray-500 mt-1" />
            <p className="text-sm">{property.details || 'No additional details provided.'}</p>
          </div>

          {owner && (
            <div className="mt-6 border-t pt-4 border-gray-200">
              <h4 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <User className="w-5 h-5 mr-2 text-purple-600" /> Owner Information
              </h4>
              <p><strong>Name:</strong> {owner.name || 'N/A'}</p>
              <p><strong>Email:</strong> {owner.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {owner.phone || 'N/A'}</p>
            </div>
          )}

          {property.units && property.units.length > 0 && (
            <div className="mt-6 border-t pt-4 border-gray-200">
              <h4 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <Home className="w-5 h-5 mr-2 text-green-600" /> Units ({property.units.length})
              </h4>
              <ul className="list-disc list-inside space-y-2">
                {property.units.map((unit) => (
                  <li key={unit._id}>
                    <strong>{unit.unitName}</strong> - {unit.bedrooms} Beds, {unit.bathrooms} Baths, {unit.squareFootage} sqft
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={onClose} className={`bg-[${PRIMARY_COLOR}] hover:bg-[#1a7b64] text-white py-2 px-4 rounded-lg`}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-gray-600 text-center">No property data available.</div>
      )}
    </Modal>
  );
};

export default PropertyDetailsModal;
