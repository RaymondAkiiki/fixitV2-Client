import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import * as leaseService from "../services/leaseService.js"; // Corrected import path
import { useAuth } from "./AuthContext.jsx"; // Corrected import path
import { useProperty } from "./PropertyContext.jsx"; // Corrected import path

const LeaseContext = createContext();

export const LeaseProvider = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // isAuthenticated is now a boolean
  const { current: currentProperty } = useProperty(); // Get currently selected property
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshLeases = useCallback(async () => {
    // Use isAuthenticated directly as it's a boolean
    if (!isAuthenticated || authLoading) {
      setLeases([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Fetch leases based on current property or user's properties
      const params = {};
      if (currentProperty) {
        params.propertyId = currentProperty._id;
      } else if (user?.propertiesOwned?.length > 0) {
        // If no specific property selected, fetch for all owned properties (or managed)
        // This logic might need refinement based on how you want to display initial leases
        // For simplicity, let's assume fetching all for now if no currentProperty
        // Or, you might default to the first owned/managed property
      } else if (user?.tenancies?.length > 0) {
        // If user is a tenant, fetch leases for their tenancies
        params.tenantId = user._id; // Assuming backend can filter by tenantId
      }

      const res = await leaseService.getLeases(params); // Use getLeases with params
      setLeases(res.data);
    } catch (err) {
      console.error("Could not load leases:", err);
      setError("Could not load leases.");
      setLeases([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading, currentProperty]); // isAuthenticated is already a dependency

  // Fetch leases when user or currentProperty changes
  useEffect(() => {
    refreshLeases();
  }, [refreshLeases]);

  const value = {
    leases,
    loading,
    error,
    refreshLeases, // Expose refresh function
    setLeases, // Allow direct manipulation if needed (e.g., after add/update)
  };

  return (
    <LeaseContext.Provider value={value}>{children}</LeaseContext.Provider>
  );
};

export const useLease = () => {
  const context = useContext(LeaseContext);
  if (context === undefined) {
    throw new Error('useLease must be used within a LeaseProvider');
  }
  return context;
};