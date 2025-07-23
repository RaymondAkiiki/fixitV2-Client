// src/hooks/useProperties.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as propertyService from '../services/propertyService';
import useAuth from './useAuth';
import { useGlobalAlert } from '../contexts/GlobalAlertContext';

/**
 * Hook for fetching a list of properties
 * @param {Object} options - Query options
 * @param {Object} options.filters - Filter parameters
 * @returns {Object} Query result with properties data
 */
export const useProperties = (options = {}) => {
  const { isAuthenticated } = useAuth();
  const { showError } = useGlobalAlert();
  const { filters = {} } = options;

  return useQuery({
    queryKey: ['properties', filters],
    queryFn: ({ signal }) => propertyService.getAllProperties(filters, signal),
    enabled: isAuthenticated,
    onError: (error) => {
      console.error("Failed to fetch properties:", error);
      showError("Failed to load properties. " + (error.message || "Please try again."));
    },
    // Already properly formatted by the service
  });
};

/**
 * Hook for fetching a single property by ID
 * @param {string} propertyId - Property ID to fetch
 * @returns {Object} Query result with property data
 */
export const useProperty = (propertyId) => {
  const { isAuthenticated } = useAuth();
  const { showError } = useGlobalAlert();

  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: ({ signal }) => propertyService.getPropertyById(propertyId, signal),
    enabled: isAuthenticated && !!propertyId,
    onError: (error) => {
      console.error(`Failed to fetch property ${propertyId}:`, error);
      showError("Failed to load property details. " + (error.message || "Please try again."));
    },
    select: (data) => propertyService.formatProperty(data),
  });
};

/**
 * Hook that provides property mutation operations
 */
export const usePropertyMutations = () => {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalAlert();

  // Create property mutation
  const createProperty = useMutation({
    mutationFn: (propertyData) => propertyService.createProperty(propertyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      showSuccess("Property created successfully!");
    },
    onError: (error) => {
      console.error("Failed to create property:", error);
      showError("Failed to create property. " + (error.message || "Please try again."));
    }
  });

  // Update property mutation
  const updateProperty = useMutation({
    mutationFn: ({ propertyId, propertyData }) => 
      propertyService.updateProperty(propertyId, propertyData),
    onSuccess: (data, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      showSuccess("Property updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update property:", error);
      showError("Failed to update property. " + (error.message || "Please try again."));
    }
  });

  // Delete property mutation
  const deleteProperty = useMutation({
    mutationFn: (propertyId) => propertyService.deleteProperty(propertyId),
    onSuccess: (data, propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      showSuccess("Property deleted successfully!");
    },
    onError: (error) => {
      console.error("Failed to delete property:", error);
      showError("Failed to delete property. " + (error.message || "Please try again."));
    }
  });

  // Assign user to property mutation
  const assignUserToProperty = useMutation({
    mutationFn: ({ propertyId, userId, roles, unitId = null }) => 
      propertyService.assignUserToProperty(propertyId, userId, roles, unitId),
    onSuccess: (data, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      showSuccess("User assigned successfully!");
    },
    onError: (error) => {
      console.error("Failed to assign user:", error);
      showError("Failed to assign user. " + (error.message || "Please try again."));
    }
  });

  // Remove user from property mutation
  const removeUserFromProperty = useMutation({
    mutationFn: ({ propertyId, userId, roles, unitId = null }) => 
      propertyService.removeUserFromProperty(propertyId, userId, roles, unitId),
    onSuccess: (data, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      showSuccess("User removed successfully!");
    },
    onError: (error) => {
      console.error("Failed to remove user:", error);
      showError("Failed to remove user. " + (error.message || "Please try again."));
    }
  });

  return {
    createProperty: createProperty.mutate,
    isCreating: createProperty.isPending,
    updateProperty: updateProperty.mutate,
    isUpdating: updateProperty.isPending,
    deleteProperty: deleteProperty.mutate,
    isDeleting: deleteProperty.isPending,
    assignUserToProperty: assignUserToProperty.mutate,
    isAssigning: assignUserToProperty.isPending,
    removeUserFromProperty: removeUserFromProperty.mutate,
    isRemoving: removeUserFromProperty.isPending
  };
};