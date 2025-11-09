// src/components/views/ResetPasswordView.tsx
import { useState } from "react";
import { ResetPasswordForm, type ResetPasswordFormInput } from "@/components/forms/ResetPasswordForm";

/**
 * Reset password view component
 * Handles the reset password form display and state management
 */
export default function ResetPasswordView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: ResetPasswordFormInput) => {
    setIsSubmitting(true);
    setError(undefined);
    setSuccess(false);

    try {
      // TODO: Implement auth API call here
      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // eslint-disable-next-line no-console
      console.log("Reset password data:", data);
      
      // In the future, this will:
      // 1. Call AuthApiClient.resetPassword()
      // 2. Redirect to /login with success message
      setSuccess(true);
      
      // Simulate redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zresetować hasła");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Ustaw nowe hasło</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wprowadź nowe hasło do swojego konta
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-center">
                <p className="font-medium text-green-600 dark:text-green-400">
                  Hasło zostało zmienione!
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Twoje hasło zostało pomyślnie zaktualizowane. Za chwilę zostaniesz przekierowany do strony logowania.
                </p>
              </div>
              <div className="flex justify-center">
                <div
                  className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                  role="status"
                >
                  <span className="sr-only">Przekierowywanie...</span>
                </div>
              </div>
            </div>
          ) : (
            <ResetPasswordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
          )}
        </div>
      </div>
    </div>
  );
}

