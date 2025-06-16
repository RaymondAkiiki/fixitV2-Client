
// frontend/src/contexts/GlobalAlertContext.jsx

// This context provides a global mechanism for displaying alert messages (success, error, info).
// It's useful for showing transient feedback to the user after an action.

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

// Create the GlobalAlertContext
export const GlobalAlertContext = createContext();

/**
 * GlobalAlertProvider component
 * Provides alert state and functions to its children components.
 */
export const GlobalAlertProvider = ({ children }) => {
    // State to manage the current alert message and its type
    const [alert, setAlert] = useState(null); // { message: '...', type: 'success' | 'error' | 'info' }
    const [timeoutId, setTimeoutId] = useState(null);

    /**
     * Displays an alert message.
     * @param {string} message - The message to display.
     * @param {'success' | 'error' | 'info'} type - The type of alert.
     * @param {number} [duration=5000] - How long the alert should be visible in milliseconds.
     */
    const showAlert = useCallback((message, type = 'info', duration = 5000) => {
        // Clear any existing timeout to prevent multiple alerts overlapping
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        setAlert({ message, type });

        // Set a new timeout to clear the alert after the specified duration
        const id = setTimeout(() => {
            setAlert(null);
            setTimeoutId(null);
        }, duration);
        setTimeoutId(id);
    }, [timeoutId]);

    /**
     * Shortcut for displaying a success alert.
     * @param {string} message - The success message.
     * @param {number} [duration] - Optional duration.
     */
    const showSuccess = useCallback((message, duration) => showAlert(message, 'success', duration), [showAlert]);

    /**
     * Shortcut for displaying an error alert.
     * @param {string} message - The error message.
     * @param {number} [duration] - Optional duration.
     */
    const showError = useCallback((message, duration) => showAlert(message, 'error', duration), [showAlert]);

    /**
     * Shortcut for displaying an info alert.
     * @param {string} message - The info message.
     * @param {number} [duration] - Optional duration.
     */
    const showInfo = useCallback((message, duration) => showAlert(message, 'info', duration), [showAlert]);

    /**
     * Clears the currently displayed alert.
     */
    const clearAlert = useCallback(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setAlert(null);
    }, [timeoutId]);


    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);


    // Value provided by the context
    const alertContextValue = {
        alert,
        showAlert,
        showSuccess,
        showError,
        showInfo,
        clearAlert,
    };

    return (
        <GlobalAlertContext.Provider value={alertContextValue}>
            {children}
            {/* Optional: Render a global alert component here */}
            {alert && (
                <div
                    className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
                        alert.type === 'success' ? 'bg-green-500 text-white' :
                        alert.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                    }`}
                    role="alert"
                >
                    {alert.message}
                    <button
                        onClick={clearAlert}
                        className="ml-4 font-bold text-lg leading-none"
                        aria-label="Close alert"
                    >&times;</button>
                </div>
            )}
        </GlobalAlertContext.Provider>
    );
};

// Custom hook to easily consume the GlobalAlertContext
export const useGlobalAlert = () => {
    const context = useContext(GlobalAlertContext);
    if (context === undefined) {
        throw new Error('useGlobalAlert must be used within a GlobalAlertProvider');
    }
    return context;
};

