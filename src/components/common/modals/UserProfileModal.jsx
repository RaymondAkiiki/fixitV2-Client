// frontend/src/components/common/modals/UserProfileModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import LoadingSpinner from '../LoadingSpinner.jsx'; // Ensure correct path
import { User, Mail, Phone, Building, Home, Briefcase } from 'lucide-react'; // Icons for user details
import { getUserById } from '../../services/userService.js'; // Service to fetch user details
import { getPropertyById } from '../../services/propertyService.js'; // Service to fetch property details

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for displaying detailed user profile information.
 * Fetches user details if userId is provided, otherwise displays provided user object.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} [props.userId] - The ID of the user to fetch and display.
 * @param {object} [props.user] - Optional: A user object to display directly (if already fetched).
 * @param {string} [props.title="User Profile"] - The title of the modal.
 */
const UserProfileModal = ({ isOpen, onClose, userId, user: initialUser, title = "User Profile" }) => {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId && !initialUser) {
        setError("No user ID or user object provided.");
        setLoading(false);
        return;
      }

      if (initialUser) {
        setUser(initialUser);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const fetchedUser = await getUserById(userId);
        setUser(fetchedUser);
      } catch (err) {
        setError("Failed to load user profile: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) { // Fetch data only when modal is open
      fetchUser();
    }
  }, [isOpen, userId, initialUser]);

  if (!isOpen) return null; // Render nothing if not open

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-xl">
      {loading ? (
        <div className="p-8 flex justify-center items-center">
          <LoadingSpinner size="md" color={PRIMARY_COLOR} />
          <p className="ml-4 text-gray-700">Loading user data...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-red-700 bg-red-100 border border-red-300 rounded-lg">
          <p>{error}</p>
        </div>
      ) : user ? (
        <div className="p-6 space-y-5 text-gray-700">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-500" />
            <p className="text-xl font-semibold">{user.name || 'N/A'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-500" />
            <p>{user.email || 'N/A'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-gray-500" />
            <p>{user.phone || 'N/A'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Briefcase className="w-5 h-5 text-gray-500" />
            <p className="capitalize">Role: {user.role || 'N/A'}</p>
          </div>

          {/* Display associated properties/units for Tenants/Landlords/PMs */}
          {user.associations?.tenancies?.length > 0 && (
            <div className="mt-6 border-t pt-4 border-gray-200">
              <h4 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <Home className="w-5 h-5 mr-2 text-green-600" /> Associated Properties/Units
              </h4>
              <ul className="list-disc list-inside space-y-2">
                {user.associations.tenancies.map((tenancy, index) => (
                  <li key={tenancy.unit?._id || tenancy.property?._id || index}>
                    <strong>Property:</strong> {tenancy.property?.name || 'N/A'}
                    {tenancy.unit?.unitName && ` - Unit: ${tenancy.unit.unitName}`}
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
        <div className="p-8 text-gray-600 text-center">No user data available.</div>
      )}
    </Modal>
  );
};

export default UserProfileModal;
