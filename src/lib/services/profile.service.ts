// src/lib/services/profile.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateProfileCommand, ProfileDTO, UpdateProfileCommand } from "../../types";

/**
 * Custom error thrown when attempting to create a profile that already exists.
 */
export class ProfileExistsError extends Error {
  constructor(userId: string) {
    super(`Profile already exists for user: ${userId}`);
    this.name = "ProfileExistsError";
  }
}

/**
 * Service for managing user profiles.
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves the profile for the given user.
   *
   * @param userId - The authenticated user's ID
   * @returns The user's profile or null if not found
   * @throws {Error} For database errors
   */
  async getProfile(userId: string): Promise<ProfileDTO | null> {
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[ProfileService] Error fetching profile:", error);
      throw new Error("Failed to fetch profile");
    }

    return profile;
  }

  /**
   * Creates a new profile for the given user.
   *
   * @param userId - The authenticated user's ID
   * @param data - Profile data from the request
   * @returns The created profile
   * @throws {ProfileExistsError} If profile already exists
   * @throws {Error} For other database errors
   */
  async createProfile(userId: string, data: CreateProfileCommand): Promise<ProfileDTO> {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await this.supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      // eslint-disable-next-line no-console
      console.error("[ProfileService] Error checking profile existence:", checkError);
      throw new Error("Failed to check profile existence");
    }

    if (existingProfile) {
      throw new ProfileExistsError(userId);
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await this.supabase
      .from("profiles")
      .insert({
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (insertError) {
      // eslint-disable-next-line no-console
      console.error("[ProfileService] Error creating profile:", insertError);
      throw new Error("Failed to create profile");
    }

    return newProfile;
  }

  /**
   * Updates an existing profile for the given user.
   *
   * @param userId - The authenticated user's ID
   * @param data - Partial profile data to update
   * @returns The updated profile
   * @throws {Error} For database errors or if profile not found
   */
  async updateProfile(userId: string, data: UpdateProfileCommand): Promise<ProfileDTO> {
    const { data: updatedProfile, error } = await this.supabase
      .from("profiles")
      .update(data)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[ProfileService] Error updating profile:", error);
      throw new Error("Failed to update profile");
    }

    if (!updatedProfile) {
      throw new Error("Profile not found");
    }

    return updatedProfile;
  }

  /**
   * Toggles email reminders for the given user.
   *
   * @param userId - The authenticated user's ID
   * @param enabled - Whether reminders should be enabled
   * @returns The updated profile
   * @throws {Error} For database errors or if profile not found
   */
  async toggleReminder(userId: string, enabled: boolean): Promise<ProfileDTO> {
    const { data: updatedProfile, error } = await this.supabase
      .from("profiles")
      .update({ reminder_enabled: enabled })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[ProfileService] Error toggling reminder:", error);
      throw new Error("Failed to toggle reminder");
    }

    if (!updatedProfile) {
      throw new Error("Profile not found");
    }

    return updatedProfile;
  }
}
