// frontend/src/components/common/modals/AssignModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import LoadingSpinner from '../LoadingSpinner.jsx'; // Ensure correct path
import Input from '../Input.jsx'; // Ensure correct path

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for assigning a task/request to a user or vendor.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} props.title - The title of the assignment modal.
 * @param {Array<object>} props.assignableOptions - An array of objects to assign to.
 * Each object should have { _id: string, name: string, type: 'User' | 'Vendor' | 'PropertyManager' | 'Tenant' | 'Landlord' }.
 * @param {function} props.onSubmit - Function to call with the selected assignment ID and type.
 * @param {string} [props.currentAssignmentId] - The ID of the currently assigned entity.
 * @param {string} [props.currentAssignmentType] - The type of the currently assigned entity ('User' or 'Vendor').
 * @param {boolean} [props.loading=false] - Indicates if the assignment process is in progress.
 * @param {string} [props.error] - An error message to display.
 */
const AssignModal = ({
  isOpen,
  onClose,
  title,
  assignableOptions,
  onSubmit,
  currentAssignmentId = '',
  currentAssignmentType = '',
  loading = false,
  error
}) => {
  const [selectedAssignee, setSelectedAssignee] = useState({
    id: currentAssignmentId,
    type: currentAssignmentType
  });

  useEffect(() => {
    setSelectedAssignee({ id: currentAssignmentId, type: currentAssignmentType });
  }, [currentAssignmentId, currentAssignmentType]);

  const handleSelectChange = (e) => {
    const [id, type] = e.target.value.split('|');
    setSelectedAssignee({ id, type });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAssignee.id && selectedAssignee.type) {
      onSubmit(selectedAssignee.id, selectedAssignee.type);
    } else {
      // Optionally show a local error if nothing is selected
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="assigneeSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Assign To:
          </label>
          <select
            id="assigneeSelect"
            value={selectedAssignee.id ? `${selectedAssignee.id}|${selectedAssignee.type}` : ''}
            onChange={handleSelectChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Select an assignee...</option>
            {assignableOptions.map(option => (
              <option key={option._id} value={`${option._id}|${option.type}`}>
                {option.name} ({option.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={`bg-[${PRIMARY_COLOR}] hover:bg-[#1a7b64] text-white py-2 px-4 rounded-lg transition`}
            loading={loading}
            disabled={loading || !selectedAssignee.id}
          >
            {loading ? <LoadingSpinner size="sm" color="white" /> : "Assign"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignModal;
