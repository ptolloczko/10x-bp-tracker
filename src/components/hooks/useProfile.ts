// src/components/hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApiClient } from "@/lib/api/profile.client";
import type { ProfileDTO, UpdateProfileCommand } from "@/types";

/**
 * Query key for profile data
 */
const PROFILE_QUERY_KEY = ["profile"] as const;

/**
 * Hook for managing profile data with React Query
 *
 * Provides:
 * - Automatic data fetching and caching
 * - Loading and error states
 * - Profile update mutation with automatic cache invalidation
 * - Reminder toggle mutation with automatic cache invalidation
 */
export function useProfile() {
  const queryClient = useQueryClient();

  // Query for fetching profile data
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<ProfileDTO, Error>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => profileApiClient.getProfile(),
    retry: 1, // Retry once on failure
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Mutation for updating profile data
  const updateMutation = useMutation<ProfileDTO, Error, UpdateProfileCommand>({
    mutationFn: (data: UpdateProfileCommand) => profileApiClient.updateProfile(data),
    onSuccess: (updatedProfile) => {
      // Update the cache with the new profile data
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile);
    },
  });

  // Mutation for toggling reminder
  const toggleReminderMutation = useMutation<ProfileDTO, Error, boolean>({
    mutationFn: (enabled: boolean) => profileApiClient.toggleReminder(enabled),
    onSuccess: (updatedProfile) => {
      // Update the cache with the new profile data
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile);
    },
  });

  return {
    // Profile data
    profile,

    // Loading and error states
    isLoading,
    error,

    // Update function and its states
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Toggle reminder function and its states
    toggleReminder: toggleReminderMutation.mutate,
    isTogglingReminder: toggleReminderMutation.isPending,
    toggleReminderError: toggleReminderMutation.error,

    // Utility functions
    refetch,
  };
}
