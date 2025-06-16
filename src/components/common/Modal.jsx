import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return (
        // Backdrop
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
            onClick={onClose} // Close modal on backdrop click
        >
            {/* Modal Container */}
            <div
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg m-8 flex flex-col"
                // This formula ensures the modal has padding and can scroll
                style={{ maxHeight: 'calc(100vh - 4rem)' }} 
                onClick={e => e.stopPropagation()} // Prevent click from bubbling to backdrop
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full p-1.5 transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body with Scrolling */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
