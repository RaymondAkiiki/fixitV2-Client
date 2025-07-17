import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import * as propertyService from "../services/propertyService.js";
import { useAuth } from "./AuthContext.jsx";
import { useGlobalAlert } from "./GlobalAlertContext.jsx";

const PropertyContext = createContext();

export const PropertyProvider = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();
  const { showError } = useGlobalAlert();
  const [properties, setProperties] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ FIX: `current` has been removed from the dependency array.
  const refreshProperties = useCallback(async (signal) => {
    if (!isAuthenticated) {
      setProperties([]);
      setCurrent(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await propertyService.getAllProperties({}, signal);
      const fetchedProperties = Array.isArray(res) ? res : (res.properties || []);
      setProperties(fetchedProperties);
      
      // ✅ FIX: Use the functional update form of `setCurrent` to avoid needing `current` as a dependency.
      // This allows us to access the previous value of `current` without creating a loop.
      setCurrent(prevCurrent => {
        if (fetchedProperties.length > 0 && !prevCurrent) {
          return fetchedProperties[0];
        }
        if (fetchedProperties.length === 0) {
          return null;
        }
        if (prevCurrent && !fetchedProperties.some(p => p._id === prevCurrent._id)) {
          return fetchedProperties[0] || null;
        }
        // If the current property still exists, keep it.
        return prevCurrent;
      });

    } catch (err) {
      // This check correctly ignores intentional cancellations.
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error("Could not load properties:", err);
        setError("Could not load properties.");
        showError("Failed to load properties. " + (err.message || "Please try again."));
        setProperties([]);
        setCurrent(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showError]); // `current` is removed from here.

  useEffect(() => {
    const controller = new AbortController();
    if (!authLoading) {
      refreshProperties(controller.signal);
    }
    return () => {
      controller.abort();
    };
  }, [authLoading, isAuthenticated, refreshProperties]);

  const selectProperty = useCallback((propertyId) => {
    const prop = properties.find((p) => p._id === propertyId);
    setCurrent(prop || null);
  }, [properties]);

  const value = useMemo(() => ({
    properties,
    current,
    loading,
    error,
    refreshProperties,
    selectProperty,
    setCurrent,
    setProperties,
  }), [properties, current, loading, error, refreshProperties, selectProperty]);

  return (
    <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};