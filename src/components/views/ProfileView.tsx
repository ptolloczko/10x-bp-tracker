// src/components/views/ProfileView.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProfile } from "@/components/hooks/useProfile";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { ReminderToggle } from "@/components/forms/ReminderToggle";
import { ThemeToggle } from "@/components/forms/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import type { UpdateProfileCommand } from "@/types";

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Profile view content component
 * Handles profile data loading, errors, and display
 */
function ProfileViewContent() {
  const { profile, isLoading, error, updateProfile, isUpdating, toggleReminder, isTogglingReminder } = useProfile();

  // Handle form submission
  const handleSubmit = (data: UpdateProfileCommand) => {
    updateProfile(data, {
      onSuccess: () => {
        toast.success("Profil został zaktualizowany", {
          description: "Twoje zmiany zostały pomyślnie zapisane.",
        });
      },
      onError: (error) => {
        toast.error("Nie udało się zaktualizować profilu", {
          description: error.message || "Spróbuj ponownie później.",
        });
      },
    });
  };

  // Handle reminder toggle
  const handleReminderToggle = (enabled: boolean) => {
    toggleReminder(enabled, {
      onSuccess: () => {
        toast.success(enabled ? "Przypomnienia włączone" : "Przypomnienia wyłączone", {
          description: enabled
            ? "Będziesz otrzymywać codzienne przypomnienia e-mail."
            : "Nie będziesz już otrzymywać przypomnień e-mail.",
        });
      },
      onError: (error) => {
        toast.error("Nie udało się zmienić ustawień przypomnień", {
          description: error.message || "Spróbuj ponownie później.",
        });
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div
            className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="sr-only">Ładowanie...</span>
          </div>
          <p className="text-sm text-muted-foreground">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">Wystąpił błąd</h2>
          <p className="text-sm text-muted-foreground">
            {error.message === "Profile not found"
              ? "Nie znaleziono profilu. Zostaniesz przekierowany do kreatora profilu."
              : "Nie udało się załadować profilu. Spróbuj ponownie później."}
          </p>
        </div>
      </div>
    );
  }

  // No profile - redirect to setup
  if (!profile) {
    // In a real app, we'd use navigation here
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Brak profilu. Przekierowanie do kreatora...</p>
        </div>
      </div>
    );
  }

  // Main content with form
  return (
    <>
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Ustawienia Profilu</h1>
          <p className="mt-2 text-sm text-muted-foreground">Zarządzaj swoimi danymi osobowymi i preferencjami</p>
        </header>

        <div className="space-y-6">
          {/* Profile Form */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold">Dane osobowe</h2>
            <ProfileForm initialData={profile} onSubmit={handleSubmit} isSubmitting={isUpdating} />
          </div>

          {/* Reminder Toggle */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold">Przypomnienia</h2>
            <ReminderToggle
              enabled={profile.reminder_enabled}
              onToggle={handleReminderToggle}
              disabled={isTogglingReminder}
            />
          </div>

          {/* Theme Toggle */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold">Wygląd</h2>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

/**
 * Main ProfileView component with QueryClientProvider
 * This is the entry point for the profile settings page
 */
export default function ProfileView() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileViewContent />
    </QueryClientProvider>
  );
}
