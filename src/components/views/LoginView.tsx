// src/components/views/LoginView.tsx
import { useState } from "react";
import { LoginForm, type LoginFormInput } from "@/components/forms/LoginForm";
import { authApiClient } from "@/lib/api/auth.client";

/**
 * Login view component
 * Handles the login form display and state management
 */
export default function LoginView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (data: LoginFormInput) => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      // Call the login API endpoint
      await authApiClient.login(data);
      
      // On success, redirect to measurements page
      window.location.href = "/measurements";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zalogować");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Logowanie</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Zaloguj się do swojego konta BP Tracker
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />

          {/* Additional Links */}
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Nie pamiętam hasła
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Nie masz konta?
                </span>
              </div>
            </div>
            <div className="text-center">
              <a
                href="/register"
                className="text-sm text-primary hover:underline"
              >
                Zarejestruj się
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


