// frontend/src/components/common/Spinner.jsx

import React from 'react';

/**
 * Reusable Spinner component for loading indications.
 *
 * @param {object} props - Component props.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - The size of the spinner.
 * @param {string} [props.color='currentColor'] - The CSS color value for the spinner.
 * @param {string} [props.className=''] - Additional Tailwind CSS classes for custom styling.
 */
function Spinner({ size = 'md', color = 'currentColor', className = '' }) {
  let spinnerSize;
  let borderWidth;

  switch (size) {
    case 'sm':
      spinnerSize = 'w-4 h-4';
      borderWidth = 'border-2';
      break;
    case 'lg':
      spinnerSize = 'w-10 h-10';
      borderWidth = 'border-4';
      break;
    case 'md':
    default:
      spinnerSize = 'w-6 h-6';
      borderWidth = 'border-3'; // Tailwind doesn't have border-3, will be custom or 2/4
      break;
  }

  // Custom border width for 'md' if border-3 is desired, otherwise default to border-2 or border-4
  const actualBorderWidth = borderWidth === 'border-3' ? 'border-2' : borderWidth; // Default to border-2 if 3 isn't available via standard tailwind

  // For custom color, use style directly
  const spinnerColor = color === 'currentColor' ? 'border-current' : `border-${color}`; // Tailwind class or direct style

  return (
    <div
      className={`
        ${spinnerSize} ${actualBorderWidth} border-solid rounded-full animate-spin
        ${spinnerColor}
        border-t-transparent
        ${className}
      `}
      style={{ borderColor: color !== 'currentColor' ? `${color} transparent transparent transparent` : undefined }}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Spinner;
