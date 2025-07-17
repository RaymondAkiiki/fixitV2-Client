// frontend/src/components/common/modals/ImageViewerModal.jsx
import React from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path

// Branding colors (not directly used in this component, but for consistency)
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for viewing images.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} props.imageUrl - The URL of the image to display.
 * @param {string} [props.title="Image Viewer"] - The title of the modal.
 * @param {string} [props.altText="Displayed image"] - Alt text for the image.
 */
const ImageViewerModal = ({ isOpen, onClose, imageUrl, title = "Image Viewer", altText = "Displayed image" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-3xl">
      <div className="p-2 flex justify-center items-center bg-gray-100 rounded-lg">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText}
            className="max-w-full max-h-[80vh] object-contain rounded-md"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = "https://placehold.co/600x400/E0E0E0/616161?text=Image+Not+Found"; // Placeholder
            }}
          />
        ) : (
          <p className="text-gray-500 py-10">No image to display.</p>
        )}
      </div>
    </Modal>
  );
};

export default ImageViewerModal;
