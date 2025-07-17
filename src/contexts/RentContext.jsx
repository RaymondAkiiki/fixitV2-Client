// frontend/src/contexts/RentContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import * as rentService from "../services/rentService.js";
import { useLease } from "./LeaseContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { useGlobalAlert } from './GlobalAlertContext.jsx';

const RentContext = createContext();

export const RentProvider = ({ children }) => {
    const { leases, loading: leasesLoading } = useLease();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { showError, showSuccess } = useGlobalAlert(); // Access showError and showSuccess

    const [rents, setRents] = useState([]);
    const [loading, setLoading] = useState(true); // Set initial loading to true
    const [error, setError] = useState(null); // Set initial error to null

    const fetchRents = useCallback(async (signal) => {
        // Guard against fetching if auth is not ready, not authenticated, or leases are still loading
        if (authLoading || !isAuthenticated || leasesLoading) {
            console.log('RentContext: Skipping fetch - Auth not ready, not authenticated, or leases loading.');
            setRents([]); // Clear rents if not authenticated or still loading
            setLoading(false); // Ensure loading is false if we skip
            setError(null); // Clear any previous errors
            return;
        }

        setLoading(true);
        setError(null); // Clear previous errors before a new fetch
        try {
            console.log('RentContext: Attempting to fetch rents...');
            const params = {};

            // If you need to filter rents by leases, ensure leases are loaded and available
            if (leases && leases.length > 0) {
                // Example: If your backend getRentEntries supports `leaseId` array, pass it:
                // params.leaseIds = leases.map(l => l._id);
                // Adjust this logic based on how your backend API for rents works.
                // For now, if no specific lease filtering is needed, it will fetch all rents
                // accessible to the authenticated user.
                console.log(`RentContext: Leases available (${leases.length}), fetching rents.`);
            } else {
                // If there are no leases, there might be no rents to fetch, or fetch all if applicable
                console.log('RentContext: No leases available, fetching all rents (if applicable) or none.');
                // Depending on your app logic, you might want to return here
                // if rents *must* be tied to leases.
                // For now, we'll proceed, allowing getRentEntries to potentially return empty or all.
            }

            const response = await rentService.getRentEntries(params, signal); // Pass the signal
            console.log('RentContext: Rents fetched successfully.', response);
            setRents(response.data || []); // Assuming response has a .data array
            showSuccess('Rent data loaded successfully!');
        } catch (err) {
            // Only show error if it's not due to an aborted request
            if (err.name === 'AbortError' || err.message === "Request Aborted") {
                console.log("Rent entries fetch aborted.");
            } else {
                const message = err.response?.data?.message || "Could not load payments. Please try again.";
                showError(message); // Use global alert for user feedback
                console.error("RentContext - Could not load payments:", err);
                setError(err); // Set error object for more detail if needed by consumers
            }
            setRents([]); // Clear rents on error or abort
        } finally {
            setLoading(false);
        }
    }, [leases, leasesLoading, isAuthenticated, authLoading, showError, showSuccess]); // Dependencies for useCallback

    // Effect to fetch rents when relevant dependencies change
    useEffect(() => {
        const controller = new AbortController(); // Create a new AbortController for this effect run
        const signal = controller.signal;

        // Call the memoized fetchRents function
        fetchRents(signal);

        // Cleanup function: This runs when the component unmounts or before the effect re-runs
        return () => {
            controller.abort(); // Abort any ongoing fetch requests
        };
    }, [fetchRents]); // Dependency array: fetchRents is stable due to useCallback

    // Memoize the context value to prevent unnecessary re-renders of consumers
    const contextValue = useMemo(() => ({
        rents,
        loading,
        error,
        refreshRents: fetchRents, // Corrected: Renamed from refreshRents to fetchRents
        // setRents, // Only expose if direct manipulation is truly necessary and safe
    }), [rents, loading, error, fetchRents]); // Corrected: Dependency is fetchRents

    return (
        <RentContext.Provider value={contextValue}>{children}</RentContext.Provider>
    );
};

export const useRent = () => {
    const context = useContext(RentContext);
    if (context === undefined) {
        throw new Error('useRent must be used within a RentProvider');
    }
    return context;
};
