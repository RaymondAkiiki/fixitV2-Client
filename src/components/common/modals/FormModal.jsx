// frontend/src/components/common/modals/FormModal.jsx
import React from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import LoadingSpinner from '../LoadingSpinner.jsx'; // Ensure correct path

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A generic modal for displaying forms.
 * It provides a consistent layout for forms within a modal.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} props.title - The title of the form modal.
 * @param {React.ReactNode} props.children - The form fields and content to be rendered inside the modal body.
 * @param {function} props.onSubmit - Function to call when the form is submitted.
 * @param {string} [props.submitText="Submit"] - Text for the submit button.
 * @param {boolean} [props.loading=false] - Indicates if the form submission is in progress.
 * @param {string} [props.error] - An error message to display at the top of the form.
 * @param {string} [props.submitButtonColor="bg-blue-600"] - Tailwind class for submit button background.
 */
const FormModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Submit",
  loading = false,
  error,
  submitButtonColor = `bg-[${PRIMARY_COLOR}]` // Default to primary color
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="p-4 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {children}
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
            className={`${submitButtonColor} hover:opacity-90 text-white py-2 px-4 rounded-lg transition`}
            loading={loading}
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" color="white" /> : submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FormModal;
