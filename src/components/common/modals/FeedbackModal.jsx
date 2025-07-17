// frontend/src/components/common/modals/FeedbackModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import LoadingSpinner from '../LoadingSpinner.jsx'; // Ensure correct path
import { Star } from 'lucide-react';

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

/**
 * A modal for submitting feedback with a star rating and comment.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {function} props.onSubmit - Function to call with the submitted rating and comment.
 * @param {string} [props.title="Submit Feedback"] - The title of the modal.
 * @param {boolean} [props.loading=false] - Indicates if the submission is in progress.
 * @param {string} [props.error] - An error message to display.
 * @param {number} [props.initialRating=0] - Initial rating value.
 * @param {string} [props.initialComment=""] - Initial comment value.
 */
const FeedbackModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Submit Feedback",
  loading = false,
  error,
  initialRating = 0,
  initialComment = ""
}) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
    setLocalError(''); // Clear local error on open/initial load
  }, [isOpen, initialRating, initialComment]); // Reset when modal opens or initial values change

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (rating === 0) {
      setLocalError("Please provide a rating (1-5 stars).");
      return;
    }
    onSubmit(rating, comment);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="p-4">
        {(error || localError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error || localError}</span>
          </div>
        )}

        <p className="mb-4 text-gray-700">
          How would you rate the resolution of this request?
        </p>
        <div className="flex space-x-1 mb-6 justify-center">
          {[1, 2, 3, 4, 5].map((starValue) => (
            <button
              key={starValue}
              type="button"
              onClick={() => setRating(starValue)}
              className={`text-4xl transition-colors duration-200 ${
                rating >= starValue ? "text-yellow-400" : "text-gray-300"
              } hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50`}
              disabled={loading}
              aria-label={`${starValue} star rating`}
            >
              <Star fill="currentColor" className="w-10 h-10" />
            </button>
          ))}
        </div>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-28 resize-y text-gray-800"
          placeholder="Optional comments..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
        ></textarea>
        <div className="mt-6 flex justify-end space-x-3">
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
            disabled={loading || rating === 0}
          >
            {loading ? <LoadingSpinner size="sm" color="white" /> : "Submit Feedback"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedbackModal;
