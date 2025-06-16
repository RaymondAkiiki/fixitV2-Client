// frontend/src/components/common/Button.jsx

import React from 'react';
import Spinner from './Spinner'; // Assuming Spinner component exists for loading state

/**
 * Reusable Button component with different styles and states.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content inside the button (text, icon, etc.).
 * @param {function} props.onClick - Click event handler.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - Button type attribute.
 * @param {'primary' | 'secondary' | 'danger' | 'outline'} [props.variant='primary'] - Visual style of the button.
 * @param {string} [props.className=''] - Additional Tailwind CSS classes for custom styling.
 * @param {boolean} [props.disabled=false] - If true, the button is disabled.
 * @param {boolean} [props.loading=false] - If true, shows a loading spinner and disables the button.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button size (padding and font).
 */
function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  size = 'md',
}) {
  let baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50';
  let variantStyles = '';
  let sizeStyles = '';

  // Size styles
  switch (size) {
    case 'sm':
      sizeStyles = 'px-3 py-1.5 text-sm';
      break;
    case 'lg':
      sizeStyles = 'px-6 py-3 text-lg';
      break;
    case 'md':
    default:
      sizeStyles = 'px-5 py-2.5 text-base';
      break;
  }

  // Variant styles
  switch (variant) {
    case 'primary':
      // Using #219377 for primary background, a darker shade for hover
      variantStyles = 'bg-[#219377] text-white hover:bg-green-800 focus:ring-green-500 shadow-md';
      break;
    case 'secondary':
      // Using #ffbd59 for secondary background, a darker shade for hover
      variantStyles = 'bg-[#ffbd59] text-gray-900 hover:bg-orange-600 focus:ring-orange-500 shadow-md';
      break;
    case 'danger':
      variantStyles = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md';
      break;
    case 'outline':
      // Outline with #219377 border and text, green background on hover
      variantStyles = 'border-2 border-[#219377] text-[#219377] hover:bg-green-50 hover:text-green-800 focus:ring-green-500';
      break;
    default:
      break;
  }

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      disabled={isDisabled}
    >
      {loading && <Spinner size="sm" color="white" className="mr-2" />}
      {children}
    </button>
  );
}

export default Button;
