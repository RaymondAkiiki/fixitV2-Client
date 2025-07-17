import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import * as leaseService from "../services/leaseService.js";
import { useAuth } from "./AuthContext.jsx";
import { useProperty } from "./PropertyContext.jsx";

const LeaseContext = createContext();

export const LeaseProvider = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { current: currentProperty, loading: propertyLoading } = useProperty();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshLeases = useCallback(async (signal) => {
    if (!isAuthenticated) {
      setLeases([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = {};
      if (currentProperty) {
        params.propertyId = currentProperty._id;
      } else if (user?.role === 'tenant') {
        params.tenantId = user._id;
      }

      const res = await leaseService.getLeases(params, signal);
      setLeases(res.data || []);
    } catch (err) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error("Could not load leases:", err);
        setError("Could not load leases.");
        setLeases([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id, user?.role, currentProperty?._id]);

  useEffect(() => {
    const controller = new AbortController();
    if (!authLoading && !propertyLoading) {
      refreshLeases(controller.signal);
    }
    return () => {
      controller.abort();
    };
  }, [authLoading, propertyLoading, refreshLeases]);

  const value = useMemo(() => ({
    leases,
    loading,
    error,
    refreshLeases,
    setLeases,
  }), [leases, loading, error, refreshLeases]);

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