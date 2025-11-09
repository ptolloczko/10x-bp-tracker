// src/components/views/RegisterView.tsx
import { useState } from "react";
import { RegisterForm, type RegisterFormInput } from "@/components/forms/RegisterForm";
import { authApiClient } from "@/lib/api/auth.client";

/**
 * Register view component
 * Handles the registration form display and state management
 */
export default function RegisterView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (data: RegisterFormInput) => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      // Call the register API endpoint
      // This will:
      // 1. Create user in Supabase Auth
      // 2. Automatically create profile with default values
      // 3. Set session cookies
      await authApiClient.register({
        email: data.email,
        password: data.password,
      });

      // On success, redirect to measurements page
      window.location.href = "/measurements";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zarejestrować");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Rejestracja</h1>
          <p className="mt-2 text-sm text-muted-foreground">Utwórz nowe konto BP Tracker</p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />

          {/* Additional Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Masz już konto?</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <a href="/login" className="text-sm text-primary hover:underline">
                Zaloguj się
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
