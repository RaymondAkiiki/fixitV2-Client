// frontend/src/hooks/useApi.js

// This custom hook provides a standardized way to make API calls using the configured Axios instance,
// handling loading states and errors. It relies on the Axios interceptor for authorization.

import { useState, useCallback } from 'react';
import api from '../api/axios'; // Import the configured Axios instance
import { useGlobalAlert } from '../contexts/GlobalAlertContext.jsx'; // For showing global alerts

/**
 * Custom hook for making API requests.
 * @returns {object} An object containing:
 * - `data`: The data returned from the API.
 * - `isLoading`: Boolean indicating if a request is in progress.
 * - `error`: Any error object returned from the request (after `axios.js` interceptor processing).
 * - `makeRequest`: A function to initiate an API request.
 * - `resetState`: A function to reset data, loading, and error states.
 */
const useApi = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showError } = useGlobalAlert(); // Access showError from GlobalAlertContext

    /**
     * Resets the hook's state (data, isLoading, error).
     */
    const resetState = useCallback(() => {
        setData(null);
        setIsLoading(false);
        setError(null);
    }, []);

    /**
     * Function to make an API request using the pre-configured Axios instance.
     * Authorization is handled by the Axios request interceptor.
     * @param {string} method - HTTP method (e.g., 'get', 'post', 'put', 'delete', 'patch').
     * @param {string} url - The API endpoint path (e.g., '/auth/login', '/requests').
     * This URL should NOT include '/api' prefix as it's handled by axios.baseURL.
     * @param {object|FormData|null} [body=null] - The request body for POST/PUT/PATCH methods.
     * Can be an object or FormData.
     * @param {object|null} [params=null] - URL parameters for GET requests.
     * @param {object} [headers={}] - Additional custom headers for this specific request.
     * @returns {Promise<any>} A promise that resolves with the response data.
     */
    const makeRequest = useCallback(async (
        method,
        url,
        body = null,
        params = null,
        headers = {},
    ) => {
        setIsLoading(true);
        setError(null);
        setData(null); // Clear previous data

        try {
            const config = {
                method,
                url, // Corrected: url should directly be the endpoint path, without '/api'
                headers: {
                    // Axios automatically sets Content-Type for FormData,
                    // otherwise default to application/json
                    'Content-Type': body instanceof FormData ? undefined : 'application/json',
                    ...headers,
                },
                data: body, // For POST/PUT/PATCH
                params: params, // For GET
            };

            const response = await api(config); // Use the imported 'api' instance
            setData(response.data);
            return response.data; // Return data for direct use by caller
        } catch (err) {
            console.error('API request failed in useApi hook:', err);
            setError(err);
            // The axios interceptor handles global 401 errors.
            // For other errors, display a more specific message if available.
            if (err.response && err.response.data && err.response.data.message) {
                showError(err.response.data.message);
            } else if (err.message) {
                showError(err.message);
            } else {
                showError('An unexpected error occurred during API request.');
            }
            throw err; // Re-throw to propagate the error to the component
        } finally {
            setIsLoading(false);
        }
    }, [showError]); // Dependencies for useCallback

    return { data, isLoading, error, makeRequest, resetState };
};

export default useApi;


// frontend/src/hooks/useAuth.js

// This hook provides convenient access to the authentication context.
// It's a wrapper around useContext(AuthContext) to enforce its usage within AuthProvider.

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx'; // Ensure .jsx extension for React components

/**
 * Custom hook to access the authentication context.
 * Throws an error if used outside of an AuthProvider.
 * @returns {object} The authentication context value (user, isAuthenticated, login, logout, register, loading, hasRole, hasAnyRole).
 */
const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        // This ensures the hook is only used within the AuthProvider's scope.
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

export default useAuth;

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


// frontend/src/hooks/useForm.js

// This custom hook manages form state, handles input changes, and performs validation.
// It simplifies working with forms in React components.

import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing form state and validation.
 * @param {object} initialValues - The initial values for the form fields.
 * @param {function} validate - A function that takes form values and returns an errors object.
 * E.g., `(values) => { const errors = {}; if (!values.name) errors.name = 'Required'; return errors; }`
 * @param {function} onSubmitCallback - An async function to be called on successful form submission.
 * @returns {object} An object containing:
 * - `values`: The current state of form inputs.
 * - `errors`: An object containing validation errors for each field.
 * - `handleChange`: Event handler for input changes.
 * - `handleSubmit`: Function to handle form submission.
 * - `resetForm`: Function to reset the form to initial values.
 * - `setValues`: Direct setter for values (useful for pre-populating forms).
 * - `isSubmitting`: Boolean indicating if the form is currently submitting.
 */
const useForm = (initialValues, validate, onSubmitCallback) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false); // New state to track if submission was attempted

    // Update initial values if they change (e.g., when editing an existing item)
    useEffect(() => {
        setValues(initialValues);
    }, [initialValues]);

    // Handles changes to form input fields
    const handleChange = useCallback((e) => {
        const { name, value, type, checked, files } = e.target;
        setValues(prevValues => ({
            ...prevValues,
            [name]: type === 'checkbox' ? checked : (type === 'file' ? files : value),
        }));

        // Clear error for the field being changed if submission was attempted
        if (isSubmitted && errors[name]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors, isSubmitted]);

    // Handles form submission
    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault(); // Prevent default form submission if event is provided
        setIsSubmitting(true);
        setIsSubmitted(true); // Mark that submission has been attempted

        const validationErrors = validate(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            // If no validation errors, call the provided callback function
            try {
                await onSubmitCallback(values);
                // After successful submission, you might want to reset the form or handle success
                // resetForm(); // Optional: reset form after success
            } catch (err) {
                console.error('Form submission callback failed:', err);
                // Errors from callback (e.g., API errors) are typically handled by useApi or GlobalAlertContext
            }
        }
        setIsSubmitting(false);
    }, [values, validate, onSubmitCallback]);

    // Resets the form to its initial values
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setIsSubmitting(false);
        setIsSubmitted(false);
    }, [initialValues]);

    return {
        values,
        errors,
        handleChange,
        handleSubmit,
        resetForm,
        setValues, // Expose setValues for direct manipulation if needed (e.g., when loading existing data)
        isSubmitting,
    };
};

export default useForm;