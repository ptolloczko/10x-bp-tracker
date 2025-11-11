// src/pages/api/auth/forgot-password.ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { ForgotPasswordRequestSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";
import { isFeatureEnabled } from "@/features/flags";

export const prerender = false;

/**
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email to the user.
 * Always returns 200 even if email doesn't exist (security best practice).
 *
 * @returns 200 - Email sent (or email doesn't exist, but we don't tell)
 * @returns 400 - Validation error
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

    const validatedData = ForgotPasswordRequestSchema.parse(body);

    // 2. Send password reset email via AuthService
    const authService = new AuthService(locals.supabase);

    // Construct the redirect URL for password reset using request origin
    const url = new URL(request.url);
    const redirectUrl = `${url.origin}/reset-password`;

    await authService.sendPasswordResetEmail(validatedData.email, redirectUrl);

    // 3. Always return success (security: don't reveal if email exists)
    return new Response(
      JSON.stringify({
        message: "Jeśli podany adres email istnieje w systemie, wysłaliśmy link do resetowania hasła",
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
    console.error("[POST /api/auth/forgot-password] Unexpected error:", error);

    // Still return 200 to not reveal system errors
    return new Response(
      JSON.stringify({
        message: "Jeśli podany adres email istnieje w systemie, wysłaliśmy link do resetowania hasła",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
