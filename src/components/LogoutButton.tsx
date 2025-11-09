// src/components/LogoutButton.tsx
import { useState } from "react";
import { authApiClient } from "@/lib/api/auth.client";

/**
 * Logout button component
 * Handles user logout and redirects to login page
 */
export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Call logout API endpoint
      await authApiClient.logout();

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout failed:", error);
      // Even if API call fails, redirect to login
      // This ensures user can't get stuck
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label="Wyloguj się"
    >
      {isLoading ? "Wylogowywanie..." : "Wyloguj się"}
    </button>
  );
}
