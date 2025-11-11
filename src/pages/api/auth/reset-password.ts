// src/pages/api/auth/reset-password.ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { ResetPasswordRequestSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";
import { isFeatureEnabled } from "@/features/flags";

export const prerender = false;

/**
 * POST /api/auth/reset-password
 *
 * Resets the user's password using a token from the password reset email.
 * The user must be authenticated via the token in the URL (Supabase handles this).
 *
 * @returns 200 - Password updated successfully
 * @returns 400 - Validation error
 * @returns 401 - Invalid or expired token
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if auth feature is enabled
    if (!isFeatureEnabled("auth")) {
      return new Response(JSON.stringify({ error: "Feature disabled" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Check if user is authenticated (via token from email link)
    if (!locals.user) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/auth/reset-password] No user in locals");
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Link resetowania hasła wygasł lub jest nieprawidłowy",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // eslint-disable-next-line no-console
    console.log("[POST /api/auth/reset-password] User authenticated:", locals.user.id);

    // 2. Parse and validate request body
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

    const validatedData = ResetPasswordRequestSchema.parse(body);

    // eslint-disable-next-line no-console
    console.log("[POST /api/auth/reset-password] Updating password for user:", locals.user.id);

    // 3. Get the access token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/auth/reset-password] No Authorization header");
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Brak tokena autoryzacji",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = authHeader.substring(7);

    // 4. Get refresh token from cookies (if available)
    const refreshToken = request.headers.get("Cookie")?.match(/sb-refresh-token=([^;]+)/)?.[1] || "";

    // 5. Create a new Supabase client and set the session
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_KEY;

    const supabaseWithAuth = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Set the session with access token (refresh token is optional for this operation)
    const { data: sessionData, error: sessionError } = await supabaseWithAuth.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !sessionData.session) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/auth/reset-password] Failed to set session:", sessionError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Sesja wygasła lub jest nieprawidłowa. Spróbuj ponownie wysłać link resetujący.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Update password using the authenticated client
    const { error: updateError } = await supabaseWithAuth.auth.updateUser({
      password: validatedData.password,
    });

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("[POST /api/auth/reset-password] Failed to update password:", updateError);
      return new Response(
        JSON.stringify({
          error: "UpdateError",
          message: updateError.message || "Nie udało się zaktualizować hasła",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // eslint-disable-next-line no-console
    console.log("[POST /api/auth/reset-password] Password updated successfully");

    // 6. Return success
    return new Response(
      JSON.stringify({
        message: "Hasło zostało pomyślnie zmienione",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[POST /api/auth/reset-password] Unexpected error:", error);
    // eslint-disable-next-line no-console
    console.error("[POST /api/auth/reset-password] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({
        error: "ServerError",
        message: "Wystąpił błąd podczas zmiany hasła",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
