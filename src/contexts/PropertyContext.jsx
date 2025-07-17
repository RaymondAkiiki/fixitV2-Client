import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import * as propertyService from "../services/propertyService.js"; // Corrected import path
import { useAuth } from "./AuthContext.jsx"; // Corrected import path
import { useGlobalAlert } from "./GlobalAlertContext.jsx"; // For showing alerts

const PropertyContext = createContext();

export const PropertyProvider = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // isAuthenticated is now a boolean
  const { showError } = useGlobalAlert();
  const [properties, setProperties] = useState([]);
  const [current, setCurrent] = useState(null); // The currently selected property
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshProperties = useCallback(async () => {
    // Only fetch if authenticated and auth data is loaded
    // Use isAuthenticated directly as it's a boolean
    if (!isAuthenticated || authLoading) {
      setProperties([]);
      setCurrent(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // getAllProperties handles filtering by user's associated properties on the backend
      const res = await propertyService.getAllProperties(); // Corrected function name
      setProperties(res); // Assuming res is directly the array of properties
      
      // If there are properties and no current property is selected, set the first one as current
      if (res.length > 0 && !current) {
        setCurrent(res[0]);
      } else if (res.length === 0) {
        setCurrent(null);
      } else if (current && !res.some(p => p._id === current._id)) {
        // If current property is no longer in the list (e.g., deleted or access revoked)
        setCurrent(res[0] || null); // Set to first available or null
      }

    } catch (err) {
      console.error("Could not load properties:", err);
      setError("Could not load properties.");
      showError("Failed to load properties. " + (err.message || "Please try again."));
      setProperties([]);
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading, current, showError]); // isAuthenticated is already a dependency

  // Fetch properties when user or auth state changes
  useEffect(() => {
    refreshProperties();
  }, [refreshProperties]);

  // Function to manually select a property
  const selectProperty = useCallback((propertyId) => {
    const prop = properties.find((p) => p._id === propertyId);
    setCurrent(prop || null);
  }, [properties]);

  // Value provided by the context
  const value = {
    properties,
    current,
    loading,
    error,
    refreshProperties, // Expose refresh function
    selectProperty,
    setCurrent, // Allow direct setting of current property if needed
    setProperties, // Allow direct manipulation if needed (e.g., after add/update)
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};