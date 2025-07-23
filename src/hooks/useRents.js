// src/hooks/useRents.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as rentService from '../services/rentService';
import useAuth from './useAuth';
import { useGlobalAlert } from '../contexts/GlobalAlertContext';

/**
 * Hook for fetching a list of rent records
 * @param {Object} options - Query options
 * @param {Object} options.filters - Filter parameters
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Object} Query result with rent records data
 */
export const useRents = (options = {}) => {
  const { isAuthenticated } = useAuth();
  const { filters = {}, page = 1, limit = 10 } = options;

  return useQuery({
    queryKey: ['rents', { ...filters, page, limit }],
    queryFn: ({ signal }) => rentService.getRentEntries({ ...filters, page, limit }, signal),
    enabled: isAuthenticated,
    select: (response) => ({
      rents: response.data || [],
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
 * Hook for fetching a single rent record by ID
 * @param {string} rentId - Rent ID to fetch
 * @returns {Object} Query result with rent record data
 */
export const useRent = (rentId) => {
  const { isAuthenticated } = useAuth();
  const { showError } = useGlobalAlert();

  return useQuery({
    queryKey: ['rent', rentId],
    queryFn: ({ signal }) => rentService.getRentRecordById(rentId, signal),
    enabled: isAuthenticated && !!rentId,
    select: (response) => response.data,
    onError: (error) => {
      console.error(`Failed to fetch rent record ${rentId}:`, error);
      showError("Failed to load rent record. " + (error.message || "Please try again."));
    }
  });
};

/**
 * Hook for fetching upcoming rent records
 * @param {Object} options - Query options
 * @param {number} options.daysAhead - Days ahead to check
 * @param {string} options.propertyId - Property ID to filter by
 * @returns {Object} Query result with upcoming rent records
 */
export const useUpcomingRents = (options = {}) => {
  const { isAuthenticated } = useAuth();
  const { daysAhead = 30, propertyId } = options;
  
  const params = { daysAhead };
  if (propertyId) params.propertyId = propertyId;

  return useQuery({
    queryKey: ['upcomingRents', params],
    queryFn: ({ signal }) => rentService.getUpcomingRent(params, signal),
    enabled: isAuthenticated,
    select: (response) => response.data || [],
  });
};

/**
 * Hook for fetching rent schedules
 * @param {Object} options - Query options
 * @param {Object} options.filters - Filter parameters
 * @returns {Object} Query result with rent schedules
 */
export const useRentSchedules = (options = {}) => {
  const { isAuthenticated } = useAuth();
  const { filters = {} } = options;

  return useQuery({
    queryKey: ['rentSchedules', filters],
    queryFn: ({ signal }) => rentService.getRentSchedules(filters, signal),
    enabled: isAuthenticated,
    select: (response) => response.data || [],
  });
};

/**
 * Hook that provides rent record mutation operations
 */
export const useRentMutations = () => {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalAlert();

  // Create rent record mutation
  const createRent = useMutation({
    mutationFn: (rentData) => rentService.createRentRecord(rentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingRents'] });
      showSuccess("Rent record created successfully!");
    },
    onError: (error) => {
      console.error("Failed to create rent record:", error);
      showError("Failed to create rent record. " + (error.message || "Please try again."));
    }
  });

  // Update rent record mutation
  const updateRent = useMutation({
    mutationFn: ({ rentId, updateData }) => 
      rentService.updateRentRecord(rentId, updateData),
    onSuccess: (data, { rentId }) => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      queryClient.invalidateQueries({ queryKey: ['rent', rentId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingRents'] });
      showSuccess("Rent record updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update rent record:", error);
      showError("Failed to update rent record. " + (error.message || "Please try again."));
    }
  });

  // Delete rent record mutation
  const deleteRent = useMutation({
    mutationFn: (rentId) => rentService.deleteRentRecord(rentId),
    onSuccess: (data, rentId) => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      queryClient.invalidateQueries({ queryKey: ['rent', rentId] });
      showSuccess("Rent record deleted successfully!");
    },
    onError: (error) => {
      console.error("Failed to delete rent record:", error);
      showError("Failed to delete rent record. " + (error.message || "Please try again."));
    }
  });

  // Record payment mutation
  const recordPayment = useMutation({
    mutationFn: ({ rentId, paymentData, paymentProofFile }) => 
      rentService.recordPaymentForRentRecord(rentId, paymentData, paymentProofFile),
    onSuccess: (data, { rentId }) => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      queryClient.invalidateQueries({ queryKey: ['rent', rentId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingRents'] });
      showSuccess("Payment recorded successfully!");
    },
    onError: (error) => {
      console.error("Failed to record payment:", error);
      showError("Failed to record payment. " + (error.message || "Please try again."));
    }
  });

  // Upload proof mutation
  const uploadProof = useMutation({
    mutationFn: ({ rentId, file, metadata }) => 
      rentService.uploadPaymentProof(rentId, file, metadata),
    onSuccess: (data, { rentId }) => {
      queryClient.invalidateQueries({ queryKey: ['rent', rentId] });
      showSuccess("Payment proof uploaded successfully!");
    },
    onError: (error) => {
      console.error("Failed to upload payment proof:", error);
      showError("Failed to upload payment proof. " + (error.message || "Please try again."));
    }
  });

  return {
    createRent: createRent.mutate,
    isCreating: createRent.isPending,
    updateRent: updateRent.mutate,
    isUpdating: updateRent.isPending,
    deleteRent: deleteRent.mutate,
    isDeleting: deleteRent.isPending, // Fixed: was referencing deleteLease
    recordPayment: recordPayment.mutate,
    isRecordingPayment: recordPayment.isPending,
    uploadProof: uploadProof.mutate,
    isUploading: uploadProof.isPending
  };
};

/**
 * Hook that provides rent schedule mutation operations
 */
export const useRentScheduleMutations = () => {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalAlert();

  // Create schedule mutation
  const createSchedule = useMutation({
    mutationFn: (scheduleData) => rentService.createRentSchedule(scheduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentSchedules'] });
      showSuccess("Rent schedule created successfully!");
    },
    onError: (error) => {
      console.error("Failed to create rent schedule:", error);
      showError("Failed to create rent schedule. " + (error.message || "Please try again."));
    }
  });

  // Update schedule mutation
  const updateSchedule = useMutation({
    mutationFn: ({ scheduleId, updateData }) => 
      rentService.updateRentSchedule(scheduleId, updateData),
    onSuccess: (data, { scheduleId }) => {
      queryClient.invalidateQueries({ queryKey: ['rentSchedules'] });
      showSuccess("Rent schedule updated successfully!");
    },
    onError: (error) => {
      console.error("Failed to update rent schedule:", error);
      showError("Failed to update rent schedule. " + (error.message || "Please try again."));
    }
  });

  // Delete schedule mutation
  const deleteSchedule = useMutation({
    mutationFn: (scheduleId) => rentService.deleteRentSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentSchedules'] });
      showSuccess("Rent schedule deleted successfully!");
    },
    onError: (error) => {
      console.error("Failed to delete rent schedule:", error);
      showError("Failed to delete rent schedule. " + (error.message || "Please try again."));
    }
  });

  // Generate rents mutation
  const generateRents = useMutation({
    mutationFn: (options) => rentService.generateRentRecords(options),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rents'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingRents'] });
      showSuccess(`Rent generation completed successfully! Generated: ${data.generated || 0}, Skipped: ${data.skipped || 0}`);
    },
    onError: (error) => {
      console.error("Failed to generate rent records:", error);
      showError("Failed to generate rent records. " + (error.message || "Please try again."));
    }
  });

  return {
    createSchedule: createSchedule.mutate,
    isCreating: createSchedule.isPending,
    updateSchedule: updateSchedule.mutate,
    isUpdating: updateSchedule.isPending,
    deleteSchedule: deleteSchedule.mutate,
    isDeleting: deleteSchedule.isPending,
    generateRents: generateRents.mutate,
    isGenerating: generateRents.isPending
  };
};

/**
 * Utility functions for rent records
 */
export const useRentUtils = () => {
  const { showError, showSuccess } = useGlobalAlert();

  // Download proof
  const downloadProof = async (rentId) => {
    try {
      const downloadInfo = await rentService.getPaymentProofDownloadInfo(rentId);
      await rentService.downloadPaymentProof(downloadInfo.downloadUrl, downloadInfo.fileName);
      showSuccess("Download started!");
      return true;
    } catch (error) {
      console.error("Failed to download payment proof:", error);
      showError("Failed to download payment proof. " + (error.message || "Please try again."));
      return false;
    }
  };

  return {
    downloadProof,
    formatRent: rentService.formatRent
  };
};