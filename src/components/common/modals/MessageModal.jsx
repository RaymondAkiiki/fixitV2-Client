// frontend/src/components/common/modals/MessageModal.jsx
import React from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import { CheckCircle, XCircle, Info } from 'lucide-react'; // Icons for different message types

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A generic message modal for displaying success, error, or info messages.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} props.title - The title of the message modal.
 * @param {string} props.message - The message content.
 * @param {'success' | 'error' | 'info'} [props.type='info'] - The type of message (influences styling and icon).
 * @param {string} [props.buttonText="OK"] - Text for the close button.
 */
const MessageModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = "OK"
}) => {
  const iconMap = {
    success: <CheckCircle className="w-10 h-10 text-green-500" />,
    error: <XCircle className="w-10 h-10 text-red-500" />,
    info: <Info className="w-10 h-10 text-blue-500" />,
  };

  const titleColorMap = {
    success: "text-green-700",
    error: "text-red-700",
    info: "text-blue-700",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} titleClassName={titleColorMap[type] || "text-gray-800"}>
      <div className="p-4 flex flex-col items-center text-center">
        <div className="mb-4">
          {iconMap[type]}
        </div>
        <p className="mb-6 text-lg text-gray-700">{message}</p>
        <Button
          onClick={onClose}
          className={`py-2 px-6 rounded-lg transition ${
            type === 'success' ? `bg-[${PRIMARY_COLOR}] hover:bg-[#1a7b64] text-white` :
            type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
            `bg-blue-600 hover:bg-blue-700 text-white`
          }`}
        >
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
};

export default MessageModal;
