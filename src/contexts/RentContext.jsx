import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import * as rentService from "../services/rentService.js";
import { useLease } from "./LeaseContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { useGlobalAlert } from './GlobalAlertContext.jsx';

const RentContext = createContext();

export const RentProvider = ({ children }) => {
    const { leases, loading: leasesLoading } = useLease();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { showError, showSuccess } = useGlobalAlert();

    const [rents, setRents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRents = useCallback(async (signal) => {
        if (!isAuthenticated) {
            setRents([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const params = {};
            // Example of filtering by leases if your backend supports it
            // This check is now more stable.
            if (leases && leases.length > 0) {
                // params.leaseIds = leases.map(l => l._id);
            }

            const response = await rentService.getRentEntries(params, signal);
            setRents(response.data || []);
            // Avoid showing success message on every background fetch
            // showSuccess('Rent data loaded successfully!'); 
        } catch (err) {
            if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
                const message = err.response?.data?.message || "Could not load payments. Please try again.";
                showError(message);
                console.error("RentContext - Could not load payments:", err);
                setError(err);
                setRents([]);
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, leases, showError]); // Dependencies are more stable now

    useEffect(() => {
        const controller = new AbortController();
        // Wait for auth and leases to be ready before fetching
        if (!authLoading && !leasesLoading) {
            fetchRents(controller.signal);
        }
        return () => {
            controller.abort();
        };
    }, [authLoading, leasesLoading, fetchRents]);

    const contextValue = useMemo(() => ({
        rents,
        loading,
        error,
        refreshRents: fetchRents,
    }), [rents, loading, error, fetchRents]);

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