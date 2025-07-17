// frontend/src/components/common/modals/DocumentViewerModal.jsx
import React from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path

// Branding colors (not directly used in this component, but for consistency)
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for viewing various document types (e.g., PDFs).
 * Uses an iframe for embedding, which is generally secure for common document types.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} props.documentUrl - The URL of the document to display.
 * @param {string} [props.title="Document Viewer"] - The title of the modal.
 * @param {string} [props.fileType="application/pdf"] - The MIME type of the document (e.g., "application/pdf").
 */
const DocumentViewerModal = ({ isOpen, onClose, documentUrl, title = "Document Viewer", fileType = "application/pdf" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-5xl h-[90vh]">
      <div className="p-2 flex flex-col items-center justify-center h-full">
        {documentUrl ? (
          <iframe
            src={documentUrl}
            type={fileType}
            title="Document Viewer"
            className="w-full h-full border-0 rounded-md"
            allowFullScreen
          >
            <p className="text-gray-600">Your browser does not support iframes or the document type.</p>
            <p className="text-gray-600">Please download the document to view it: <a href={documentUrl} download className="text-blue-600 hover:underline">Download Document</a></p>
          </iframe>
        ) : (
          <p className="text-gray-500 py-10">No document to display.</p>
        )}
      </div>
    </Modal>
  );
};

export default DocumentViewerModal;
