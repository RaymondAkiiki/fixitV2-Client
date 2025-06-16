// frontend/src/components/common/Alert.jsx

import React from 'react';
import { XCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react'; // Icons from lucide-react

/**
 * Alert component for displaying various types of messages (success, error, info, warning).
 *
 * @param {object} props - Component props.
 * @param {string} props.message - The message to display.
 * @param {'success' | 'error' | 'info' | 'warning'} props.type - The type of alert, which dictates its color and icon.
 * @param {function} [props.onClose] - Optional callback function to close the alert, rendering a dismiss button.
 */
function Alert({ message, type = 'info', onClose }) {
  let bgColor, textColor, icon;

  switch (type) {
    case 'success':
      bgColor = 'bg-green-100 border-green-400';
      textColor = 'text-green-800';
      icon = <CheckCircle className="w-5 h-5" />;
      break;
    case 'error':
      bgColor = 'bg-red-100 border-red-400';
      textColor = 'text-red-800';
      icon = <XCircle className="w-5 h-5" />;
      break;
    case 'warning':
      // Using a shade close to #ffbd59 for warning background
      bgColor = 'bg-orange-100 border-orange-400';
      textColor = 'text-orange-800';
      icon = <TriangleAlert className="w-5 h-5" />;
      break;
    case 'info':
    default:
      // Using a shade of blue for general info, complementing the green/orange
      bgColor = 'bg-blue-100 border-blue-400';
      textColor = 'text-blue-800';
      icon = <Info className="w-5 h-5" />;
      break;
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg shadow-sm border ${bgColor} ${textColor} font-medium text-sm`}
      role="alert"
    >
      <div className="flex items-center">
        <span className="mr-3 flex-shrink-0">{icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-4 p-1 rounded-full hover:bg-opacity-75 transition-colors duration-150 flex-shrink-0 ${textColor.replace('text-', 'bg-').replace('-800', '-200')} `}
          aria-label="Dismiss alert"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Alert;
