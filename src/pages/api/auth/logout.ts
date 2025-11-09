// src/pages/api/auth/logout.ts
import type { APIRoute } from "astro";

import { AuthService } from "@/lib/services/auth.service";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by:
 * 1. Calling Supabase signOut to invalidate the session
 * 2. Clearing the session cookies
 *
 * @returns 200 - Successfully logged out
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // 1. Sign out from Supabase
    // This invalidates the session on Supabase side
    const authService = new AuthService(locals.supabase);
    await authService.logout();

    // 2. Clear session cookies
    cookies.delete("sb-access-token", {
      path: "/",
    });

    cookies.delete("sb-refresh-token", {
      path: "/",
    });

    // 3. Return success response
    return new Response(
      JSON.stringify({
        message: "Successfully logged out",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[POST /api/auth/logout] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "ServerError",
        message: "Wystąpił błąd podczas wylogowania",
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
