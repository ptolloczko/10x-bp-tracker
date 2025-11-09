// src/lib/api/profile.client.ts
import type { ProfileDTO, UpdateProfileCommand } from "@/types";

/**
 * Client for profile API endpoints
 */
export class ProfileApiClient {
  /**
   * Fetches the current user's profile
   *
   * @returns The user's profile
   * @throws {Error} When the request fails
   */
  async getProfile(): Promise<ProfileDTO> {
    const response = await fetch("/api/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Profile not found");
      }
      throw new Error("Failed to fetch profile");
    }

    return response.json();
  }

  /**
   * Updates the current user's profile
   *
   * @param data - Partial profile data to update
   * @returns The updated profile
   * @throws {Error} When the request fails
   */
  async updateProfile(data: UpdateProfileCommand): Promise<ProfileDTO> {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.details || "Validation error");
      }
      throw new Error("Failed to update profile");
    }

    return response.json();
  }

  /**
   * Toggles email reminders for the current user
   *
   * @param enabled - Whether reminders should be enabled
   * @returns The updated profile
   * @throws {Error} When the request fails
   */
  async toggleReminder(enabled: boolean): Promise<ProfileDTO> {
    const response = await fetch("/api/profile/reminder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.details || "Validation error");
      }
      throw new Error("Failed to toggle reminder");
    }

    return response.json();
  }
}

// Export singleton instance
export const profileApiClient = new ProfileApiClient();
