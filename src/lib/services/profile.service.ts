// src/lib/services/profile.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateProfileCommand, ProfileDTO } from "../../types";

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
}
