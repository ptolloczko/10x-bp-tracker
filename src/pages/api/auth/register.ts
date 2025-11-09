// src/pages/api/auth/register.ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { RegisterRequestSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";
import { ProfileService } from "@/lib/services/profile.service";

export const prerender = false;

/**
 * POST /api/auth/register
 *
 * Registers a new user and automatically creates their profile.
 *
 * Flow:
 * 1. Validate request data
 * 2. Create user in Supabase Auth
 * 3. Create profile with default values
 * 4. Set session cookies
 * 5. Return user + session
 *
 * @returns 201 - User registered successfully
 * @returns 400 - Validation error
 * @returns 409 - User already exists
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          details: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = RegisterRequestSchema.parse(body);

    // 2. Register user via AuthService
    const authService = new AuthService(locals.supabase);
    const authResponse = await authService.register(validatedData.email, validatedData.password);

    // 3. Create profile with default values
    // According to spec: profile is created automatically with empty optional fields
    const profileService = new ProfileService(locals.supabase);
    try {
      await profileService.createProfile(authResponse.user.id, {
        // Required field with default timezone
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Warsaw",
        // All other fields are optional and will be null/empty by default
      });
    } catch (profileError) {
      // If profile creation fails, we still return success
      // User can fill profile later (US-010)
      // eslint-disable-next-line no-console
      console.error("[POST /api/auth/register] Profile creation failed:", profileError);
    }

    // 4. Set session cookies for SSR
    const response = new Response(JSON.stringify(authResponse), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });

    // Set access token cookie
    response.headers.append(
      "Set-Cookie",
      `sb-access-token=${authResponse.session.access_token}; Path=/; HttpOnly; SameSite=Lax; ${import.meta.env.PROD ? "Secure;" : ""} Max-Age=3600`
    );

    // Set refresh token cookie
    response.headers.append(
      "Set-Cookie",
      `sb-refresh-token=${authResponse.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; ${import.meta.env.PROD ? "Secure;" : ""} Max-Age=604800`
    );

    return response;
  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          details: error.flatten(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle registration errors from Supabase
    if (error instanceof Error) {
      // Check for specific Supabase error messages
      if (
        error.message.includes("User already registered") ||
        error.message.includes("already registered") ||
        error.message.includes("already exists")
      ) {
        return new Response(
          JSON.stringify({
            error: "UserExists",
            message: "Użytkownik o podanym adresie email już istnieje",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check for weak password
      if (error.message.includes("Password") || error.message.includes("password")) {
        return new Response(
          JSON.stringify({
            error: "WeakPassword",
            message: "Hasło nie spełnia wymagań bezpieczeństwa",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[POST /api/auth/register] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "ServerError",
        message: "Wystąpił błąd podczas rejestracji",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
