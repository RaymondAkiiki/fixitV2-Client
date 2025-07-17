// frontend/src/hooks/useDebounce.js

// This custom hook debounces a value, delaying its update until a specified time
// has passed since the last change. Useful for optimizing performance on inputs
// like search bars to prevent excessive API calls.

import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value.
 * @param {any} value - The value to debounce.
 * @param {number} delay - The delay in milliseconds after which the debounced value will update.
 * @returns {any} The debounced value.
 */
const useDebounce = (value, delay) => {
    // State to store the debounced value
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup function:
        // This will be called if the value or delay changes before the timeout fires,
        // or when the component unmounts. This clears the previous timer.
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Only re-run if value or delay changes

    return debouncedValue;
};

export default useDebounce;
