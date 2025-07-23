// src/hooks/useLeases.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as leaseService from '../services/leaseService';
import useAuth from './useAuth';
import { useGlobalAlert } from '../contexts/GlobalAlertContext';

/**
 * Hook for fetching a list of leases
 * @param {Object} options - Query options
 * @param {Object} options.filters - Filter parameters
 * @returns {Object} Query result with leases data
 */
export const useLeases = (options = {}) => {
  const { isAuthenticated, user } = useAuth();
  const { filters = {} } = options;
  
  // Add tenant filter if user is a tenant
  const queryFilters = { ...filters };
  if (user?.role === 'tenant' && !queryFilters.tenantId) {
    queryFilters.tenantId = user._id;
  }

  return useQuery({
    queryKey: ['leases', queryFilters],
    queryFn: ({ signal }) => leaseService.getLeases(queryFilters, signal),
    enabled: isAuthenticated,
    select: (response) => ({
      leases: response.data?.map(lease => leaseService.formatLease(lease)) || [],
      pagination: {
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 10,
        pages: response.pages || 1
      }
    }),
  });
};

/**
 * Hook for fetching a single lease by ID
 * @param {string} leaseId - Lease ID to fetch
 * @returns {Object} Query result with lease data
 */
export const useLease = (leaseId) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['lease', leaseId],
    queryFn: ({ signal }) => leaseService.getLeaseById(leaseId, signal),
    enabled: isAuthenticated && !!leaseId,
    select: (data) => leaseService.formatLease(data),
  });
};

/**
 * Hook for fetching expiring leases
 * @param {Object} options - Query options
 * @param {number} options.daysAhead - Days ahead to check for expiring leases
 * @param {string} options.propertyId - Property ID to filter by
 * @returns {Object} Query result with expiring leases data
 */
export const useExpiringLeases = (options = {}) => {
  const { isAuthenticated, user } = useAuth();
  const { daysAhead = 90, propertyId } = options;
  
  const params = { daysAhead };
  if (propertyId) params.propertyId = propertyId;
  if (user?.role === 'tenant') params.tenantId = user._id;

  return useQuery({
    queryKey: ['expiringLeases', params],
    queryFn: ({ signal }) => leaseService.getExpiringLeases(params, signal),
    enabled: isAuthenticated,
    select: (response) => response.data?.map(lease => leaseService.formatLease(lease)) || [],
  });
};

/**
 * Hook that provides lease mutation operations
 */
export const useLeaseMutations = () => {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalAlert();

  // Create lease mutation
  const createLease = useMutation({
    mutationFn: (leaseData) => leaseService.createLease(leaseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['expiringLeases'] });
      showSuccess("Lease created successfully!");
    },
    onError: (error) => {
      console.error("Failed to create lease:", error);
      showError("Failed to create lease. " + (error.message || "Please try again."));
    }
  });

  // Update lease mutation
  const updateLease = useMutation({
    mutationFn: ({ leaseId, updateData }) => 
      leaseService.updateLease(leaseId, updateData),
    onSuccess: (data, { leaseId }) => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['expiringLeases'] });
      showSuccess("Lease updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update lease:", error);
      showError("Failed to update lease. " + (error.message || "Please try again."));
    }
  });

  // Delete lease mutation
  const deleteLease = useMutation({
    mutationFn: (leaseId) => leaseService.deleteLease(leaseId),
    onSuccess: (data, leaseId) => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      showSuccess("Lease deleted successfully!");
    },
    onError: (error) => {
      console.error("Failed to delete lease:", error);
      showError("Failed to delete lease. " + (error.message || "Please try again."));
    }
  });

  // Mark renewal notice sent mutation
  const markRenewalNoticeSent = useMutation({
    mutationFn: (leaseId) => leaseService.markRenewalNoticeSent(leaseId),
    onSuccess: (data, leaseId) => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['expiringLeases'] });
      showSuccess("Renewal notice marked as sent!");
    },
    onError: (error) => {
      console.error("Failed to mark renewal notice:", error);
      showError("Failed to mark renewal notice. " + (error.message || "Please try again."));
    }
  });

  // Upload document mutation
  const uploadDocument = useMutation({
    mutationFn: ({ leaseId, file }) => leaseService.uploadLeaseDocument(leaseId, file),
    onSuccess: (data, { leaseId }) => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      showSuccess("Document uploaded successfully!");
    },
    onError: (error) => {
      console.error("Failed to upload document:", error);
      showError("Failed to upload document. " + (error.message || "Please try again."));
    }
  });

  // Add amendment mutation
  const addAmendment = useMutation({
    mutationFn: ({ leaseId, amendmentData }) => 
      leaseService.addLeaseAmendment(leaseId, amendmentData),
    onSuccess: (data, { leaseId }) => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      showSuccess("Amendment added successfully!");
    },
    onError: (error) => {
      console.error("Failed to add amendment:", error);
      showError("Failed to add amendment. " + (error.message || "Please try again."));
    }
  });

  return {
    createLease: createLease.mutate,
    isCreating: createLease.isPending,
    updateLease: updateLease.mutate,
    isUpdating: updateLease.isPending,
    deleteLease: deleteLease.mutate,
    isDeleting: deleteLease.isPending,
    markRenewalNoticeSent: markRenewalNoticeSent.mutate,
    isMarkingRenewalSent: markRenewalNoticeSent.isPending,
    uploadDocument: uploadDocument.mutate,
    isUploading: uploadDocument.isPending,
    addAmendment: addAmendment.mutate,
    isAddingAmendment: addAmendment.isPending
  };
};

/**
 * Utility functions for lease documents
 */
export const useLeaseDocuments = () => {
  const { showError, showSuccess } = useGlobalAlert();

  // Download document
  const downloadDocument = async (leaseId, documentId) => {
    try {
      const downloadInfo = await leaseService.getLeaseDocumentDownloadInfo(leaseId, documentId);
      await leaseService.downloadLeaseDocument(downloadInfo.downloadUrl, downloadInfo.fileName);
      showSuccess("Document download started!");
      return true;
    } catch (error) {
      console.error("Failed to download document:", error);
      showError("Failed to download document. " + (error.message || "Please try again."));
      return false;
    }
  };

  // Generate document
  const generateDocument = async (leaseId, documentType) => {
    try {
      const response = await leaseService.generateLeaseDocument(leaseId, documentType);
      showSuccess("Document generated successfully!");
      return response;
    } catch (error) {
      console.error("Failed to generate document:", error);
      showError("Failed to generate document. " + (error.message || "Please try again."));
      throw error;
    }
  };

  return {
    downloadDocument,
    generateDocument
  };
};