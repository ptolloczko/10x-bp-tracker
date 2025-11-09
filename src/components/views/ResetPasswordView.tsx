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

    // Check for errors in URL (expired/invalid token)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorParam = urlParams.get("error") || hashParams.get("error");
    const errorCode = urlParams.get("error_code") || hashParams.get("error_code");

    if (errorParam || errorCode) {
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

    // If we have a token in URL query params (Supabase Local sends ?code=UUID)
    // We assume it's a recovery token if we're on /reset-password page
    if (tokenFromQuery) {
      supabaseClient.auth
        .verifyOtp({
          token_hash: tokenFromQuery,
          type: "recovery",
        })
        .then(({ data, error }) => {
          if (!mounted) return;

          if (error || !data.session) {
            setError("Link resetowania hasła wygasł lub jest nieprawidłowy. Poproś o nowy link.");
            setTokenValid(false);
            setIsValidatingToken(false);
            isValidatingRef.current = false;
          } else {
            setTokenValid(true);
            setIsValidatingToken(false);
            isValidatingRef.current = false;
          }
        })
        .catch(() => {
          if (!mounted) return;
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
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // PASSWORD_RECOVERY event means token was valid
      if (event === "PASSWORD_RECOVERY" && session) {
        setTokenValid(true);
        setIsValidatingToken(false);
        isValidatingRef.current = false;
      } else if (event === "SIGNED_IN" && session) {
        // Sometimes Supabase emits SIGNED_IN instead of PASSWORD_RECOVERY
        setTokenValid(true);
        setIsValidatingToken(false);
        isValidatingRef.current = false;
      } else if (event === "INITIAL_SESSION" && session) {
        // Initial session exists
        setTokenValid(true);
        setIsValidatingToken(false);
        isValidatingRef.current = false;
      }
    });

    // Also check current session immediately (in case URL was already processed)
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (session) {
        setTokenValid(true);
        setIsValidatingToken(false);
        isValidatingRef.current = false;
      }
    });

    // Fallback timeout - if no valid session in 10 seconds, show error
    const fallbackTimeout = setTimeout(() => {
      if (!mounted) return;

      if (isValidatingRef.current) {
        setError("Link resetowania hasła wygasł lub jest nieprawidłowy. Poproś o nowy link.");
        setTokenValid(false);
        setIsValidatingToken(false);
        isValidatingRef.current = false;
      }
    }, 10000);

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleSubmit = async (data: ResetPasswordFormInput) => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      // Call the reset password API endpoint
      await authApiClient.resetPassword(data.password);

      // Show success message
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zresetować hasła");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
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
