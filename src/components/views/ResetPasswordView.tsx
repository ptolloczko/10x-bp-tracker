// src/components/views/ResetPasswordView.tsx
import { useState, useEffect, useRef } from "react";
import { ResetPasswordForm, type ResetPasswordFormInput } from "@/components/forms/ResetPasswordForm";
import { authApiClient } from "@/lib/api/auth.client";
import { supabaseClient } from "@/db/supabase.client";

/**
 * Reset password view component
 * Handles the password reset form (after clicking link from email)
 * Automatically processes token from URL hash
 */
export default function ResetPasswordView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const isValidatingRef = useRef(true);

  // Check if reset token is valid on mount
  useEffect(() => {
    let mounted = true;
    let timeout: NodeJS.Timeout;

    console.log("[ResetPassword] Component mounted, checking for recovery token...");
    console.log("[ResetPassword] Current URL:", window.location.href);
    console.log("[ResetPassword] Hash:", window.location.hash);

    // Check for errors in URL (expired/invalid token)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorParam = urlParams.get("error") || hashParams.get("error");
    const errorCode = urlParams.get("error_code") || hashParams.get("error_code");
    const errorDescription = urlParams.get("error_description") || hashParams.get("error_description");

    if (errorParam || errorCode) {
      console.log("[ResetPassword] Error in URL:", { errorParam, errorCode, errorDescription });
      setError("Link resetowania hasła wygasł lub jest nieprawidłowy. Poproś o nowy link.");
      setTokenValid(false);
      setIsValidatingToken(false);
      isValidatingRef.current = false;
      return () => {
        mounted = false;
      };
    }

    // Check for token/code in URL
    const tokenFromQuery = urlParams.get("code") || urlParams.get("token");
    const tokenFromHash = hashParams.get("access_token");
    const type = urlParams.get("type") || hashParams.get("type");

    console.log("[ResetPassword] URL tokens:", {
      queryToken: tokenFromQuery ? "present" : "none",
      hashToken: tokenFromHash ? "present" : "none",
      type: type || "none",
    });

    // If we have a token in URL query params (Supabase Local sends ?code=UUID)
    // We assume it's a recovery token if we're on /reset-password page
    if (tokenFromQuery) {
      console.log("[ResetPassword] Found token in URL, verifying as recovery token...");
      supabaseClient.auth
        .verifyOtp({
          token_hash: tokenFromQuery,
          type: "recovery",
        })
        .then(({ data, error }) => {
          if (!mounted) return;

          console.log("[ResetPassword] Token verification result:", {
            hasSession: !!data.session,
            hasUser: !!data.user,
            error: error?.message,
          });

          if (error || !data.session) {
            setError("Link resetowania hasła wygasł lub jest nieprawidłowy. Poproś o nowy link.");
            setTokenValid(false);
            setIsValidatingToken(false);
            isValidatingRef.current = false;
          } else {
            console.log("[ResetPassword] Recovery token verified successfully!");
            setTokenValid(true);
            setIsValidatingToken(false);
            isValidatingRef.current = false;
          }
        })
        .catch((err) => {
          if (!mounted) return;
          console.error("[ResetPassword] Error verifying token:", err);
          setError("Wystąpił błąd podczas weryfikacji linku");
          setTokenValid(false);
          setIsValidatingToken(false);
          isValidatingRef.current = false;
        });

      return () => {
        mounted = false;
      };
    }

    // Listen for auth state changes (for hash-based tokens)
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log("[ResetPassword] Auth state changed:", event, "Session exists:", !!session);

        // PASSWORD_RECOVERY event means token was valid
        if (event === "PASSWORD_RECOVERY" && session) {
          console.log("[ResetPassword] Password recovery token valid!");
          setTokenValid(true);
          setIsValidatingToken(false);
          isValidatingRef.current = false;
        } else if (event === "SIGNED_IN" && session) {
          // Sometimes Supabase emits SIGNED_IN instead of PASSWORD_RECOVERY
          console.log("[ResetPassword] User signed in (could be recovery)");
          setTokenValid(true);
          setIsValidatingToken(false);
          isValidatingRef.current = false;
        } else if (event === "INITIAL_SESSION" && session) {
          // Initial session exists
          console.log("[ResetPassword] Initial session found");
          setTokenValid(true);
          setIsValidatingToken(false);
          isValidatingRef.current = false;
        }
      }
    );

    // Also check current session immediately (in case URL was already processed)
    supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      console.log("[ResetPassword] Current session check:", {
        hasSession: !!session,
        error: error?.message,
      });

      if (session) {
        console.log("[ResetPassword] Session found immediately");
        setTokenValid(true);
        setIsValidatingToken(false);
        isValidatingRef.current = false;
      }
    });

    // Fallback timeout - if no valid session in 10 seconds, show error
    timeout = setTimeout(() => {
      if (!mounted) return;

      console.log("[ResetPassword] Timeout reached, still validating:", isValidatingRef.current);

      if (isValidatingRef.current) {
        console.log("[ResetPassword] No valid session detected after timeout");
        setError("Link resetowania hasła wygasł lub jest nieprawidłowy. Poproś o nowy link.");
        setTokenValid(false);
        setIsValidatingToken(false);
        isValidatingRef.current = false;
      }
    }, 10000);

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timeout);
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleSubmit = async (data: ResetPasswordFormInput) => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      console.log("[ResetPassword] Submitting password reset...");
      // Call the reset password API endpoint
      await authApiClient.resetPassword(data.password);

      console.log("[ResetPassword] Password reset successful!");
      // Show success message
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      console.error("[ResetPassword] Password reset failed:", err);
      setError(err instanceof Error ? err.message : "Nie udało się zresetować hasła");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    console.log("[ResetPassword] Rendering: LOADING state");
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            <p className="text-sm text-muted-foreground">Weryfikacja linku resetowania hasła...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    console.log("[ResetPassword] Rendering: ERROR state", { error });
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <h2 className="mb-2 text-center text-xl font-bold">Link nieprawidłowy</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">{error}</p>
            <div className="space-y-3">
              <a
                href="/forgot-password"
                className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Poproś o nowy link
              </a>
              <a
                href="/login"
                className="block w-full rounded-md border border-input px-4 py-2 text-center text-sm font-medium hover:bg-accent transition-colors"
              >
                Wróć do logowania
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    console.log("[ResetPassword] Rendering: SUCCESS state");
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Success message */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h2 className="mb-2 text-center text-xl font-bold">Hasło zmienione!</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Twoje hasło zostało pomyślnie zmienione. Za chwilę przekierujemy Cię na stronę logowania.
            </p>
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  console.log("[ResetPassword] Rendering: FORM state", { isValidatingToken, tokenValid, success });
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Ustaw nowe hasło</h1>
          <p className="mt-2 text-sm text-muted-foreground">Wprowadź nowe hasło do swojego konta</p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <ResetPasswordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Wróć do logowania
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
