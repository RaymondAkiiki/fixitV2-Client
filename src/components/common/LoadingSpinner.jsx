// frontend/src/components/common/LoadingSpinner.jsx

import React from 'react';

/**
 * A customizable loading spinner component.
 *
 * @param {object} props - The component props.
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - The size of the spinner.
 * @param {string} [props.color='currentColor'] - The color of the spinner (Tailwind color class or hex).
 * @param {string} [props.className=''] - Additional Tailwind CSS classes for the spinner container.
 */
const LoadingSpinner = ({ size = 'md', color = 'currentColor', className = '' }) => {
  // Define size classes
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-4',
    xl: 'h-12 w-12 border-4',
  };

  // Determine border color style
  const borderColorStyle = color.startsWith('#') ? { borderColor: color, borderRightColor: 'transparent' } : {};
  const borderColorClass = color.startsWith('#') ? '' : `border-${color}-500 border-r-transparent`; // Assuming a Tailwind color like 'blue'

  return (
    <div
      className={`inline-block animate-spin rounded-full ${sizeClasses[size]} ${borderColorClass} ${className}`}
      style={borderColorStyle} // Apply inline style if color is a hex value
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
