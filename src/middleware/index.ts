import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.js";

/**
 * Middleware for authentication and Supabase client injection
 *
 * This middleware:
 * 1. Makes Supabase client available via context.locals.supabase
 * 2. Checks for authentication via Authorization header (for API calls)
 * 3. Checks for authentication via Supabase cookies (for SSR/browser)
 * 4. Sets context.locals.user for authenticated requests
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Make Supabase client available in context.locals
  context.locals.supabase = supabaseClient;

  let user = null;

  // 2. First, try to get user from Authorization header (for API requests)
  const authHeader = context.request.headers.get("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const {
        data: { user: headerUser },
        error,
      } = await supabaseClient.auth.getUser(token);

      if (!error && headerUser) {
        user = headerUser;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Middleware] Error verifying JWT from header:", error);
    }
  }

  // 3. If no user from header, try to get session from cookies (for browser/SSR)
  if (!user) {
    try {
      // Get access and refresh tokens from cookies
      const accessToken = context.cookies.get("sb-access-token")?.value;
      const refreshToken = context.cookies.get("sb-refresh-token")?.value;

      if (accessToken && refreshToken) {
        // Try to get user with access token
        const {
          data: { user: cookieUser },
          error,
        } = await supabaseClient.auth.getUser(accessToken);

        if (!error && cookieUser) {
          user = cookieUser;
        } else if (refreshToken) {
          // If access token expired, try to refresh
          const {
            data: { session },
            error: refreshError,
          } = await supabaseClient.auth.refreshSession({
            refresh_token: refreshToken,
          });

          if (!refreshError && session) {
            user = session.user;

            // Update cookies with new tokens
            context.cookies.set("sb-access-token", session.access_token, {
              path: "/",
              httpOnly: true,
              secure: import.meta.env.PROD,
              sameSite: "lax",
              maxAge: 60 * 60, // 1 hour
            });

            if (session.refresh_token) {
              context.cookies.set("sb-refresh-token", session.refresh_token, {
                path: "/",
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 7 days
              });
            }
          }
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Middleware] Error verifying session from cookies:", error);
    }
  }

  // 4. Set user in context.locals
  context.locals.user = user;

  return next();
});
