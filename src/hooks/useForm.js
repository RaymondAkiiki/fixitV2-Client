import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form state, input changes, and validation.
 * @param {object} initialValues - The initial state of the form fields.
 * @param {function} validate - A function that returns an errors object.
 * @param {function} onSubmitCallback - An async function to call on successful submission.
 */
const useForm = (initialValues, validate, onSubmitCallback) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked, files } = e.target;
        const inputValue = type === 'checkbox' ? checked : (type === 'file' ? files : value);
        
        setValues(prev => ({ ...prev, [name]: inputValue }));

        // If the form has been submitted once, clear errors on change
        if (isSubmitted) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [isSubmitted]);

    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();
        
        setIsSubmitted(true);
        const validationErrors = validate(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            setIsSubmitting(true);
            try {
                await onSubmitCallback(values);
                // The calling component is responsible for success actions (like resetting the form or navigating).
            } catch {
                // The error is already handled by useApi and shown by GlobalAlertContext.
                // No need to log it again here. The component's catch block will see it.
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [values, validate, onSubmitCallback]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setIsSubmitting(false);
        setIsSubmitted(false);
    }, [initialValues]);

    return {
        values,
        errors,
        setValues,
        handleChange,
        handleSubmit,
        resetForm,
        isSubmitting,
    };
};

export default useForm;