// src/pages/api/profile.ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { CreateProfileInput, UpdateProfileSchema } from "../../lib/validators/profile";
import { ProfileService, ProfileExistsError } from "../../lib/services/profile.service";
import type { ProfileDTO } from "../../types";
import { isFeatureEnabled } from "../../features/flags";

export const prerender = false;

/**
 * GET /api/profile
 *
 * Retrieves the user's profile.
 * Requires authentication.
 *
 * @returns 200 - Profile data
 * @returns 401 - Unauthorized
 * @returns 404 - Profile not found
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check if profile feature is enabled
    if (!isFeatureEnabled("profile")) {
      return new Response(JSON.stringify({ error: "Feature disabled" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fetch profile via service using authenticated user's ID
    const profileService = new ProfileService(locals.supabase);
    const profile = await profileService.getProfile(locals.user.id);

    // 3. Handle profile not found
    if (!profile) {
      return new Response(JSON.stringify({ error: "ProfileNotFound" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Return profile data
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[GET /api/profile] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "ServerError" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/profile
 *
 * Creates a user profile immediately after registration.
 * Can only be called once per account - subsequent attempts return 409.
 * Requires authentication.
 *
 * @returns 201 - Profile created successfully
 * @returns 400 - Invalid request body
 * @returns 401 - Unauthorized
 * @returns 409 - Profile already exists
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if profile feature is enabled
    if (!isFeatureEnabled("profile")) {
      return new Response(JSON.stringify({ error: "Feature disabled" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
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

    // 3. Create profile via service using authenticated user's ID
    const profileService = new ProfileService(locals.supabase);
    const profile: ProfileDTO = await profileService.createProfile(locals.user.id, validatedData);

    // 4. Return created profile
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

/**
 * PUT /api/profile
 *
 * Updates the user's profile with the provided data.
 * Requires authentication.
 *
 * @returns 200 - Profile updated successfully
 * @returns 400 - Invalid request body
 * @returns 401 - Unauthorized
 * @returns 404 - Profile not found
 * @returns 500 - Server error
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Check if profile feature is enabled
    if (!isFeatureEnabled("profile")) {
      return new Response(JSON.stringify({ error: "Feature disabled" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "ValidationError", details: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedData = UpdateProfileSchema.parse(body);

    // 3. Update profile via service using authenticated user's ID
    const profileService = new ProfileService(locals.supabase);
    const profile: ProfileDTO = await profileService.updateProfile(locals.user.id, validatedData);

    // 4. Return updated profile
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
    console.error("[PUT /api/profile] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "ServerError" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
