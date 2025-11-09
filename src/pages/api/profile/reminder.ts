// src/pages/api/profile/reminder.ts
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";

import { ProfileService } from "../../../lib/services/profile.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

/**
 * Schema for validating reminder toggle request
 */
const ToggleReminderSchema = z.object({
  enabled: z.boolean({
    required_error: "enabled is required",
    invalid_type_error: "enabled must be a boolean",
  }),
});

/**
 * POST /api/profile/reminder
 *
 * Toggles email reminders for the user's profile.
 * (Authentication will be implemented later)
 *
 * @returns 200 - Reminder toggled successfully
 * @returns 400 - Invalid request body
 * @returns 404 - Profile not found
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "ValidationError", details: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedData = ToggleReminderSchema.parse(body);

    // 2. Toggle reminder via service using DEFAULT_USER_ID
    const profileService = new ProfileService(locals.supabase);
    const profile = await profileService.toggleReminder(DEFAULT_USER_ID, validatedData.enabled);

    // 3. Return updated profile
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          details: error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle profile not found
    if (error instanceof Error && error.message === "Profile not found") {
      return new Response(JSON.stringify({ error: "ProfileNotFound" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[POST /api/profile/reminder] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "ServerError" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
