// frontend/src/components/common/modals/InviteUserModal.jsx
import React, { useEffect } from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import Input from '../Input.jsx'; // Ensure correct path
import LoadingSpinner from '../LoadingSpinner.jsx'; // Ensure correct path
import useForm from '../../hooks/useForm.js'; // Assuming useForm is available
import { USER_ROLES } from '../../utils/constants.js'; // Assuming USER_ROLES constant

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for inviting new users (tenants, property managers, vendors, landlords).
 * Includes fields for email, role, and optional property/unit association.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {function} props.onSubmit - Function to call with the invite data ({ email, role, propertyId, unitId }).
 * @param {string} [props.title="Invite New User"] - The title of the modal.
 * @param {boolean} [props.loading=false] - Indicates if the invitation is being sent.
 * @param {string} [props.error] - An error message to display.
 * @param {Array<object>} [props.properties=[]] - List of properties to select from for association.
 * Each property object should have { _id: string, name: string, units: Array<{_id: string, unitName: string}> }.
 */
const InviteUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Invite New User",
  loading = false,
  error,
  properties = []
}) => {
  const {
    values: inviteForm,
    errors: inviteFormErrors,
    handleChange,
    handleSubmit,
    isSubmitting,
    resetForm
  } = useForm(
    { email: "", role: USER_ROLES.TENANT, propertyId: "", unitId: "" },
    (values) => {
      const formErrors = {};
      if (!values.email.trim()) formErrors.email = "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) formErrors.email = "Invalid email format.";
      if (!values.role) formErrors.role = "Role is required.";
      if (values.role === USER_ROLES.TENANT && !values.propertyId) {
        formErrors.propertyId = "Property is required for tenants.";
      }
      return formErrors;
    },
    (formValues) => {
      onSubmit(formValues); // Pass values to the parent's onSubmit handler
      resetForm(); // Reset form after submission attempt
    }
  );

  // Effect to reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handlePropertyChange = (e) => {
    const propertyId = e.target.value;
    handleChange({ target: { name: 'propertyId', value: propertyId } });
    handleChange({ target: { name: 'unitId', value: '' } }); // Reset unit when property changes
  };

  const unitsForSelectedProperty = inviteForm.propertyId
    ? properties.find(p => p._id === inviteForm.propertyId)?.units || []
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {(error || inviteFormErrors._form) && ( // _form error for general submission errors from useForm
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error || inviteFormErrors._form}</span>
          </div>
        )}

        <p className="text-gray-700 mb-4">
          Send an invitation to a new user. They will be prompted to set up their account and link to a specific property and unit if applicable.
        </p>

        <Input
          label="User Email"
          id="inviteEmail"
          name="email"
          type="email"
          value={inviteForm.email}
          onChange={handleChange}
          placeholder="user@example.com"
          required
          error={inviteFormErrors.email}
          disabled={isSubmitting || loading}
        />

        <div>
          <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
          <select
            id="inviteRole"
            name="role"
            value={inviteForm.role}
            onChange={handleChange}
            className={`mt-1 block w-full p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
              ${inviteFormErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[${PRIMARY_COLOR}] focus:ring-green-200'}
              ${isSubmitting || loading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
            `}
            required
            disabled={isSubmitting || loading}
          >
            {Object.values(USER_ROLES).map(role => (
              <option key={role} value={role}>{role.replace(/_/g, ' ').charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}</option>
            ))}
          </select>
          {inviteFormErrors.role && <p className="mt-1 text-xs text-red-500">{inviteFormErrors.role}</p>}
        </div>

        {(inviteForm.role === USER_ROLES.TENANT || inviteForm.role === USER_ROLES.LANDLORD || inviteForm.role === USER_ROLES.PROPERTY_MANAGER) && (
          <div>
            <label htmlFor="inviteProperty" className="block text-sm font-medium text-gray-700 mb-1">Property <span className="text-red-500">*</span></label>
            <select
              id="inviteProperty"
              name="propertyId"
              value={inviteForm.propertyId}
              onChange={handlePropertyChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-[${PRIMARY_COLOR}] focus:border-[${PRIMARY_COLOR}]
                ${inviteFormErrors.propertyId ? 'border-red-500' : 'border-gray-300'}
              `}
              required={inviteForm.role === USER_ROLES.TENANT} // Only required for tenant
              disabled={isSubmitting || loading}
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>
            {inviteFormErrors.propertyId && <p className="mt-1 text-xs text-red-500">{inviteFormErrors.propertyId}</p>}
          </div>
        )}

        {inviteForm.propertyId && inviteForm.role === USER_ROLES.TENANT && (
          <div>
            <label htmlFor="inviteUnit" className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional, but recommended for tenants):</label>
            <select
              id="inviteUnit"
              name="unitId"
              value={inviteForm.unitId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-[${PRIMARY_COLOR}] focus:border-[${PRIMARY_COLOR}]
                ${inviteFormErrors.unitId ? 'border-red-500' : 'border-gray-300'}
              `}
              disabled={isSubmitting || loading}
            >
              <option value="">Select Unit (Optional)</option>
              {unitsForSelectedProperty.map(unit => (
                <option key={unit._id} value={unit._id}>{unit.unitName}</option>
              ))}
            </select>
            {inviteFormErrors.unitId && <p className="mt-1 text-xs text-red-500">{inviteFormErrors.unitId}</p>}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
            disabled={isSubmitting || loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={`bg-[${SECONDARY_COLOR}] hover:bg-[#e7a741] text-[#1c2522] py-2 px-4 rounded-lg transition`}
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? <LoadingSpinner size="sm" color="#1c2522" /> : "Send Invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteUserModal;
