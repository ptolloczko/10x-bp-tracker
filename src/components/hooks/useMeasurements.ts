// src/components/hooks/useMeasurements.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { measurementApiClient } from "@/lib/api/measurement.client";
import type {
  MeasurementDTO,
  MeasurementListResponse,
  MeasurementListQuery,
  CreateMeasurementCommand,
  UpdateMeasurementCommand,
} from "@/types";

/**
 * Query key factory for measurements
 */
const getMeasurementsQueryKey = (query?: MeasurementListQuery) => {
  return ["measurements", query] as const;
};

/**
 * Hook for managing measurements data with React Query
 *
 * Provides:
 * - Automatic data fetching and caching with pagination support
 * - Loading and error states
 * - Create, update, and delete mutations with automatic cache invalidation
 * - Export functionality
 */
export function useMeasurements(query?: MeasurementListQuery) {
  const queryClient = useQueryClient();

  // Query for fetching paginated measurements list
  const {
    data: measurementsData,
    isLoading,
    error,
    refetch,
  } = useQuery<MeasurementListResponse, Error>({
    queryKey: getMeasurementsQueryKey(query),
    queryFn: () => measurementApiClient.getMeasurements(query),
    retry: 1,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });

  // Mutation for creating a new measurement
  const createMutation = useMutation<MeasurementDTO, Error, CreateMeasurementCommand>({
    mutationFn: (data: CreateMeasurementCommand) => measurementApiClient.createMeasurement(data),
    onSuccess: () => {
      // Invalidate all measurements queries to refetch
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
    },
  });

  // Mutation for updating a measurement
  const updateMutation = useMutation<MeasurementDTO, Error, { id: string; data: UpdateMeasurementCommand }>({
    mutationFn: ({ id, data }) => measurementApiClient.updateMeasurement(id, data),
    onSuccess: () => {
      // Invalidate all measurements queries to refetch
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
    },
  });

  // Mutation for deleting a measurement
  const deleteMutation = useMutation<undefined, Error, string>({
    mutationFn: (id: string) => measurementApiClient.deleteMeasurement(id),
    onSuccess: () => {
      // Invalidate all measurements queries to refetch
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
    },
  });

  return {
    // Measurements data
    measurements: measurementsData?.data ?? [],
    page: measurementsData?.page ?? 1,
    pageSize: measurementsData?.page_size ?? 10,
    total: measurementsData?.total ?? 0,
    totalPages: measurementsData ? Math.ceil(measurementsData.total / measurementsData.page_size) : 0,

    // Loading and error states
    isLoading,
    error,

    // Create function and its states
    createMeasurement: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update function and its states
    updateMeasurement: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete function and its states
    deleteMeasurement: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Utility functions
    refetch,
  };
}
