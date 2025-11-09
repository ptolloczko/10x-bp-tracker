// src/components/views/ForgotPasswordView.tsx
import { useState } from "react";
import { ForgotPasswordForm, type ForgotPasswordFormInput } from "@/components/forms/ForgotPasswordForm";
import { authApiClient } from "@/lib/api/auth.client";

/**
 * Forgot password view component
 * Handles the password reset request form
 */
export default function ForgotPasswordView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: ForgotPasswordFormInput) => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      // Call the forgot password API endpoint
      await authApiClient.sendPasswordResetEmail(data);

      // Show success message
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać emaila");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h2 className="mb-2 text-center text-xl font-bold">Email wysłany!</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Jeśli podany adres email istnieje w systemie, wysłaliśmy link do resetowania hasła. Sprawdź swoją skrzynkę
              pocztową.
            </p>
            <a
              href="/login"
              className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Wróć do logowania
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Resetowanie hasła</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Podaj adres email, a wyślemy Ci link do resetowania hasła
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <ForgotPasswordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />

          {/* Additional Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Lub</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <a href="/login" className="text-sm text-primary hover:underline">
                Wróć do logowania
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
