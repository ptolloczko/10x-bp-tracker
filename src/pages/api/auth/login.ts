// src/pages/api/auth/login.ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { LoginRequestSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * On success, Supabase automatically sets session cookies in the browser.
 *
 * @returns 200 - User and session data
 * @returns 400 - Validation error
 * @returns 401 - Invalid credentials
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

    const validatedData = LoginRequestSchema.parse(body);

    // 2. Authenticate user via service
    const authService = new AuthService(locals.supabase);
    const authResponse = await authService.login(validatedData.email, validatedData.password);

    // 3. Set session cookies for SSR
    // These cookies will be read by middleware on subsequent requests
    const response = new Response(JSON.stringify(authResponse), {
      status: 200,
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

    // Handle authentication errors from Supabase
    if (error instanceof Error) {
      // Check for specific Supabase error messages
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("Invalid credentials")
      ) {
        return new Response(
          JSON.stringify({
            error: "InvalidCredentials",
            message: "Nieprawidłowy email lub hasło",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[POST /api/auth/login] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "ServerError",
        message: "Wystąpił błąd podczas logowania",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

