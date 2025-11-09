// src/components/views/ForgotPasswordView.tsx
import { useState } from "react";
import { ForgotPasswordForm, type ForgotPasswordFormInput } from "@/components/forms/ForgotPasswordForm";

/**
 * Forgot password view component
 * Handles the forgot password form display and state management
 */
export default function ForgotPasswordView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: ForgotPasswordFormInput) => {
    setIsSubmitting(true);
    setError(undefined);
    setSuccess(false);

    try {
      // TODO: Implement auth API call here
      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // eslint-disable-next-line no-console
      console.log("Forgot password data:", data);
      
      // In the future, this will call AuthApiClient.sendPasswordResetEmail()
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać emaila");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Resetowanie hasła</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Podaj adres email powiązany z Twoim kontem
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-center">
                <p className="font-medium text-green-600 dark:text-green-400">
                  Link wysłany!
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Link do resetowania hasła został wysłany na podany adres email. 
                  Sprawdź swoją skrzynkę pocztową.
                </p>
              </div>
              <div className="text-center">
                <a
                  href="/login"
                  className="text-sm text-primary hover:underline"
                >
                  Powrót do logowania
                </a>
              </div>
            </div>
          ) : (
            <>
              <ForgotPasswordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />

              {/* Additional Links */}
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      lub
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <a
                    href="/login"
                    className="text-primary hover:underline"
                  >
                    Powrót do logowania
                  </a>
                  <a
                    href="/register"
                    className="text-primary hover:underline"
                  >
                    Zarejestruj się
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

