// frontend/src/hooks/useForm.js

// This custom hook manages form state, handles input changes, and performs validation.
// It simplifies working with forms in React components.

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form state and validation.
 * @param {object} initialValues - The initial values for the form fields.
 * @param {function} validate - A function that takes form values and returns an errors object.
 * E.g., `(values) => { const errors = {}; if (!values.name) errors.name = 'Required'; return errors; }`
 * @returns {object} An object containing:
 * - `values`: The current state of form inputs.
 * - `errors`: An object containing validation errors for each field.
 * - `handleChange`: Event handler for input changes.
 * - `handleSubmit`: Function to handle form submission.
 * - `resetForm`: Function to reset the form to initial values.
 * - `setValues`: Direct setter for values (useful for pre-populating forms).
 */
const useForm = (initialValues, validate) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handles changes to form input fields
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setValues(prevValues => ({
            ...prevValues,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error for the field being changed
        if (errors[name]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]); // Dependency on errors to correctly clear them

    // Handles form submission
    const handleSubmit = useCallback(async (callback) => {
        setIsSubmitting(true);
        const validationErrors = validate(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            // If no validation errors, call the provided callback function
            try {
                await callback(values);
                // After successful submission, you might want to reset the form or handle success
                // resetForm(); // Optional: reset form after success
            } catch (err) {
                console.error('Form submission callback failed:', err);
                // Handle errors from the callback (e.g., API errors)
                // You might set a global alert here or update a specific form error state
            }
        }
        setIsSubmitting(false);
    }, [values, validate]);

    // Resets the form to its initial values
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setIsSubmitting(false);
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