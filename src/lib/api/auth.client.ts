// src/lib/api/auth.client.ts
import type { AuthResponse, LoginRequest, RegisterRequest, ForgotPasswordRequest } from "@/types";

/**
 * Client for authentication API endpoints
 * Handles communication between React components and API routes
 */
export class AuthApiClient {
  /**
   * Authenticates a user with email and password
   *
   * @param data - Login credentials
   * @returns User and session data
   * @throws {Error} When authentication fails
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Nieprawidłowy email lub hasło");
      }
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.details || "Błąd walidacji");
      }
      throw new Error("Nie udało się zalogować");
    }

    return response.json();
  }

  /**
   * Registers a new user
   *
   * @param data - Registration data
   * @returns User and session data
   * @throws {Error} When registration fails
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.details || "Błąd walidacji");
      }
      if (response.status === 409) {
        throw new Error("Użytkownik o podanym adresie email już istnieje");
      }
      throw new Error("Nie udało się zarejestrować");
    }

    return response.json();
  }

  /**
   * Signs out the current user
   *
   * @throws {Error} When sign out fails
   */
  async logout(): Promise<void> {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Nie udało się wylogować");
    }
  }

  /**
   * Sends a password reset email
   *
   * @param data - Email address
   * @throws {Error} When sending email fails
   */
  async sendPasswordResetEmail(data: ForgotPasswordRequest): Promise<void> {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Nie udało się wysłać emaila");
    }
  }

  /**
   * Resets user password with a new password
   * Requires an active recovery session (from email link)
   *
   * @param password - New password
   * @throws {Error} When password reset fails
   */
  async resetPassword(password: string): Promise<void> {
    // Get current session to include access token
    const { supabaseClient } = await import("@/db/supabase.client");
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Include access token if available
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers,
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Link resetowania hasła wygasł lub jest nieprawidłowy");
      }
      throw new Error("Nie udało się zresetować hasła");
    }
  }

  /**
   * Gets the currently authenticated user
   *
   * @returns User data or null if not authenticated
   */
  async getCurrentUser(): Promise<any> {
    const response = await fetch("/api/auth/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Nie udało się pobrać danych użytkownika");
    }

    return response.json();
  }
}

// Export singleton instance
export const authApiClient = new AuthApiClient();
