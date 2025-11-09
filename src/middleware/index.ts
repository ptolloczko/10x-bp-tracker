import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.js";

export const onRequest = defineMiddleware(async (context, next) => {
  // Make Supabase client available in context.locals
  context.locals.supabase = supabaseClient;

  // Extract JWT token from Authorization header
  const authHeader = context.request.headers.get("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      // Verify JWT and get user
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(token);

      if (error) {
        // eslint-disable-next-line no-console
        console.warn("[Middleware] Failed to verify token:", error.message);
        context.locals.user = null;
      } else {
        context.locals.user = user;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Middleware] Error verifying JWT:", error);
      context.locals.user = null;
    }
  } else {
    // No Authorization header provided
    context.locals.user = null;
  }

  return next();
});
