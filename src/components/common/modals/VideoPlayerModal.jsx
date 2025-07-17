// frontend/src/components/common/modals/VideoPlayerModal.jsx
import React from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path

// Branding colors (not directly used in this component, but for consistency)
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for playing videos.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} props.videoUrl - The URL of the video to play.
 * @param {string} [props.title="Video Player"] - The title of the modal.
 */
const VideoPlayerModal = ({ isOpen, onClose, videoUrl, title = "Video Player" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-4xl">
      <div className="p-2 flex justify-center items-center bg-black rounded-lg">
        {videoUrl ? (
          <video controls className="w-full max-h-[80vh] rounded-md">
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <p className="text-gray-400 py-10">No video to play.</p>
        )}
      </div>
    </Modal>
  );
};

export default VideoPlayerModal;
