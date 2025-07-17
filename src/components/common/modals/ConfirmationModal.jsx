// frontend/src/components/common/modals/ConfirmationModal.jsx
import React from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A generic confirmation modal.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} props.title - The title of the confirmation dialog.
 * @param {string} props.message - The confirmation message.
 * @param {function} props.onConfirm - Function to call when the user confirms the action.
 * @param {string} [props.confirmText="Confirm"] - Text for the confirm button.
 * @param {string} [props.cancelText="Cancel"] - Text for the cancel button.
 * @param {boolean} [props.loading=false] - Indicates if the confirm action is in progress.
 * @param {string} [props.confirmButtonColor="bg-red-600"] - Tailwind class for confirm button background.
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  confirmButtonColor = "bg-red-600" // Default to red for destructive actions
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4 text-gray-700">
        <p className="mb-6 text-lg">{message}</p>
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`${confirmButtonColor} hover:opacity-90 text-white py-2 px-4 rounded-lg transition`}
            loading={loading}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
