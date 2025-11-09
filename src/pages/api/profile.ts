// src/pages/api/profile.ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { CreateProfileInput } from "../../lib/validators/profile";
import { ProfileService, ProfileExistsError } from "../../lib/services/profile.service";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { ProfileDTO } from "../../types";

export const prerender = false;

/**
 * POST /api/profile
 *
 * Creates a user profile immediately after registration.
 * Can only be called once per account - subsequent attempts return 409.
 *
 * @returns 201 - Profile created successfully
 * @returns 400 - Invalid request body
 * @returns 409 - Profile already exists
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

    const validatedData = CreateProfileInput.parse(body);

    // 2. Create profile via service (using DEFAULT_USER_ID for now)
    const profileService = new ProfileService(locals.supabase);
    const profile: ProfileDTO = await profileService.createProfile(DEFAULT_USER_ID, validatedData);

    // 3. Return created profile
    return new Response(JSON.stringify(profile), { status: 201, headers: { "Content-Type": "application/json" } });
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

    // Handle profile already exists
    if (error instanceof ProfileExistsError) {
      return new Response(JSON.stringify({ error: "ProfileExists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[POST /api/profile] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "ServerError" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
