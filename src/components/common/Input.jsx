import React from 'react';

/**
 * Reusable Input component with label, helper/info text, and error handling.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - The label for the input field.
 * @param {string} props.id - The unique ID for the input, used for htmlFor and name.
 * @param {string} [props.type='text'] - The HTML input type.
 * @param {string} props.value - The current value of the input.
 * @param {function} props.onChange - Callback function for input value changes.
 * @param {string} [props.placeholder=''] - Placeholder text for the input.
 * @param {boolean} [props.required=false] - If true, marks the input as required.
 * @param {string} [props.className=''] - Additional classes for styling.
 * @param {string} [props.error=''] - Error message to display below the input.
 * @param {boolean} [props.disabled=false] - If true, the input is disabled.
 * @param {number} [props.min] - Minimum value for number/date inputs.
 * @param {number} [props.max] - Maximum value for number/date inputs.
 * @param {string} [props.infoText] - Helper/info text to display below the input.
 */
function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',
  error = '',
  disabled = false,
  min,
  max,
  infoText, // <- ADD THIS HERE
  ...rest // Do NOT include infoText in ...rest
}) {
  const baseInputStyles = `
    mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm
    focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#219377] focus:ring-green-200'}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}
    font-inter
  `;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={name || id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className={baseInputStyles}
        {...rest}
      />
      {/* Render infoText below input, if present */}
      {infoText && <p className="mt-1 text-xs text-gray-500">{infoText}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default Input;