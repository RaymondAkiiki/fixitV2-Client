// frontend/src/components/common/Modal.jsx
import React from 'react';
import { X } from 'lucide-react';

/**
 * A generic modal wrapper component.
 * All other specific modals should use this as their base.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} props.title - The title displayed at the top of the modal.
 * @param {React.ReactNode} props.children - The content to be rendered inside the modal body.
 * @param {string} [props.className] - Additional Tailwind CSS classes for the modal content area.
 * @param {string} [props.titleClassName] - Additional Tailwind CSS classes for the modal title.
 */
const Modal = ({ isOpen, onClose, title, children, className = '', titleClassName = '' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
      onClick={onClose} // Allows clicking outside to close
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto my-8 transform transition-all sm:align-middle ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing modal
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className={`text-xl font-semibold text-gray-800 ${titleClassName}`}>{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;


// import React, { useEffect } from 'react';
// import { X } from 'lucide-react';

// const Modal = ({ isOpen, onClose, title, children }) => {
//     useEffect(() => {
//         const handleEsc = (event) => {
//             if (event.keyCode === 27) {
//                 onClose();
//             }
//         };
//         window.addEventListener('keydown', handleEsc);

//         return () => {
//             window.removeEventListener('keydown', handleEsc);
//         };
//     }, [onClose]);

//     if (!isOpen) return null;

//     return (
//         // Backdrop
//         <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
//             onClick={onClose} // Close modal on backdrop click
//         >
//             {/* Modal Container */}
//             <div
//                 className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg m-8 flex flex-col"
//                 // This formula ensures the modal has padding and can scroll
//                 style={{ maxHeight: 'calc(100vh - 4rem)' }} 
//                 onClick={e => e.stopPropagation()} // Prevent click from bubbling to backdrop
//             >
//                 {/* Modal Header */}
//                 <div className="flex justify-between items-center p-4 border-b border-gray-200">
//                     <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
//                     <button
//                         onClick={onClose}
//                         className="text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full p-1.5 transition-colors"
//                         aria-label="Close modal"
//                     >
//                         <X size={24} />
//                     </button>
//                 </div>

//                 {/* Modal Body with Scrolling */}
//                 <div className="p-6 overflow-y-auto">
//                     {children}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Modal;