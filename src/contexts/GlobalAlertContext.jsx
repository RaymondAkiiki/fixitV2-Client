// frontend/src/contexts/GlobalAlertContext.jsx

import React, { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef } from 'react';

// Create the GlobalAlertContext
export const GlobalAlertContext = createContext();

/**
 * GlobalAlertProvider component
 * Provides alert state and functions to its children components.
 */
export const GlobalAlertProvider = ({ children }) => {
    // State to manage the current alert message and its type
    const [alert, setAlert] = useState(null); // { message: '...', type: 'success' | 'error' | 'info' }

    // ✅ FIX: Use useRef for the timeout ID. Refs do not trigger re-renders on change.
    const timeoutIdRef = useRef(null);

    /**
     * Clears the currently displayed alert. This function is now stable.
     */
    const clearAlert = useCallback(() => {
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
        }
        setAlert(null);
    }, []); // No dependencies needed, so it's created only once.

    /**
     * Displays an alert message. This function is now stable.
     * @param {string} message - The message to display.
     * @param {'success' | 'error' | 'info'} type - The type of alert.
     * @param {number} [duration=5000] - How long the alert should be visible in milliseconds.
     */
    const showAlert = useCallback((message, type = 'info', duration = 5000) => {
        // Clear any existing timeout before showing a new one
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }

        setAlert({ message, type });

        // Set a new timeout and store its ID in the ref
        timeoutIdRef.current = setTimeout(() => {
            setAlert(null);
            timeoutIdRef.current = null;
        }, duration);
    }, []); // No dependencies needed, so it's created only once.

    /**
     * Shortcut for displaying a success alert. Stable because showAlert is stable.
     */
    const showSuccess = useCallback((message, duration) => showAlert(message, 'success', duration), [showAlert]);

    /**
     * Shortcut for displaying an error alert. Stable because showAlert is stable.
     */
    const showError = useCallback((message, duration) => showAlert(message, 'error', duration), [showAlert]);

    /**
     * Shortcut for displaying an info alert. Stable because showAlert is stable.
     */
    const showInfo = useCallback((message, duration) => showAlert(message, 'info', duration), [showAlert]);

    // Clean up timeout on unmount
    useEffect(() => {
        // Return a cleanup function that will be called when the provider unmounts
        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount

    // Value provided by the context - now memoized with stable functions
    const alertContextValue = useMemo(() => ({
        alert,
        showAlert,
        showSuccess,
        showError,
        showInfo,
        clearAlert,
    }), [alert, showAlert, showSuccess, showError, showInfo, clearAlert]);

    return (
        <GlobalAlertContext.Provider value={alertContextValue}>
            {children}
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